"""Thin HTTP controllers for documents."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.documents.serializers import DocumentUploadSerializer
from apps.documents.services import create_document_from_upload, document_status_payload, get_document


class DocumentListCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        uploaded = data.pop("file")
        doc = create_document_from_upload(uploaded, data)
        return Response(doc.to_api_dict(), status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, doc_id: str):
        doc = get_document(doc_id)
        if not doc:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(doc.to_api_dict())


class DocumentStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, doc_id: str):
        doc = get_document(doc_id)
        if not doc:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(document_status_payload(doc))