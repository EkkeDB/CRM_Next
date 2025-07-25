# Generated by Django 5.2.1 on 2025-06-09 12:48

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("phone", models.CharField(blank=True, max_length=17)),
                ("company", models.CharField(blank=True, max_length=100)),
                ("position", models.CharField(blank=True, max_length=100)),
                ("timezone", models.CharField(default="UTC", max_length=50)),
                ("is_mfa_enabled", models.BooleanField(default=False)),
                ("failed_login_attempts", models.IntegerField(default=0)),
                ("account_locked_until", models.DateTimeField(blank=True, null=True)),
                ("last_login_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("gdpr_consent", models.BooleanField(default=False)),
                ("gdpr_consent_date", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("last_activity", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User Profile",
                "verbose_name_plural": "User Profiles",
                "db_table": "user_profiles",
            },
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("CREATE", "Create"),
                            ("UPDATE", "Update"),
                            ("DELETE", "Delete"),
                            ("VIEW", "View"),
                            ("EXPORT", "Export"),
                        ],
                        max_length=10,
                    ),
                ),
                ("model_name", models.CharField(max_length=50)),
                ("object_id", models.CharField(blank=True, max_length=50)),
                ("object_repr", models.CharField(max_length=200)),
                ("changes", models.JSONField(default=dict)),
                ("ip_address", models.GenericIPAddressField()),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "audit_logs",
                "ordering": ["-timestamp"],
                "indexes": [
                    models.Index(
                        fields=["user", "timestamp"],
                        name="audit_logs_user_id_88267f_idx",
                    ),
                    models.Index(
                        fields=["model_name", "timestamp"],
                        name="audit_logs_model_n_764981_idx",
                    ),
                    models.Index(
                        fields=["action", "timestamp"],
                        name="audit_logs_action_474804_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="SecurityLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("LOGIN_SUCCESS", "Successful Login"),
                            ("LOGIN_FAILED", "Failed Login"),
                            ("LOGOUT", "Logout"),
                            ("PASSWORD_CHANGE", "Password Changed"),
                            ("ACCOUNT_LOCKED", "Account Locked"),
                            ("SUSPICIOUS_ACTIVITY", "Suspicious Activity"),
                        ],
                        max_length=25,
                    ),
                ),
                ("ip_address", models.GenericIPAddressField()),
                ("user_agent", models.TextField()),
                ("metadata", models.JSONField(default=dict)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "security_logs",
                "ordering": ["-timestamp"],
                "indexes": [
                    models.Index(
                        fields=["user", "event_type", "timestamp"],
                        name="security_lo_user_id_30ed98_idx",
                    ),
                    models.Index(
                        fields=["ip_address", "timestamp"],
                        name="security_lo_ip_addr_0efe7c_idx",
                    ),
                ],
            },
        ),
    ]
