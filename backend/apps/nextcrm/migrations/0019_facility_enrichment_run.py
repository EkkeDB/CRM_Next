from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0018_facility_region_province'),
    ]

    operations = [
        migrations.CreateModel(
            name='FacilityEnrichmentRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('started', 'Started'), ('completed', 'Completed'), ('failed', 'Failed')], default='started', max_length=16)),
                ('countries', models.CharField(blank=True, max_length=200)),
                ('limit', models.IntegerField(default=0)),
                ('chunk_size', models.IntegerField(default=25)),
                ('sleep_seconds', models.DecimalField(decimal_places=2, default=0.3, max_digits=5)),
                ('resume_from_id', models.IntegerField(default=0)),
                ('dry_run', models.BooleanField(default=False)),
                ('force', models.BooleanField(default=False)),
                ('processed', models.IntegerField(default=0)),
                ('updated', models.IntegerField(default=0)),
                ('skipped', models.IntegerField(default=0)),
                ('failures', models.IntegerField(default=0)),
                ('failed_samples', models.JSONField(blank=True, null=True)),
            ],
            options={
                'db_table': 'facility_enrichment_runs',
                'ordering': ['-started_at'],
            },
        ),
    ]

