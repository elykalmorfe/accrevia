from django.urls import path

from .account_views import (
    AccountApprovalView,
    AccountDirectoryView,
    AccountEventsView,
    AccountLoginView,
    AccountPasswordView,
    AccountRegisterView,
    AccountSyncView,
    AccountUserUpsertView,
)

urlpatterns = [
    path("directory/", AccountDirectoryView.as_view(), name="account-directory"),
    path("events/", AccountEventsView.as_view(), name="account-events"),
    path("register/", AccountRegisterView.as_view(), name="account-register"),
    path("login/", AccountLoginView.as_view(), name="account-login"),
    path("password/", AccountPasswordView.as_view(), name="account-password"),
    path("sync/", AccountSyncView.as_view(), name="account-sync"),
    path("users/", AccountUserUpsertView.as_view(), name="account-user-upsert"),
    path("approval/", AccountApprovalView.as_view(), name="account-approval"),
]
