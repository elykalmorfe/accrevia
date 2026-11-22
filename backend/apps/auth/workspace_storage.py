"""The explicitly selected browser snapshot used by portable development copies."""
from django.db import DEFAULT_DB_ALIAS, connections

from .models import PortalCollection, PortalRecord


def workspace_database():
    return "workspace" if "workspace" in connections else DEFAULT_DB_ALIAS


def workspace_source():
    record = PortalRecord.objects.using(workspace_database()).filter(collection_id="workspace/config").first()
    return record.data.get("source") if record and isinstance(record.data, dict) else None


def workspace_records():
    source = workspace_source()
    if not source:
        return {}
    database = workspace_database()
    collections = PortalCollection.objects.using(database).filter(id__startswith=source + "/")
    values = {collection.id[len(source) + 1:]: [] for collection in collections}
    records = PortalRecord.objects.using(database).filter(collection__id__startswith=source + "/").order_by("position")
    for row in records:
        name = row.collection_id[len(source) + 1:]
        values.setdefault(name, []).append(row.data)
    arrays = {"frameworks", "areas", "campuses", "copcRecords", "criteria", "documents", "folders",
              "iaRecords", "indicators", "isoRecords", "pending", "pqaRecords", "programAccreditations",
              "shares", "accessLog", "recentSearches", "saved_ids", "hidden_folders", "dismissed_reminders"}
    return {key: value if key in arrays else value[0] if value else None for key, value in values.items()}
