from django.urls import path

from .views import HealthView, JwtStubView

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("token/", JwtStubView.as_view(), name="jwt-stub"),
]