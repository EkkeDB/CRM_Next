from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('nextcrm', '0016_merge_20251102_0133'),
    ]

    operations = [
        migrations.CreateModel(
            name='Counterparty_Note',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('counterparty', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='nextcrm.counterparty')),
            ],
            options={
                'db_table': 'counterparty_notes',
                'ordering': ['-created_at'],
            },
        ),
        # Index is defined via model Meta.indexes
    ]
