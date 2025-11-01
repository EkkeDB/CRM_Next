from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("nextcrm", "0012_add_group_type_to_commodity"),
    ]

    operations = [
        migrations.AddField(
            model_name="commodity",
            name="is_gmo",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="commodity",
            name="is_sustainable",
            field=models.BooleanField(default=False),
        ),
    ]

