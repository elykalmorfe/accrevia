from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.auth"
    label = "accrevia_auth"

    def ready(self):
        from django.db.models.signals import post_save
        from apps.documents.models import EvidenceDocument
        from .repository_index import publish_index_status
        post_save.connect(publish_index_status, sender=EvidenceDocument, dispatch_uid='repository-index-status')
