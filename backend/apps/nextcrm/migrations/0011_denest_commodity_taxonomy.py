from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("nextcrm", "0010_contract_override_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="commodity_type",
            name="commodity_group",
        ),
        migrations.RemoveField(
            model_name="commodity_subtype",
            name="commodity_type",
        ),
    ]

