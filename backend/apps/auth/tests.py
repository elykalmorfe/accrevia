import json

from django.test import Client, TestCase

from .directory import hash_password, password_matches
from .models import PortalAccount


class ServerSessionTests(TestCase):
    def setUp(self):
        self.account = PortalAccount.objects.create(
            id="session-test", email="session-test@example.edu", role="Faculty",
            approval_status="approved", portal_status="Active",
            password_hash=hash_password("TestPassword!234"),
        )
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/accounts/session/").json()["csrfToken"]

    def post(self, path, data):
        return self.client.post(path, json.dumps(data), content_type="application/json", HTTP_X_CSRFTOKEN=self.token)

    def login(self):
        return self.post("/api/accounts/login/", {"email": self.account.email, "password": "TestPassword!234"})

    def test_login_requires_csrf_and_sets_http_only_server_session(self):
        rejected = self.client.post("/api/accounts/login/", json.dumps({"email": self.account.email, "password": "TestPassword!234"}), content_type="application/json")
        self.assertEqual(rejected.status_code, 403)
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies["sessionid"]["httponly"])
        self.assertEqual(self.client.get("/api/accounts/session/").json()["account"]["email"], self.account.email)

    def test_bad_password_does_not_create_session(self):
        response = self.post("/api/accounts/login/", {"email": self.account.email, "password": "wrong"})
        self.assertEqual(response.status_code, 401)
        self.assertIsNone(self.client.get("/api/accounts/session/").json()["account"])

    def test_deactivation_revokes_existing_session(self):
        self.login()
        self.account.portal_status = "Deactivated"
        self.account.save()
        self.assertIsNone(self.client.get("/api/accounts/session/").json()["account"])

    def test_logout_revokes_cookie_on_the_server(self):
        self.login()
        old_cookie = self.client.cookies["sessionid"].value
        self.assertEqual(self.post("/api/accounts/logout/", {}).status_code, 204)
        self.client.cookies["sessionid"] = old_cookie
        self.assertIsNone(self.client.get("/api/accounts/session/").json()["account"])

    def test_password_change_requires_current_password(self):
        self.login()
        response = self.post("/api/accounts/password/", {"currentPassword": "wrong", "newPassword": "NewPassword!456"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.post("/api/accounts/password/", {"currentPassword": "TestPassword!234", "newPassword": "NewPassword!456"}).status_code, 200)
        self.account.refresh_from_db()
        self.assertTrue(password_matches("NewPassword!456", self.account.password_hash))
        self.assertFalse(password_matches("TestPassword!234", self.account.password_hash))

    def test_anonymous_account_writes_are_denied(self):
        self.assertEqual(self.post("/api/accounts/password/", {"email": self.account.email, "passwordHash": "fake"}).status_code, 401)
        self.assertEqual(self.post("/api/accounts/approval/", {"email": self.account.email, "decision": "approved"}).status_code, 403)
        self.assertEqual(self.post("/api/accounts/sync/", {"accounts": [], "users": []}).status_code, 403)

    def test_password_change_revokes_other_browser_sessions(self):
        self.login()
        other = Client(enforce_csrf_checks=True)
        token = other.get("/api/accounts/session/").json()["csrfToken"]
        other.post("/api/accounts/login/", json.dumps({"email": self.account.email, "password": "TestPassword!234"}), content_type="application/json", HTTP_X_CSRFTOKEN=token)
        self.post("/api/accounts/password/", {"currentPassword": "TestPassword!234", "newPassword": "NewPassword!456"})
        self.assertIsNone(other.get("/api/accounts/session/").json()["account"])
        self.assertIsNotNone(self.client.get("/api/accounts/session/").json()["account"])

    def test_faculty_cannot_promote_itself(self):
        self.login()
        response = self.client.put("/api/accounts/users/", json.dumps({"user": {"email": self.account.email, "role": "Superadmin", "status": "Active"}}), content_type="application/json", HTTP_X_CSRFTOKEN=self.token)
        self.assertEqual(response.status_code, 200)
        self.account.refresh_from_db()
        self.assertEqual(self.account.role, "Faculty")
