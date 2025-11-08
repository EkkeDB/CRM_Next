from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('permissions', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'auth_roles',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='UserRoleAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('constraints', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='assignments', to='authentication.role')),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='role_assignments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'auth_user_role_assignments',
                'ordering': ['user_id'],
            },
        ),
        migrations.AddIndex(
            model_name='userroleassignment',
            index=models.Index(fields=['user'], name='authentication_user_idx'),
        ),
        migrations.AddIndex(
            model_name='userroleassignment',
            index=models.Index(fields=['role'], name='authentication_role_idx'),
        ),
    ]

