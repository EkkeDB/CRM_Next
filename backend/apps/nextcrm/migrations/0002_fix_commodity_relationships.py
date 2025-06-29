# Generated manually to fix commodity relationships

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0001_initial'),
    ]

    operations = [
        # Add the missing commodity_group foreign key to Commodity_Type
        migrations.AddField(
            model_name='commodity_type',
            name='commodity_group',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='commodity_types',
                to='nextcrm.commodity_group',
                default=1  # Temporary default - will be updated below
            ),
            preserve_default=False,
        ),
        
        # Add the missing commodity_type foreign key to Commodity_Subtype
        migrations.AddField(
            model_name='commodity_subtype',
            name='commodity_type',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='commodity_subtypes',
                to='nextcrm.commodity_type',
                default=1  # Temporary default - will be updated below
            ),
            preserve_default=False,
        ),
        
        # Remove the incorrect direct foreign keys from Commodity model
        migrations.RemoveField(
            model_name='commodity',
            name='commodity_group',
        ),
        
        migrations.RemoveField(
            model_name='commodity',
            name='commodity_type',
        ),
        
        # Update the commodity_subtype field to have correct related_name
        migrations.AlterField(
            model_name='commodity',
            name='commodity_subtype',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='commodities',
                to='nextcrm.commodity_subtype'
            ),
        ),
    ]