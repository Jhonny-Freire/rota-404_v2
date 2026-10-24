import re
import unicodedata
from datetime import datetime, timezone
from typing import Any

from app.errors import BadRequestError, ConflictError, TooManyRequestsError, UnauthorizedError
from app.models.catalog import AgeRange
from app.models.user import User
from app.repositories.account_repository import UserRepository
from app.repositories.age_range_repository import AgeRangeRepository
from app.repositories.data_source import Row
from app.services.auth import LoginThrottle, hash_password, hash_token, new_token, verify_password

NICKNAME_MIN, NICKNAME_MAX = 3, 16
PASSWORD_MIN, PASSWORD_MAX = 4, 64
AGE_MIN, AGE_MAX = 4, 120
DEFAULT_AVATAR = "castor"
# nível de conhecimento que o aluno declara no cadastro: junto com a idade, escolhe a galáxia (_age_range_for)
KNOWLEDGE_LEVELS = ("iniciante", "intermediario", "avancado")
NICKNAME_PATTERN = re.compile(r"^[0-9A-Za-zÀ-ÖØ-öø-ÿ _.-]+$")
AVATAR_PATTERN = re.compile(r"^[a-z0-9-]{1,32}$")
# filtro simples para o ranking público da feira: cada palavra do apelido (sem acentos) é comparada pelo
# começo, para não barrar nomes como "Computador" ou "Rolando"
BLOCKED_WORDS = (
    "porra", "caralh", "merd", "bost", "puta", "puto", "viado", "buceta", "cuzao", "fdp",
    "foder", "fodase", "piroca", "cacete", "arrombad", "otario", "vagabund", "babaca", "idiota",
)

BAD_LOGIN = "Apelido ou senha incorretos."


def normalize_nickname(raw: Any) -> str:
    return " ".join(str(raw or "").split())


def nickname_key(nickname: str) -> str:
    return unicodedata.normalize("NFKC", nickname).casefold()


