"""Legacy media links pass through the same live authorization as repository previews."""
import mimetypes
from pathlib import Path
from django.conf import settings
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from apps.documents.models import EvidenceDocument
from apps.documents.views import authorized_document
from .repository_views import account_for


class ProtectedMediaView(APIView):
    def get(self, request, file_path):
        account = account_for(request)
        root = Path(settings.MEDIA_ROOT).resolve()
        target = (root / file_path).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            raise NotFound()
        docs = EvidenceDocument.objects.filter(storage_path__in=[str(target), target.as_posix(), file_path])
        if not any(authorized_document(account, doc) for doc in docs):
            raise NotFound()
        if request.GET.get('download')=='1':
            from .models import RepositoryEntry
            from .certificate_access import is_certificate,rights
            for doc in docs:
                entry=RepositoryEntry.objects.filter(kind='document',record_id=doc.pk).first()
                if entry and is_certificate(entry.data) and not rights(account,entry.data,entry)['canDownload']:
                    raise NotFound()
        response = FileResponse(target.open('rb'), content_type=mimetypes.guess_type(target.name)[0] or 'application/octet-stream')
        response['Cache-Control'] = 'no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
