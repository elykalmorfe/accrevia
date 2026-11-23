from django.urls import path
from .repository_views import RepositorySnapshotView, RepositoryMutationView, RepositoryEventsView, RepositoryFileStageView, RepositoryOriginalView
from .repository_access_views import RepositoryAssignmentsView

urlpatterns = [
    path('assignments/', RepositoryAssignmentsView.as_view()),
    path('', RepositorySnapshotView.as_view()),
    path('mutate/', RepositoryMutationView.as_view()),
    path('events/', RepositoryEventsView.as_view()),
    path('files/', RepositoryFileStageView.as_view()),
    path('files/<str:document_id>/', RepositoryOriginalView.as_view()),
]
