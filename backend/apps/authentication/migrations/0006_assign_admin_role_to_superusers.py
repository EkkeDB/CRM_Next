from django.db import migrations


def assign_admin_role_to_superusers(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Role = apps.get_model('authentication', 'Role')
    UserRoleAssignment = apps.get_model('authentication', 'UserRoleAssignment')

    # Ensure AdminFullAccess role exists (seeded earlier, but be resilient)
    admin_role, _ = Role.objects.get_or_create(
        name='AdminFullAccess',
        defaults={
            'description': 'Full CRUD across resources',
            'permissions': [
                'contracts:read', 'contracts:write',
                'deals:read', 'deals:write',
                'counterparties:read', 'counterparties:write',
                'contacts:read', 'contacts:write',
                'settings:read', 'settings:write',
                'exports:run',
            ],
            'is_active': True,
        }
    )

    # Assign AdminFullAccess to every superuser if not already assigned
    superusers = User.objects.filter(is_superuser=True)
    for u in superusers:
        UserRoleAssignment.objects.get_or_create(
            user=u,
            role=admin_role,
            defaults={
                'constraints': {},
                'is_active': True,
            }
        )


def unassign_admin_role_from_superusers(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Role = apps.get_model('authentication', 'Role')
    UserRoleAssignment = apps.get_model('authentication', 'UserRoleAssignment')

    try:
        admin_role = Role.objects.get(name='AdminFullAccess')
    except Role.DoesNotExist:
        return

    superusers = User.objects.filter(is_superuser=True)
    UserRoleAssignment.objects.filter(user__in=superusers, role=admin_role).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_merge_20251108_1907'),
        ('authentication', '0005_seed_ui_only_role'),
    ]

    operations = [
        migrations.RunPython(assign_admin_role_to_superusers, reverse_code=unassign_admin_role_from_superusers),
    ]

