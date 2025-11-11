"""
Geocoding utility for facilities.
Supports pluggable providers via env and caches results.
"""

from decouple import config
from decimal import Decimal
from django.core.cache import cache
import unicodedata
import re
import requests


class GeocodingError(Exception):
    pass


def _cache_key(query: str) -> str:
    # Bump version when response mapping changes to avoid stale caches
    return f"geocode:v7:{query.strip().lower()}"


def _normalize_name(name: str) -> str:
    try:
        return ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn').lower().strip()
    except Exception:
        return (name or '').lower().strip()


def _province_from_single_province_region_es(region: str) -> str | None:
    if not region:
        return None
    r = _normalize_name(region)
    mapping = {
        'comunidad de madrid': 'Madrid',
        'madrid': 'Madrid',
        'principado de asturias': 'Asturias',
        'asturias': 'Asturias',
        'cantabria': 'Cantabria',
        'region de murcia': 'Murcia',
        'región de murcia': 'Murcia',
        'murcia': 'Murcia',
        'la rioja': 'La Rioja',
        'comunidad foral de navarra': 'Navarra',
        'navarra': 'Navarra',
        'islas baleares': 'Islas Baleares',
        'illes balears': 'Islas Baleares',
    }
    return mapping.get(r)


def _extract_es_pt_fr_from_nominatim(address: dict) -> dict:
    """Map Nominatim address payload to (country_code, region, province) for ES/PT/FR.

    For Portugal specifically, derive region as the District (Distrito) when possible,
    avoiding municipalities like Ovar being used as region. Prefer the `district` or
    `state_district` fields; otherwise, infer from ISO3166-2 codes or known district names.
    """
    cc = (address.get('country_code') or '').lower()
    region = province = None
    if cc == 'es':
        # Spain: region (comunidad) often in state; province present or in county
        region = (
            address.get('state')
            or address.get('region')
            or address.get('archipelago')
            or address.get('island_group')
            or address.get('state_district')
        )
        province = address.get('province') or address.get('county') or address.get('state_district')
        # Fallback for single-province autonomous communities (e.g., Madrid)
        if not province and region:
            province = _province_from_single_province_region_es(region)
        # Canary Islands mappings
        prov_norm = _normalize_name(province or '')
        reg_norm = _normalize_name(region or '')
        if not region and (
            'las palmas' in prov_norm or 'santa cruz de tenerife' in prov_norm or 'tenerife' in prov_norm
        ):
            region = 'Islas Canarias'
        # Correct region mislabels like 'Las Palmas' -> 'Islas Canarias'
        if reg_norm in ('las palmas', 'santa cruz de tenerife'):
            region = 'Islas Canarias'
        # Autonomous cities Ceuta/Melilla
        rnorm = _normalize_name(region or '')
        if not province and rnorm in ('ceuta', 'ciudad autonoma de ceuta', 'ciudad autónoma de ceuta'):
            province = 'Ceuta'
        if not province and rnorm in ('melilla', 'ciudad autonoma de melilla', 'ciudad autónoma de melilla'):
            province = 'Melilla'
    elif cc == 'pt':
        # Portugal mapping (aligned to requested semantics):
        #  - region: District (Distrito). Avoid using municipality/city as region.
        #  - province: municipality/city/town/village (local area)
        # Step 1: direct district fields
        region = address.get('district') or address.get('state_district')

        # Step 2: infer district from ISO3166-2 codes if needed
        if not region:
            code = (
                address.get('ISO3166-2-lvl6')
                or address.get('ISO3166-2-lvl5')
                or address.get('ISO3166-2-lvl4')
                or address.get('ISO3166-2-lvl3')
            )
            pt_iso = {
                'PT-01': 'Aveiro',
                'PT-02': 'Beja',
                'PT-03': 'Braga',
                'PT-04': 'Braganca',
                'PT-05': 'Castelo Branco',
                'PT-06': 'Coimbra',
                'PT-07': 'Evora',
                'PT-08': 'Faro',
                'PT-09': 'Guarda',
                'PT-10': 'Leiria',
                'PT-11': 'Lisboa',
                'PT-12': 'Portalegre',
                'PT-13': 'Porto',
                'PT-14': 'Santarem',
                'PT-15': 'Setubal',
                'PT-16': 'Viana do Castelo',
                'PT-17': 'Vila Real',
                'PT-18': 'Viseu',
                'PT-20': 'Azores',
                'PT-30': 'Madeira',
            }
            if code and code in pt_iso:
                region = pt_iso[code]

        # Step 3: prefer state/region fields if they correspond to a known district
        if not region:
            def _norm(s: str | None) -> str:
                return _normalize_name(s or '')

            known = { _norm(n): n for n in [
                'Aveiro','Beja','Braga','Braganca','Castelo Branco','Coimbra','Evora','Faro','Guarda',
                'Leiria','Lisboa','Portalegre','Porto','Santarem','Setubal','Viana do Castelo','Vila Real','Viseu',
                'Azores','Madeira'
            ] }
            for cand in [address.get('state'), address.get('region'), address.get('autonomous_region')]:
                if _norm(cand) in known:
                    region = known[_norm(cand)]
                    break

        # Step 4: only use county if it matches a known district (avoid municipalities like Ovar)
        if not region:
            county = address.get('county')
            norm_county = _normalize_name(county or '')
            if 'known' in locals() and norm_county in known:
                region = known[norm_county]

        # Province: local administrative area
        province = (
            address.get('municipality')
            or address.get('city')
            or address.get('town')
            or address.get('village')
        )
    elif cc == 'fr':
        # France: region in state; department in county/state_district
        region = address.get('state') or address.get('region')
        province = address.get('county') or address.get('state_district')
    return {
        'country_code': cc or None,
        'region': region,
        'province': province,
    }


