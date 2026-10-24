import ipaddress
import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SEED_PATH = BACKEND_DIR / "app" / "data" / "seed.json"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")
DATA_SOURCES = ("auto", "supabase", "local")
TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}
DEFAULT_HOST = "127.0.0.1"
# o catálogo não muda durante a feira; vencido, ele é servido e revalidado em segundo plano
DEFAULT_CATALOG_CACHE_SECONDS = 3600


@dataclass(frozen=True)
class Settings:
    debug: bool = False
    port: int = 5000
    data_source: str = "auto"
    supabase_url: str = ""
    supabase_key: str = field(default="", repr=False)
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS
    seed_path: Path = DEFAULT_SEED_PATH
    catalog_cache_seconds: float = DEFAULT_CATALOG_CACHE_SECONDS
    # se o Supabase falhar, o catálogo vem de seed.json (mesmo conteúdo do seed.sql)
    fallback_to_local: bool = True
    # 127.0.0.1: só este computador; 0.0.0.0: aceita conexões da rede (tablets da feira)
    host: str = DEFAULT_HOST

    @property
    def exposed_to_network(self) -> bool:
        return not is_loopback_host(self.host)

    @classmethod
    def from_env(cls, env: Mapping[str, str]) -> "Settings":
        origins = tuple(
            origin.strip()
            for origin in env.get("CORS_ORIGINS", "").split(",")
            if origin.strip()
        )
        return cls(
            debug=env.get("FLASK_DEBUG", "").strip().lower() in TRUE_VALUES,
            port=int(env.get("PORT", "").strip() or 5000),
            data_source=env.get("DATA_SOURCE", "").strip().lower() or "auto",
            supabase_url=env.get("SUPABASE_URL", "").strip(),
            supabase_key=env.get("SUPABASE_KEY", "").strip(),
            cors_origins=origins or DEFAULT_CORS_ORIGINS,
            catalog_cache_seconds=max(
                0.0,
                float(env.get("CATALOG_CACHE_SECONDS", "").strip() or DEFAULT_CATALOG_CACHE_SECONDS),
            ),
            fallback_to_local=env.get("FALLBACK_TO_LOCAL", "").strip().lower() not in FALSE_VALUES,
            host=env.get("HOST", "").strip() or DEFAULT_HOST,
        )


def is_loopback_host(host: str) -> bool:
    host = host.strip().strip("[]").lower()
    if host == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def load_settings() -> Settings:
    load_dotenv(BACKEND_DIR / ".env")
    return Settings.from_env(os.environ)
