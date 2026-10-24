"""Senhas e tokens de sessão só com a biblioteca padrão (sem dependência nova)."""

import hashlib
import hmac
import secrets
import threading
import time

PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 120_000


def hash_password(password: str, iterations: int = PASSWORD_ITERATIONS) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations)
    return f"{PASSWORD_ALGORITHM}${iterations}${salt}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    try:
        algorithm, iterations, salt, expected = (stored or "").split("$")
        if algorithm != PASSWORD_ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations))
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), expected)


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class LoginThrottle:
    """Depois de MAX_FAILURES senhas erradas para o mesmo apelido, bloqueia por LOCK_SECONDS (em memória)."""

    MAX_FAILURES = 5
    LOCK_SECONDS = 30.0

    def __init__(self, clock=time.monotonic) -> None:
        self._clock = clock
        self._failures: dict[str, tuple[int, float]] = {}
        self._lock = threading.Lock()

    def locked(self, key: str) -> bool:
        with self._lock:
            count, until = self._failures.get(key, (0, 0.0))
            return count >= self.MAX_FAILURES and self._clock() < until

    def fail(self, key: str) -> None:
        with self._lock:
            count, until = self._failures.get(key, (0, 0.0))
            if count >= self.MAX_FAILURES and self._clock() >= until:
                count = 0
            count += 1
            self._failures[key] = (count, self._clock() + self.LOCK_SECONDS)

    def succeed(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)