def _extract_es_pt_fr_from_google(components: list) -> dict:
    """Map Google address_components to (country_code, region, province) for ES/PT/FR."""
    def find(types):
        for c in components:
            ts = set(c.get('types', []))
            if any(t in ts for t in types):
                return c
        return None

    cc = None
    country = find(['country'])
    if country:
        cc = (country.get('short_name') or '').lower()
    region_c = find(['administrative_area_level_1'])
    province_c = find(['administrative_area_level_2'])
    return {
        'country_code': cc or None,
        'region': (region_c or {}).get('long_name'),
        'province': (province_c or {}).get('long_name'),
    }


def _normalize_query(q: str) -> str:
    qn = q.strip()
    # Expand common abbreviations in ES/PT/FR contexts
    repl = [
        (r"\bC\s*/\s*", "Calle "),
        (r"\bC\.\s*", "Calle "),
        (r"\bAv\.?\s*", "Avenida "),
        (r"\bR\s*/\s*", "Rua "),
        (r"\bR\.\s*", "Rua "),
    ]
    for pat, rep in repl:
        qn = re.sub(pat, rep, qn, flags=re.IGNORECASE)
    return qn


def _detect_country_codes(q: str) -> str | None:
    ql = q.lower()
    if any(k in ql for k in [' spain', ' españa', ' espana', ', es', ' spain']):
        return 'es'
    if any(k in ql for k in [' portugal', ', pt']):
        return 'pt'
    if any(k in ql for k in [' france', ' francia', ', fr']):
        return 'fr'
    return None


def _parse_street_city_country(query: str) -> tuple[str | None, str | None, str | None]:
    parts = [p.strip() for p in query.split(',') if p.strip()]
    if not parts:
        return None, None, None
    if len(parts) >= 3:
        country = parts[-1]
        city = parts[-2]
        street = ', '.join(parts[:-2]).strip() or None
        return street, city, country
    if len(parts) == 2:
        street, city = parts[0], parts[1]
        return street, city, None
    return parts[0], None, None


