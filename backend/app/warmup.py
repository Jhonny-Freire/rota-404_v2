from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from flask import Flask

logger = logging.getLogger(__name__)

WARMUP_WORKERS = 4


def _data(app: Flask, path: str) -> Any:
    body = app.test_client().get(path).get_json(silent=True) or {}
    return body.get("data") if isinstance(body, dict) else None


def catalog_paths(app: Flask) -> list[str]:
    """As mesmas URLs (e portanto as mesmas chaves de cache) que o frontend pede.

    Listas, galáxias, sistemas e cada planeta pelo id (como em planetHref), descobertos pela própria API.
    """
    paths = ["/api/age-ranges", "/api/systems"]
    for galaxy in _data(app, "/api/galaxies") or []:
        slug = galaxy["slug"]
        paths.append(f"/api/systems?galaxy={slug}")
        detail = _data(app, f"/api/galaxies/{slug}") or {}
        for system in detail.get("systems") or []:
            paths.append(f"/api/systems/{system['slug']}")
            for planet in system.get("planets") or []:
                kind = "lessons" if planet.get("type") == "lesson" else "labs"
                paths.append(f"/api/{kind}/{planet['id']}")
    return paths


def warm_catalog(app: Flask) -> tuple[int, int]:
    """Faz todas as leituras do catálogo uma vez. Devolve (rotas com 200, rotas pedidas)."""
    paths = catalog_paths(app)

    def fetch(path: str) -> int:
        return app.test_client().get(path).status_code

    with ThreadPoolExecutor(max_workers=WARMUP_WORKERS, thread_name_prefix="catalog-warmup") as pool:
        statuses = list(pool.map(fetch, paths))
    return sum(1 for status in statuses if status == 200), len(paths)


def start_catalog_warmup(app: Flask) -> threading.Thread:
    """Pré-aquece o cache do catálogo em segundo plano: o servidor sobe na hora e o 1º visitante não espera."""

    def run() -> None:
        started = time.perf_counter()
        try:
            ok, total = warm_catalog(app)
        except Exception:
            logger.exception("Falha ao pré-aquecer o cache do catálogo.")
            return
        logger.info(
            "Cache do catálogo pré-aquecido: %d de %d rotas em %.1f s.",
            ok,
            total,
            time.perf_counter() - started,
        )

    thread = threading.Thread(target=run, name="catalog-warmup", daemon=True)
    thread.start()
    return thread
