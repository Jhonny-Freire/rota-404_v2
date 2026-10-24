from typing import Any

from flask import Response, jsonify, request

from app.errors import BadRequestError


def ok(data: Any, status: int = 200) -> tuple[Response, int]:
    return jsonify({"data": data}), status


def optional_query_param(name: str) -> str | None:
    value = request.args.get(name)
    if value is None:
        return None
    if not value.strip():
        raise BadRequestError(f"O parâmetro '{name}' não pode ser vazio.")
    return value.strip()


def json_body() -> dict[str, Any] | None:
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


def bearer_token() -> str | None:
    """Token de sessão do cabeçalho "Authorization: Bearer <token>" (None se ausente)."""
    scheme, _, token = (request.headers.get("Authorization") or "").partition(" ")
    token = token.strip()
    return token if scheme.lower() == "bearer" and token else None