def geocode_address(query: str, return_raw: bool = False) -> dict:
    """
    Geocode an address string and return {'lat': float, 'lng': float, 'provider': str,
    'country_code': str|None, 'region': str|None, 'province': str|None}.
    Caches results to reduce provider load.
    """
    if not query or not query.strip():
        raise GeocodingError("Empty query")

    key = _cache_key(query)
    cached = cache.get(key)
    if cached:
        return cached

    provider = config('GEOCODER_PROVIDER', default='nominatim').lower()
    user_agent = config('GEOCODER_USER_AGENT', default='NextCRM/1.0 (support@nextcrm.com)')

    try:
        if provider == 'google':
            api_key = config('GOOGLE_MAPS_API_KEY', default='')
            if not api_key:
                raise GeocodingError('GOOGLE_MAPS_API_KEY not configured')
            url = 'https://maps.googleapis.com/maps/api/geocode/json'
            resp = requests.get(url, params={'address': query, 'key': api_key}, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if data.get('status') != 'OK' or not data.get('results'):
                raise GeocodingError(f"Geocoding failed: {data.get('status')}")
            first = data['results'][0]
            loc = first['geometry']['location']
            admin = _extract_es_pt_fr_from_google(first.get('address_components', []))
            result = {
                'lat': float(Decimal(str(loc['lat'])).quantize(Decimal('0.000001'))),
                'lng': float(Decimal(str(loc['lng'])).quantize(Decimal('0.000001'))),
                'provider': 'google',
                **admin,
            }
            if return_raw:
                result['raw'] = first
        else:
            # Default to Nominatim
            url = 'https://nominatim.openstreetmap.org/search'
            headers = {
                'User-Agent': user_agent,
                'Accept-Language': config('GEOCODER_ACCEPT_LANGUAGE', default='es,en,pt,fr')
            }
            countrycodes = _detect_country_codes(query)
            # Track whether we fell back to a city centroid and why
            used_city_fallback = False
            fallback_message = None
            params = {'q': query, 'format': 'json', 'limit': 1, 'addressdetails': 1}
            if countrycodes:
                params['countrycodes'] = countrycodes
            resp = requests.get(url, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            arr = resp.json()
            # If free-text result exists but city mismatches, prefer city+country fallback
            if arr:
                try:
                    street, city, country = _parse_street_city_country(query)
                    if city or country:
                        cand_addr = (arr[0].get('address') or {}) if isinstance(arr, list) and arr else {}
                        cand_city = cand_addr.get('city') or cand_addr.get('town') or cand_addr.get('municipality') or cand_addr.get('village')
                        if city and cand_city and _normalize_name(cand_city) != _normalize_name(city):
                            sparams_fix = {'format': 'json', 'limit': 1, 'addressdetails': 1, 'city': city or '', 'country': country or ''}
                            if countrycodes:
                                sparams_fix['countrycodes'] = countrycodes
                            resp_fix = requests.get(url, params=sparams_fix, headers=headers, timeout=10)
                            resp_fix.raise_for_status()
                            arr_fix = resp_fix.json()
                            if arr_fix:
                                arr = arr_fix
                                used_city_fallback = True
                                fallback_message = 'Street mismatch; using city centroid'
                except Exception:
                    pass
            # Fallback: normalized query if nothing found
            if not arr:
                q2 = _normalize_query(query)
                params['q'] = q2
                resp = requests.get(url, params=params, headers=headers, timeout=10)
                resp.raise_for_status()
                arr = resp.json()
                # If free-text result mismatches requested city, prefer city+country fallback
                if arr:
                    try:
                        street, city, country = _parse_street_city_country(query)
                        if city or country:
                            cand_addr = (arr[0].get('address') or {}) if isinstance(arr, list) and arr else {}
                            cand_city = cand_addr.get('city') or cand_addr.get('town') or cand_addr.get('municipality') or cand_addr.get('village')
                            if city and cand_city and _normalize_name(cand_city) != _normalize_name(city):
                                sparams2 = {'format': 'json', 'limit': 1, 'addressdetails': 1, 'city': city or '', 'country': country or ''}
                                if countrycodes:
                                    sparams2['countrycodes'] = countrycodes
                                resp_fix = requests.get(url, params=sparams2, headers=headers, timeout=10)
                                resp_fix.raise_for_status()
                                arr2 = resp_fix.json()
                                if arr2:
                                    arr = arr2
                                    used_city_fallback = True
                                    fallback_message = 'Street mismatch; using city centroid'
                    except Exception:
                        pass
            # Fallback: structured search (street/city/country)
            if not arr:
                street, city, country = _parse_street_city_country(query)
                if street or city or country:
                    # City synonyms/variants
                    cities = []
                    if city:
                        cities.append(city)
                        cnorm = _normalize_name(city)
                        # PT: Mem Martins is part of Algueirão-Mem Martins (Sintra)
                        if 'mem martins' in cnorm and 'algueirao-mem martins' not in cnorm:
                            cities.append('Algueirão-Mem Martins')
                            cities.append('Sintra')
                        if 'algueirao' in cnorm and 'mem martins' not in cnorm:
                            cities.append('Algueirão-Mem Martins')
                    else:
                        cities.append(None)
                    for ctry in [country, 'Portugal' if countrycodes == 'pt' else None, 'Spain' if countrycodes == 'es' else None, 'France' if countrycodes == 'fr' else None]:
                        if ctry is None:
                            continue
                        for ccity in cities:
                            sparams = {
                                'format': 'json', 'limit': 1, 'addressdetails': 1,
                                'street': street or '', 'city': ccity or '', 'country': ctry
                            }
                            if countrycodes:
                                sparams['countrycodes'] = countrycodes
                            resp2 = requests.get(url, params=sparams, headers=headers, timeout=10)
                            resp2.raise_for_status()
                            arr2 = resp2.json()
                            if arr2:
                                arr = arr2
                                break
                        if arr:
                            break
            if not arr:
                # Last-resort: try city+country only to at least place the marker in the city
                street, city, country = _parse_street_city_country(query)
                if city or country:
                    q3 = ", ".join([p for p in [city, country] if p])
                    if q3:
                        params3 = {'q': q3, 'format': 'json', 'limit': 1, 'addressdetails': 1}
                        if countrycodes:
                            params3['countrycodes'] = countrycodes
                        resp3 = requests.get(url, params=params3, headers=headers, timeout=10)
                        resp3.raise_for_status()
                        arr = resp3.json()
                        if arr:
                            used_city_fallback = True
                            fallback_message = 'Street not found; using city centroid'
            if not arr:
                raise GeocodingError('No results')
            first = arr[0]
            admin = _extract_es_pt_fr_from_nominatim(first.get('address', {}) or {})
            result = {
                'lat': float(Decimal(str(first['lat'])).quantize(Decimal('0.000001'))),
                'lng': float(Decimal(str(first['lon'])).quantize(Decimal('0.000001'))),
                'provider': 'nominatim',
                **admin,
            }
            if used_city_fallback:
                result['precision'] = 'city'
                if fallback_message:
                    result['message'] = fallback_message
            if return_raw:
                result['raw'] = first
    except requests.RequestException as e:
        raise GeocodingError(str(e))

    # Cache for 24 hours
    cache.set(key, result, 24 * 3600)
    return result





