import json
from unittest.mock import patch

from django.test import Client, TestCase

from apps.auth.directory import hash_password
from apps.auth.models import PortalAccount
from apps.documents.models import EvidenceDocument


class SearchAuthorizationTests(TestCase):
    def setUp(self):
        self.account = PortalAccount.objects.create(id="search-reader", email="search-reader@example.edu", role="Faculty", approval_status="approved", portal_status="Active", password_hash=hash_password("TestPassword!234"))
        self.client = Client(enforce_csrf_checks=True)
        self.token = self.client.get("/api/accounts/session/").json()["csrfToken"]

    def post(self, path, body):
        return self.client.post(path, json.dumps(body), content_type="application/json", HTTP_X_CSRFTOKEN=self.token)

    def test_search_requires_a_server_session(self):
        self.assertEqual(self.post("/api/search/", {"q": "quality"}).status_code, 401)

    @patch("apps.search.views.dense_backend_info", return_value={"name": "test", "degraded": False})
    @patch("apps.search.views.run_search", return_value=[])
    def test_faculty_search_is_filtered_before_retrieval(self, search, backend):
        for key, confidentiality, owner in [("public", "Public", "other"), ("owned", "Internal", self.account.pk), ("private", "Internal", "other")]:
            EvidenceDocument.objects.create(id=key, title=key, storage_path="", confidentiality=confidentiality, uploaded_by=owner)
        self.post("/api/accounts/login/", {"email": self.account.email, "password": "TestPassword!234"})
        self.assertEqual(self.post("/api/search/", {"q": "quality"}).status_code, 200)
        self.assertEqual(set(search.call_args.kwargs["filters"]["documentIds"]), {"public", "owned"})

    @patch("apps.search.views.run_search")
    def test_no_grants_returns_empty_without_querying_private_index(self, search):
        self.post("/api/accounts/login/", {"email": self.account.email, "password": "TestPassword!234"})
        response = self.post("/api/search/", {"q": "quality"})
        self.assertEqual(response.json()["results"], [])
        search.assert_not_called()
