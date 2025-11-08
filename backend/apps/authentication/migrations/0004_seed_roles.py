from django.db import migrations


def seed_roles(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')

    def ensure(name, desc, perms):
        obj, _ = Role.objects.get_or_create(name=name, defaults={
            'description': desc,
            'permissions': perms,
            'is_active': True,
        })
        # If exists but empty perms, update once
        if not obj.permissions:
            obj.permissions = perms
            obj.save(update_fields=['permissions'])

    reader = [
        'contracts:read', 'deals:read', 'counterparties:read', 'contacts:read', 'settings:read', 'exports:run'
    ]
    operator = reader + [
        'contracts:write', 'deals:write', 'counterparties:write', 'contacts:write', 'settings:write'
    ]
    admin = operator

    ensure('Reader', 'Read-only access with exports', reader)
    ensure('Operator', 'CRUD on core objects and exports', operator)
    ensure('AdminFullAccess', 'Full CRUD across resources', admin)


def unseed_roles(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')
    Role.objects.filter(name__in=['Reader', 'Operator', 'AdminFullAccess']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_merge_20251108_1701'),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_code=unseed_roles),
    ]

