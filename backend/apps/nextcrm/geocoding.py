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
    # Bump version when response shape changes to avoid stale caches
    return f"geocode:v5:{query.strip().lower()}"


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
    """Map Nominatim address payload to (country_code, region, province) for ES/PT/FR."""
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
        # Portugal: district ~ province; region sometimes in 'region' or 'state' or autonomous_region
        province = (
            address.get('district')
            or address.get('state_district')
            or address.get('county')  # sometimes county holds district-like info
        )
        region = (
            address.get('region')
            or address.get('state')
            or address.get('autonomous_region')
        )
        # Fallback: if still no region but province present, use province as region label
        if not region and province:
            region = province
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
    # Heuristic: split on commas, join numeric token with street
    parts = [p.strip() for p in query.split(',') if p.strip()]
    if not parts:
        return None, None, None
    street = parts[0]
    city = None
    country = None
    # If second token looks like a house number, append to street
    if len(parts) >= 2 and re.fullmatch(r"\d+[A-Za-z]?", parts[1]):
        street = f"{street} {parts[1]}"
        if len(parts) >= 3:
            city = parts[2]
        if len(parts) >= 4:
            country = parts[-1]
    else:
        if len(parts) >= 2:
            city = parts[1]
        if len(parts) >= 3:
            country = parts[-1]
    return street, city, country


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
            params = {'q': query, 'format': 'json', 'limit': 1, 'addressdetails': 1}
            if countrycodes:
                params['countrycodes'] = countrycodes
            resp = requests.get(url, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            arr = resp.json()
            # Fallback: normalized query if nothing found
            if not arr:
                q2 = _normalize_query(query)
                params['q'] = q2
                resp = requests.get(url, params=params, headers=headers, timeout=10)
                resp.raise_for_status()
                arr = resp.json()
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
                raise GeocodingError('No results')
            first = arr[0]
            admin = _extract_es_pt_fr_from_nominatim(first.get('address', {}) or {})
            result = {
                'lat': float(Decimal(str(first['lat'])).quantize(Decimal('0.000001'))),
                'lng': float(Decimal(str(first['lon'])).quantize(Decimal('0.000001'))),
                'provider': 'nominatim',
                **admin,
            }
            if return_raw:
                result['raw'] = first
    except requests.RequestException as e:
        raise GeocodingError(str(e))

    # Cache for 24 hours
    cache.set(key, result, 24 * 3600)
    return result
