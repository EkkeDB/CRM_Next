from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0014_facility_segment_and_consumption'),
    ]

    operations = [
        migrations.AlterField(
            model_name='facilityconsumption',
            name='monthly_volume',
            field=models.DecimalField(decimal_places=0, max_digits=15),
        ),
    ]

