from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0017_counterparty_note'),
    ]

    operations = [
        migrations.AddField(
            model_name='counterparty_facility',
            name='province',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='counterparty_facility',
            name='region',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

