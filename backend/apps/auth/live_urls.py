from django.urls import path

from .folder_picker_views import ForgetPickView, PickFoldersView, PickedFolderFileView
from .live_views import LiveEventsView, LiveFileView, LiveStateView, LiveSyncView

urlpatterns = [
    path("state/", LiveStateView.as_view(), name="live-state"),
    path("sync/", LiveSyncView.as_view(), name="live-sync"),
    path("events/", LiveEventsView.as_view(), name="live-events"),
    path("files/<str:document_id>/", LiveFileView.as_view(), name="live-file"),
    path("pick-folders/", PickFoldersView.as_view(), name="pick-folders"),
    path("pick-folders/<str:pick_id>/", ForgetPickView.as_view(), name="forget-pick"),
    path("pick-folders/<str:pick_id>/<int:index>/", PickedFolderFileView.as_view(), name="picked-file"),
]
