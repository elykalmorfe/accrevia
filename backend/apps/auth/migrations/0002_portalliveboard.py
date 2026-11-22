from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accrevia_auth", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PortalLiveBoard",
            fields=[
                ("id", models.PositiveSmallIntegerField(default=1, primary_key=True, serialize=False)),
                ("revision", models.PositiveIntegerField(default=0)),
                ("document_requests", models.JSONField(blank=True, default=list)),
                ("notifications", models.JSONField(blank=True, default=list)),
                ("access_requests", models.JSONField(blank=True, default=list)),
                ("technical_reviews", models.JSONField(blank=True, default=list)),
            ],
            options={
                "db_table": "portal_live_board",
            },
        ),
    ]
