import base64
import os
import unittest

from fastapi.testclient import TestClient

from security.admin_auth import hash_admin_password


ADMIN_PASSWORD = "correct horse battery staple"
ADMIN_HASH = hash_admin_password(ADMIN_PASSWORD, salt=b"0123456789abcdef")
os.environ.update(
    {
        "ADMIN_USERNAME": "owner",
        "ADMIN_PASSWORD_HASH_B64": base64.b64encode(ADMIN_HASH.encode()).decode(),
        "ADMIN_SESSION_SECRET": "a" * 43,
        "ADMIN_ALLOWED_ORIGINS": "https://ai.myionio.site",
        "ENVIRONMENT": "production",
    }
)

from main import app  # noqa: E402  (environment must be set before app creation)


class AdminHttpSecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app, base_url="https://ai.myionio.site")

    def test_anonymous_admin_redirects_and_pipeline_is_denied(self):
        admin = self.client.get("/admin", follow_redirects=False)
        self.assertEqual(admin.status_code, 303)
        self.assertEqual(admin.headers["location"], "/admin/login")
        self.assertEqual(self.client.get("/pipeline/types").status_code, 401)
        self.assertIn("frame-ancestors 'none'", admin.headers["content-security-policy"])

    def test_login_rejects_cross_site_origin(self):
        response = self.client.post(
            "/admin/login",
            data={"username": "owner", "password": ADMIN_PASSWORD},
            headers={"Origin": "https://evil.example"},
        )
        self.assertEqual(response.status_code, 403)

    def test_authenticated_session_requires_csrf_and_can_log_out(self):
        login = self.client.post(
            "/admin/login",
            data={"username": "owner", "password": ADMIN_PASSWORD},
            headers={"Origin": "https://ai.myionio.site"},
            follow_redirects=False,
        )
        self.assertEqual(login.status_code, 303)
        cookie = login.headers["set-cookie"].lower()
        self.assertIn("httponly", cookie)
        self.assertIn("secure", cookie)
        self.assertIn("samesite=strict", cookie)

        self.assertEqual(self.client.get("/admin").status_code, 200)
        session_response = self.client.get("/admin/session")
        self.assertEqual(session_response.status_code, 200)
        csrf = session_response.json()["csrf_token"]

        request_body = {"source_url": "https://ionio.gr/download.php?f=schedule.pdf"}
        self.assertEqual(self.client.post("/pipeline/official/import", json=request_body).status_code, 403)
        self.assertEqual(
            self.client.post(
                "/pipeline/official/import",
                json=request_body,
                headers={"X-CSRF-Token": "wrong-token"},
            ).status_code,
            403,
        )

        logout = self.client.post(
            "/admin/logout", headers={"X-CSRF-Token": csrf}, follow_redirects=False
        )
        self.assertEqual(logout.status_code, 303)
        self.assertEqual(self.client.get("/pipeline/types").status_code, 401)

    def test_unused_legacy_mutation_routes_are_not_exposed(self):
        self.assertEqual(self.client.post("/schedule/upload-schedule").status_code, 404)
        self.assertEqual(self.client.post("/menu/upload-menu").status_code, 404)
        self.assertEqual(self.client.post("/menu/dummy-menu").status_code, 404)


if __name__ == "__main__":
    unittest.main()
