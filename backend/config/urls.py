from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.auth.views import DockerDesktopProbeView, RootView
from apps.auth.portal_storage_views import PortalFilesView, PortalRecordsView

urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("json/version", DockerDesktopProbeView.as_view(), name="docker-desktop-probe"),
    path("admin/", admin.site.urls),
    path("api/health/", include("apps.auth.urls")),
    path("api/accounts/", include("apps.auth.account_urls")),
    path("api/live/", include("apps.auth.live_urls")),
    path("api/portal-storage/<uuid:browser_id>/records/", PortalRecordsView.as_view(), name="portal-records"),
    path("api/portal-storage/<uuid:browser_id>/files/", PortalFilesView.as_view(), name="portal-files"),
    path("api/documents/", include("apps.documents.urls")),
    path("api/search/", include("apps.search.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
