import logging

from flask import Flask, Response, jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code = 500
    code = "internal_error"
    default_message = "Erro interno do servidor."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.default_message
        super().__init__(self.message)


class BadRequestError(AppError):
    status_code = 400
    code = "bad_request"
    default_message = "Requisição inválida."


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    default_message = "Recurso não encontrado."


class NotImplementedFeatureError(AppError):
    status_code = 501
    code = "not_implemented"
    default_message = "Recurso ainda não disponível nesta versão do Rota 404."


class ServiceUnavailableError(AppError):
    status_code = 503
    code = "service_unavailable"
    default_message = "Banco de dados indisponível no momento. Tente novamente em instantes."


HTTP_ERRORS = {
    400: ("bad_request", "Requisição inválida."),
    404: ("not_found", "Rota não encontrada."),
    405: ("method_not_allowed", "Método não permitido para esta rota."),
}


def error_response(status: int, code: str, message: str) -> Response:
    response = jsonify({"error": {"code": code, "message": message}})
    response.status_code = status
    return response


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def handle_app_error(error: AppError) -> Response:
        return error_response(error.status_code, error.code, error.message)

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException) -> Response:
        status = error.code or 500
        default_code = "bad_request" if status < 500 else "internal_error"
        code, message = HTTP_ERRORS.get(
            status, (default_code, "Não foi possível processar a requisição.")
        )
        response = error_response(status, code, message)
        valid_methods = getattr(error, "valid_methods", None)
        if valid_methods:
            response.headers["Allow"] = ", ".join(sorted(valid_methods))
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception) -> Response:
        logger.exception("Erro inesperado ao processar a requisição.")
        return error_response(500, "internal_error", AppError.default_message)
