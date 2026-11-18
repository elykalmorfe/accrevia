from django.urls import path

from .views import DocumentDetailView, DocumentListCreateView, DocumentStatusView

urlpatterns = [
    path("", DocumentListCreateView.as_view(), name="document-create"),
    path("<str:doc_id>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<str:doc_id>/status/", DocumentStatusView.as_view(), name="document-status"),
]