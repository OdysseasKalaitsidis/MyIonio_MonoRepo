import base64
import os
import unittest
from unittest.mock import patch

from security.admin_auth import (
    AdminConfig,
    LoginRateLimiter,
    SESSION_TTL_SECONDS,
    create_admin_session,
    decode_admin_session,
    get_admin_config,
    hash_admin_password,
    verify_admin_password,
)


class AdminPasswordTests(unittest.TestCase):
    def test_scrypt_hash_accepts_only_the_original_password(self):
        encoded = hash_admin_password("correct horse battery staple", salt=b"0123456789abcdef")
        self.assertTrue(verify_admin_password("correct horse battery staple", encoded))
        self.assertFalse(verify_admin_password("incorrect horse battery staple", encoded))

    def test_short_password_is_rejected(self):
        with self.assertRaises(ValueError):
            hash_admin_password("too-short")

    def test_base64_environment_hash_is_loaded(self):
        encoded = hash_admin_password("correct horse battery staple", salt=b"0123456789abcdef")
        environment = {
            "ADMIN_USERNAME": "owner",
            "ADMIN_PASSWORD_HASH_B64": base64.b64encode(encoded.encode()).decode(),
            "ADMIN_SESSION_SECRET": "s" * 43,
            "ENVIRONMENT": "production",
        }
        with patch.dict(os.environ, environment, clear=True):
            config = get_admin_config()
        self.assertTrue(config.ready)
        self.assertTrue(config.secure_cookie)
        self.assertEqual(config.password_hash, encoded)


class AdminSessionTests(unittest.TestCase):
    def setUp(self):
        self.config = AdminConfig(
            username="owner",
            password_hash="scrypt$placeholder",
            session_secret="a" * 43,
            secure_cookie=True,
        )

    def test_signed_session_round_trip_and_expiry(self):
        token, csrf = create_admin_session(self.config, now=1_000)
        payload = decode_admin_session(token, self.config, now=1_001)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "owner")
        self.assertEqual(payload["csrf"], csrf)
        self.assertIsNone(decode_admin_session(token, self.config, now=1_000 + SESSION_TTL_SECONDS))

    def test_tampered_session_is_rejected(self):
        token, _ = create_admin_session(self.config, now=1_000)
        payload, signature = token.split(".", 1)
        replacement = "A" if payload[-1] != "A" else "B"
        self.assertIsNone(decode_admin_session(f"{payload[:-1]}{replacement}.{signature}", self.config, now=1_001))


class LoginRateLimiterTests(unittest.TestCase):
    def test_blocks_after_five_failures_and_recovers_after_window(self):
        limiter = LoginRateLimiter(attempts=5, window_seconds=900)
        for offset in range(5):
            self.assertTrue(limiter.allow("127.0.0.1", now=float(offset)))
            limiter.record_failure("127.0.0.1", now=float(offset))
        self.assertFalse(limiter.allow("127.0.0.1", now=5.0))
        self.assertTrue(limiter.allow("127.0.0.1", now=905.0))


if __name__ == "__main__":
    unittest.main()
