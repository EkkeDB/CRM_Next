from django.db import migrations


def seed_ui_only(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')
    Role.objects.get_or_create(
        name='UIOnly',
        defaults={
            'description': 'Container role for per-user UI pages access via constraints',
            'permissions': [],
            'is_active': True,
        }
    )


def unseed_ui_only(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')
    Role.objects.filter(name='UIOnly').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_seed_roles'),
    ]

    operations = [
        migrations.RunPython(seed_ui_only, reverse_code=unseed_ui_only),
    ]

