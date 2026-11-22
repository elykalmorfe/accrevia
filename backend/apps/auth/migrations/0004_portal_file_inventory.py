from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accrevia_auth", "0003_portal_storage")]

    operations = [
        migrations.AlterField(model_name="portalrecord", name="data", field=models.JSONField(null=True)),
        migrations.RunSQL(
            """
            CREATE VIEW portal_file_inventory AS
            SELECT file.id, file.source, file.`key`, file.name, file.mime_type,
                   content.size_bytes, content.sha256, file.updated_at
            FROM portal_files AS file
            JOIN portal_file_contents AS content ON content.sha256 = file.content_id
            """,
            "DROP VIEW portal_file_inventory",
        ),
    ]
