"""Thin HTTP controllers for documents."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.documents.serializers import DocumentUploadSerializer
from apps.documents.services import create_document_from_upload, document_status_payload, get_document
from apps.auth.repository_views import account_for
from apps.auth.repository import may_write, campus_id, may_read
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from apps.auth.models import RepositoryEntry
from apps.auth.repository import record


def authorized_document(account, doc):
    if not doc:
        return False
    entry = RepositoryEntry.objects.filter(kind='document', record_id=doc.pk).first()
    return (not entry.deleted and may_read(account, record(entry))) if entry else may_read(account, doc.to_api_dict())


@method_decorator(csrf_protect, name='dispatch')
class DocumentListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        account = account_for(request)
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        from apps.auth.certificate_access import require_management
        require_management(account,data)
        may_write(account, campus_id(data.get('campusId') or data.get('campus')), 'accreditation', data)
        data['uploadedBy'] = account.pk
        uploaded = data.pop("file")
        doc = create_document_from_upload(uploaded, data)
        return Response(doc.to_api_dict(), status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, doc_id: str):
        account = account_for(request)
        doc = get_document(doc_id)
        if not authorized_document(account, doc):
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(doc.to_api_dict())


class DocumentStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, doc_id: str):
        account = account_for(request)
        doc = get_document(doc_id)
        if not authorized_document(account, doc):
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(document_status_payload(doc))
