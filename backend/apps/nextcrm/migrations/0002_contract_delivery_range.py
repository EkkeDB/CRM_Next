from django.db import migrations, models


def backfill_contract_delivery_range(apps, schema_editor):
    Contract = apps.get_model('nextcrm', 'Contract')
    for c in Contract.objects.all().only('id', 'delivery_period', 'delivery_period_start', 'delivery_period_end'):
        dp = getattr(c, 'delivery_period', None)
        dps = getattr(c, 'delivery_period_start', None)
        dpe = getattr(c, 'delivery_period_end', None)
        if dp and not (dps and dpe):
            Contract.objects.filter(id=c.id).update(delivery_period_start=dp, delivery_period_end=dp)


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contract',
            name='delivery_period_start',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='contract',
            name='delivery_period_end',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.RunPython(backfill_contract_delivery_range, migrations.RunPython.noop),
    ]

