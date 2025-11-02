from django.core.management.base import BaseCommand
from django.db import transaction
from time import sleep
from django.utils.timezone import now as timezone_now
from decimal import Decimal

from apps.nextcrm.models import Counterparty_Facility, FacilityEnrichmentRun
from apps.nextcrm.geocoding import geocode_address, GeocodingError


class Command(BaseCommand):
    help = "Enrich facilities with latitude/longitude and province/region using geocoding (ES/PT/FR aware)."

    def add_arguments(self, parser):
        parser.add_argument('--country', type=str, default='', help='Comma-separated country filter (case-insensitive).')
        parser.add_argument('--limit', type=int, default=0, help='Maximum records to process (0 = no limit).')
        parser.add_argument('--chunk-size', type=int, default=25, help='Save every N records.')
        parser.add_argument('--sleep', type=float, default=0.3, help='Sleep seconds between calls to avoid rate limits.')
        parser.add_argument('--resume-from-id', type=int, default=0, help='Resume processing from facilities with id > this value.')
        parser.add_argument('--dry-run', action='store_true', help='Do not persist changes.')
        parser.add_argument('--force', action='store_true', help='Re-enrich even if fields are already present.')
        parser.add_argument('--ids', type=str, default='', help='Comma-separated facility IDs to process regardless of filters.')

    def handle(self, *args, **opts):
        countries = [c.strip().lower() for c in opts['country'].split(',') if c.strip()] if opts['country'] else []
        limit = opts['limit']
        chunk_size = max(1, opts['chunk_size'])
        pause = max(0.0, float(opts['sleep']))
        resume_from = opts['resume_from_id']
        dry_run = opts['dry_run']
        force = opts['force']

        qs = Counterparty_Facility.objects.all().order_by('id')
        ids_arg = [int(x) for x in opts['ids'].split(',') if x.strip().isdigit()] if opts['ids'] else []
        if ids_arg:
            qs = qs.filter(id__in=ids_arg)
        if resume_from:
            qs = qs.filter(id__gt=resume_from)
        if countries:
            qs = qs.filter(country__iregex=r'^(%s)$' % '|'.join([c.replace(' ', '\\s*') for c in countries]))

        total = qs.count()
        if limit:
            qs = qs[:limit]

        processed = updated = skipped = failures = 0
        buffer = []
        fail_samples = []

        run = FacilityEnrichmentRun.objects.create(
            countries=','.join(countries),
            limit=limit,
            chunk_size=chunk_size,
            sleep_seconds=pause,
            resume_from_id=resume_from,
            dry_run=dry_run,
            force=force,
            status='started',
        )

        self.stdout.write(self.style.NOTICE(f"Enriching up to {qs.count()} facilities (of {total} total). dry_run={dry_run}, force={force}"))

        for fac in qs.iterator():
            processed += 1
            query_parts = [fac.address or '', fac.city or '', fac.country or '']
            query = ', '.join([p for p in query_parts if p])
            if not query:
                skipped += 1
                continue

            needs_latlng = (fac.latitude is None or fac.longitude is None)
            needs_admin = (not fac.region or not fac.province)
            if not force and not (needs_latlng or needs_admin):
                skipped += 1
                continue

            try:
                geo = geocode_address(query)
            except GeocodingError as e:
                failures += 1
                if len(fail_samples) < 50:
                    fail_samples.append({'id': fac.id, 'query': query, 'error': str(e)})
                self.stderr.write(f"Geocode failed for id={fac.id} '{query}': {e}")
                sleep(pause)
                continue

            changed = False
            if (needs_latlng or force) and isinstance(geo.get('lat'), (int, float)) and isinstance(geo.get('lng'), (int, float)):
                if fac.latitude is None:
                    fac.latitude = Decimal(str(geo['lat']))
                    changed = True
                if fac.longitude is None:
                    fac.longitude = Decimal(str(geo['lng']))
                    changed = True
            if (needs_admin or force):
                if geo.get('region') and fac.region != geo['region']:
                    fac.region = geo['region']
                    changed = True
                if geo.get('province') and fac.province != geo['province']:
                    fac.province = geo['province']
                    changed = True

            if changed:
                if dry_run:
                    updated += 1
                else:
                    buffer.append(fac)
                    updated += 1
            else:
                skipped += 1

            # Flush in chunks and rate-limit between requests
            if not dry_run and len(buffer) >= chunk_size:
                with transaction.atomic():
                    for obj in buffer:
                        obj.save(update_fields=['latitude', 'longitude', 'region', 'province', 'updated_at'])
                buffer.clear()

            sleep(pause)

        # Final flush
        if not dry_run and buffer:
            with transaction.atomic():
                for obj in buffer:
                    obj.save(update_fields=['latitude', 'longitude', 'region', 'province', 'updated_at'])

        # Save run results
        run.processed = processed
        run.updated = updated
        run.skipped = skipped
        run.failures = failures
        run.failed_samples = fail_samples
        run.status = 'completed'
        run.finished_at = timezone_now()
        run.save(update_fields=['processed','updated','skipped','failures','failed_samples','status','finished_at'])

        self.stdout.write(self.style.SUCCESS(f"Done. processed={processed} updated={updated} skipped={skipped} failures={failures}"))
