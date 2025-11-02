from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0013_add_gmo_sustainable_to_commodity'),
    ]

    operations = [
        migrations.AddField(
            model_name='counterparty_facility',
            name='segment',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='counterparty_facility',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='counterparty_facility',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.CreateModel(
            name='FacilityConsumption',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('monthly_volume', models.DecimalField(decimal_places=3, max_digits=15)),
                ('yearly_volume', models.DecimalField(blank=True, decimal_places=3, max_digits=15, null=True)),
                ('commodity', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='nextcrm.commodity')),
                (
                    'facility',
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consumptions', to='nextcrm.counterparty_facility'),
                ),
            ],
            options={
                'db_table': 'facility_consumptions',
                'ordering': ['commodity'],
            },
        ),
        migrations.AddConstraint(
            model_name='facilityconsumption',
            constraint=models.UniqueConstraint(fields=('facility', 'commodity'), name='uniq_facility_commodity'),
        ),
        migrations.AddConstraint(
            model_name='facilityconsumption',
            constraint=models.CheckConstraint(check=models.Q(('monthly_volume__gte', 0)), name='monthly_volume_non_negative'),
        ),
        migrations.AddConstraint(
            model_name='facilityconsumption',
            constraint=models.CheckConstraint(check=(models.Q(('yearly_volume__gte', 0)) | models.Q(('yearly_volume__isnull', True))), name='yearly_volume_non_negative_or_null'),
        ),
    ]

