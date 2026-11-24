from django.urls import path
from .repository_views import RepositorySnapshotView, RepositoryMutationView, RepositoryEventsView, RepositoryFileStageView, RepositoryOriginalView
from .repository_access_views import RepositoryAssignmentsView
from .certificate_views import CertificateAccessView, CertificatePreviewView, CertificateDefaultsView

urlpatterns = [
    path('certificates/access/', CertificateAccessView.as_view()),
    path('certificates/preview/', CertificatePreviewView.as_view()),
    path('certificates/defaults/', CertificateDefaultsView.as_view()),
    path('assignments/', RepositoryAssignmentsView.as_view()),
    path('', RepositorySnapshotView.as_view()),
    path('mutate/', RepositoryMutationView.as_view()),
    path('events/', RepositoryEventsView.as_view()),
    path('files/', RepositoryFileStageView.as_view()),
    path('files/<str:document_id>/', RepositoryOriginalView.as_view()),
]
