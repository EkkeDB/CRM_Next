from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("nextcrm", "0011_denest_commodity_taxonomy"),
    ]

    operations = [
        migrations.AddField(
            model_name="commodity",
            name="commodity_group",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.PROTECT, to="nextcrm.commodity_group"),
        ),
        migrations.AddField(
            model_name="commodity",
            name="commodity_type",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.PROTECT, to="nextcrm.commodity_type"),
        ),
    ]

