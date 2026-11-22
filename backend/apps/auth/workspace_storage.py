"""The explicitly selected browser snapshot used by portable development copies."""
from .models import PortalCollection, PortalRecord


def workspace_source():
    record = PortalRecord.objects.filter(collection_id="workspace/config").first()
    return record.data.get("source") if record and isinstance(record.data, dict) else None


def workspace_records():
    source = workspace_source()
    if not source:
        return {}
    values = {collection.id[len(source) + 1:]: [] for collection in PortalCollection.objects.filter(id__startswith=source + "/")}
    for row in PortalRecord.objects.filter(collection__id__startswith=source + "/").order_by("position"):
        name = row.collection_id[len(source) + 1:]
        values.setdefault(name, []).append(row.data)
    arrays = {"frameworks", "areas", "campuses", "copcRecords", "criteria", "documents", "folders",
              "iaRecords", "indicators", "isoRecords", "pending", "pqaRecords", "programAccreditations",
              "shares", "accessLog", "recentSearches", "saved_ids", "hidden_folders", "dismissed_reminders"}
    return {key: value if key in arrays else value[0] if value else None for key, value in values.items()}