def _plain_words(text: str) -> list[str]:
    decomposed = unicodedata.normalize("NFKD", text.casefold())
    plain = "".join(char for char in decomposed if not unicodedata.combining(char))
    return [word for word in re.split(r"[^0-9a-z]+", plain) if word]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserService:
    def __init__(self, users: UserRepository, age_ranges: AgeRangeRepository, throttle: LoginThrottle | None = None) -> None:
        self._users = users
        self._age_ranges = age_ranges
        self._throttle = throttle or LoginThrottle()

    # ── cadastro e sessão ──

    def create_user(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        payload = payload or {}
        nickname = self._valid_nickname(payload.get("nickname"))
        password = self._valid_password(payload.get("password"))
        age = self._valid_age(payload.get("age"))
        avatar = self._valid_avatar(payload.get("avatar_key"), DEFAULT_AVATAR)
        level = self._valid_level(payload.get("knowledge_level"), optional=True)
        key = nickname_key(nickname)
        if self._users.get_row_by_nickname_key(key) is not None:
            raise ConflictError("Esse apelido já está em uso. Escolha outro.")
        token = new_token()
        try:
            row = self._users.create(
                {
                    "nickname": nickname,
                    "nickname_key": key,
                    "display_name": nickname,
                    "password_hash": hash_password(password),
                    "age": age,
                    "age_range_id": self._age_range_for(age, level).id,
                    "avatar_key": avatar,
                    "knowledge_level": level,
                    "token_hash": hash_token(token),
                    "last_seen_at": now_iso(),
                }
            )
        except ConflictError as error:
            raise ConflictError("Esse apelido já está em uso. Escolha outro.") from error
        return self._session(row, token)

    def login(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        payload = payload or {}
        nickname = normalize_nickname(payload.get("nickname"))
        password = payload.get("password")
        if not nickname or not isinstance(password, str) or not password:
            raise BadRequestError("Informe o apelido e a senha.")
        key = nickname_key(nickname)
        if self._throttle.locked(key):
            raise TooManyRequestsError("Muitas tentativas com esse apelido. Espere 30 segundos e tente de novo.")
        row = self._users.get_row_by_nickname_key(key)
        if row is None or not verify_password(password, row.get("password_hash")):
            self._throttle.fail(key)
            raise UnauthorizedError(BAD_LOGIN)
        self._throttle.succeed(key)
        token = new_token()
        # um token por conta: entrar em outro aparelho encerra a sessão anterior
        updated = self._users.update(row["id"], {"token_hash": hash_token(token), "last_seen_at": now_iso()})
        return self._session(updated or row, token)

    def logout(self, token: str | None) -> dict[str, Any]:
        row = self.require_row(token)
        self._users.update(row["id"], {"token_hash": None})
        return {"ok": True}

    # ── conta atual ──

    def get_current_user(self, token: str | None) -> dict[str, Any]:
        return self.public(self.require_row(token))

    def update_current_user(self, token: str | None, payload: dict[str, Any] | None) -> dict[str, Any]:
        row = self.require_row(token)
        payload = payload or {}
        values: Row = {}
        if "avatar_key" in payload:
            values["avatar_key"] = self._valid_avatar(payload.get("avatar_key"), None)
        if "age" in payload:
            values["age"] = self._valid_age(payload.get("age"))
        if "knowledge_level" in payload:
            values["knowledge_level"] = self._valid_level(payload.get("knowledge_level"), optional=False)
        if "age" in values or "knowledge_level" in values:
            merged = {**row, **values}
            values["age_range_id"] = self._age_range_for(merged["age"], merged.get("knowledge_level")).id
        if not values:
            raise BadRequestError("Nada para atualizar: envie avatar_key, age ou knowledge_level.")
        return self.public(self._users.update(row["id"], values) or {**row, **values})

    def require_row(self, token: str | None) -> Row:
        row = self._users.get_row_by_token_hash(hash_token(token)) if token else None
        if row is None:
            raise UnauthorizedError("Sua sessão terminou. Entre de novo na sua conta.")
        return row

    def optional_row(self, token: str | None) -> Row | None:
        return self._users.get_row_by_token_hash(hash_token(token)) if token else None

    def public(self, row: Row) -> dict[str, Any]:
        user = User.from_row(row).to_dict()
        age_range = next((r for r in self._age_ranges.list_all() if r.id == user["age_range_id"]), None)
        user["age_range"] = (
            {"id": age_range.id, "slug": age_range.slug, "name": age_range.name} if age_range else None
        )
        return user

    def _session(self, row: Row, token: str) -> dict[str, Any]:
        return {"token": token, "user": self.public(row)}

    # ── validação ──

    def _age_range_for(self, age: int, level: str | None = None) -> AgeRange:
        """Faixa (= galáxia) pelo nível de conhecimento: até 13 anos, só "avançado" vai para a galáxia 2; de 14 anos
        ou mais, só "iniciante" fica na galáxia 1. Sem nível (contas antigas), vale a idade."""
        ranges = sorted(self._age_ranges.list_all(), key=lambda r: r.min_age)
        by_age = next((r for r in ranges if age >= r.min_age and (r.max_age is None or age <= r.max_age)), None)
        if by_age is None:
            raise BadRequestError("Não há uma faixa etária para essa idade.")
        if level is None:
            return by_age
        advanced = level == "avancado" or (level == "intermediario" and by_age is not ranges[0])
        return ranges[-1] if advanced else ranges[0]

    @staticmethod
    def _valid_nickname(raw: Any) -> str:
        nickname = normalize_nickname(raw)
        if not NICKNAME_MIN <= len(nickname) <= NICKNAME_MAX:
            raise BadRequestError(f"O apelido precisa ter de {NICKNAME_MIN} a {NICKNAME_MAX} letras.")
        if not NICKNAME_PATTERN.match(nickname):
            raise BadRequestError("Use só letras, números, espaço, ponto, hífen ou sublinhado no apelido.")
        words = _plain_words(nickname)
        if any(word.startswith(blocked) for word in words for blocked in BLOCKED_WORDS):
            raise BadRequestError("Esse apelido não pode ser usado. Escolha outro.")
        return nickname

    @staticmethod
    def _valid_password(raw: Any) -> str:
        if not isinstance(raw, str) or not PASSWORD_MIN <= len(raw) <= PASSWORD_MAX:
            raise BadRequestError(f"A senha precisa ter de {PASSWORD_MIN} a {PASSWORD_MAX} caracteres.")
        return raw

    @staticmethod
    def _valid_age(raw: Any) -> int:
        if isinstance(raw, bool):
            raise BadRequestError("Informe a idade em anos.")
        try:
            age = int(str(raw).strip())
        except ValueError:
            raise BadRequestError("Informe a idade em anos.") from None
        if not AGE_MIN <= age <= AGE_MAX:
            raise BadRequestError(f"A idade precisa estar entre {AGE_MIN} e {AGE_MAX} anos.")
        return age

    @staticmethod
    def _valid_level(raw: Any, optional: bool) -> str | None:
        if (raw is None or raw == "") and optional:
            return None
        if raw not in KNOWLEDGE_LEVELS:
            raise BadRequestError("Escolha o seu nível: iniciante, intermediário ou avançado.")
        return raw

    @staticmethod
    def _valid_avatar(raw: Any, default: str | None) -> str:
        if raw is None or raw == "":
            if default is None:
                raise BadRequestError("Escolha um avatar.")
            return default
        if not isinstance(raw, str) or not AVATAR_PATTERN.match(raw):
            raise BadRequestError("Avatar inválido.")
        return raw
