from __future__ import annotations
import copy
import json
import logging
import threading
import time
from collections.abc import Callable, Hashable
from pathlib import Path
from typing import Any, Protocol

from app.config.settings import DATA_SOURCES, Settings
from app.errors import ServiceUnavailableError

logger = logging.getLogger(__name__)

Row = dict[str, Any]
CATALOG_TABLES = frozenset(
    {"age_ranges", "galaxies", "planetary_systems", "planets", "lessons", "labs"}
)
MULTI_VALUE_TYPES = (list, tuple)


class DataSource(Protocol):
    name: str

    def list(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
    ) -> list[Row]: ...

    def get(self, table: str, column: str, value: Any) -> Row | None: ...

    def ping(self) -> bool: ...


def _sort_key(column: str) -> Callable[[Row], tuple[bool, Any]]:
    return lambda row: (row.get(column) is None, row.get(column))


def _matches(row: Row, column: str, value: Any) -> bool:
    if isinstance(value, MULTI_VALUE_TYPES):
        return row.get(column) in value
    return row.get(column) == value


class LocalDataSource:
    name = "local"

    def __init__(self, path: str | Path) -> None:
        with open(path, encoding="utf-8") as file:
            self._tables: dict[str, list[Row]] = json.load(file)

    def list(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
    ) -> list[Row]:
        rows = [
            dict(row)
            for row in self._tables.get(table, [])
            if all(_matches(row, column, value) for column, value in (filters or {}).items())
        ]
        for item in reversed(order_by or []):
            rows.sort(key=_sort_key(item.lstrip("-")), reverse=item.startswith("-"))
        return rows

    def get(self, table: str, column: str, value: Any) -> Row | None:
        for row in self._tables.get(table, []):
            if row.get(column) == value:
                return dict(row)
        return None

    def ping(self) -> bool:
        return True


class SupabaseDataSource:
    name = "supabase"

    def __init__(self, client: Any) -> None:
        import httpx
        from postgrest.exceptions import APIError

        self._client = client
        self._errors = (APIError, httpx.HTTPError)

    def list(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
    ) -> list[Row]:
        filters = filters or {}
        if any(isinstance(value, MULTI_VALUE_TYPES) and not value for value in filters.values()):
            return []
        query = self._client.table(table).select("*")
        for column, value in filters.items():
            if isinstance(value, MULTI_VALUE_TYPES):
                query = query.in_(column, list(value))
            else:
                query = query.eq(column, value)
        for item in order_by or []:
            query = query.order(item.lstrip("-"), desc=item.startswith("-"))
        return self._execute(table, query)

    def get(self, table: str, column: str, value: Any) -> Row | None:
        query = self._client.table(table).select("*").eq(column, value).limit(1)
        rows = self._execute(table, query)
        return rows[0] if rows else None

    def ping(self) -> bool:
        try:
            self._execute("age_ranges", self._client.table("age_ranges").select("id").limit(1))
        except ServiceUnavailableError:
            return False
        return True

    def _execute(self, table: str, query: Any) -> list[Row]:
        try:
            data = query.execute().data
        except self._errors as error:
            logger.error(
                "Falha ao consultar a tabela '%s' no Supabase (%s): %s",
                table,
                type(error).__name__,
                error,
            )
            raise ServiceUnavailableError() from error
        if not isinstance(data, list):
            logger.error("Resposta inesperada do Supabase para a tabela '%s'.", table)
            raise ServiceUnavailableError()
        return data


Read = Callable[[DataSource], Any]
Refresher = Callable[[Callable[[], None]], Any]
NEVER = float("-inf")
REFRESH_WORKERS = 4
_refresh_slots = threading.BoundedSemaphore(REFRESH_WORKERS)


def refresh_in_background(task: Callable[[], None]) -> None:
    """Roda uma revalidação do cache numa thread daemon (no máximo REFRESH_WORKERS ao mesmo tempo)."""

    def run() -> None:
        with _refresh_slots:
            task()

    threading.Thread(target=run, name="catalog-refresh", daemon=True).start()


class CachedDataSource:
    """Cache em memória das leituras do catálogo.

    - Uma consulta por chave: requisições simultâneas da mesma chave fria esperam a primeira (sem manada).
    - Com ``refresher``, uma entrada vencida é servida na hora e revalidada em segundo plano.
    - Se a fonte falhar, serve a última leitura (mesmo vencida) e tenta de novo depois de ``retry_seconds``.
    - Sem leitura anterior, responde com ``fallback`` (seed.json). Com ele, um disjuntor evita esperar o
      timeout do banco a cada requisição enquanto ele estiver fora.
    """

    MAX_ENTRIES = 512
    RETRY_SECONDS = 30.0

    def __init__(
        self,
        source: DataSource,
        ttl_seconds: float,
        tables: frozenset[str] = CATALOG_TABLES,
        clock: Callable[[], float] = time.monotonic,
        fallback: DataSource | None = None,
        refresher: Refresher | None = None,
        retry_seconds: float = RETRY_SECONDS,
    ) -> None:
        self.source = source
        self.fallback = fallback
        self.name = source.name
        self._ttl = ttl_seconds
        self._tables = tables
        self._clock = clock
        self._refresher = refresher
        self._retry = retry_seconds
        self._entries: dict[Hashable, tuple[float, Any]] = {}
        self._key_locks: dict[Hashable, threading.Lock] = {}
        self._refreshing: set[Hashable] = set()
        self._down_until = NEVER
        self._degraded = False
        self._lock = threading.Lock()

    def list(
        self,
        table: str,
        filters: dict[str, Any] | None = None,
        order_by: list[str] | None = None,
    ) -> list[Row]:
        # cópias: a revalidação em segundo plano repete a leitura com estes mesmos argumentos
        filters = copy.deepcopy(filters)
        order_by = None if order_by is None else list(order_by)
        key = ("list", table, _freeze(filters or {}), tuple(order_by or ()))
        return self._cached(table, key, lambda source: source.list(table, filters, order_by))

    def get(self, table: str, column: str, value: Any) -> Row | None:
        key = ("get", table, column, _freeze(value))
        return self._cached(table, key, lambda source: source.get(table, column, value))

    def ping(self) -> bool:
        return self.source.ping()

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()
            self._key_locks.clear()

    def _cached(self, table: str, key: Hashable, read: Read) -> Any:
        if table not in self._tables:
            return read(self.source)
        if self._ttl <= 0:
            return self._read_uncached(table, read)
        entry = self._entry(key)
        if entry is not None:
            if entry[0] > self._clock():
                return copy.deepcopy(entry[1])
            if self._refresher is not None:
                # stale-while-revalidate: quem pediu recebe a última leitura e não espera o banco
                self._refresh_later(table, key, read)
                return copy.deepcopy(entry[1])
        with self._key_lock(key):
            entry = self._entry(key)
            if entry is not None and entry[0] > self._clock():
                return copy.deepcopy(entry[1])  # outra requisição carregou enquanto esta esperava
            return self._reload(table, key, read, entry)

    def _reload(self, table: str, key: Hashable, read: Read, stale: tuple[float, Any] | None) -> Any:
        try:
            value = self._read_source(read)
        except ServiceUnavailableError:
            if stale is not None:
                logger.debug("'%s' servido da última leitura em cache (fonte indisponível).", table)
                value = stale[1]
            elif self.fallback is not None:
                logger.debug("'%s' servido da reserva '%s' (fonte indisponível).", table, self.fallback.name)
                value = read(self.fallback)
            else:
                raise
            # reserva vale pouco tempo: assim que o banco voltar, a leitura real substitui esta
            self._store(key, value, min(self._retry, self._ttl))
            return copy.deepcopy(value)
        self._store(key, value, self._ttl)
        return value

    def _read_uncached(self, table: str, read: Read) -> Any:
        try:
            return self._read_source(read)
        except ServiceUnavailableError:
            if self.fallback is None:
                raise
            logger.debug("'%s' servido da reserva '%s' (fonte indisponível).", table, self.fallback.name)
            return read(self.fallback)

    def _read_source(self, read: Read) -> Any:
        if self.fallback is not None and self._clock() < self._down_until:
            # disjuntor aberto: não espera o timeout do banco de novo, vai direto à reserva
            raise ServiceUnavailableError()
        try:
            value = read(self.source)
        except ServiceUnavailableError:
            self._mark_down()
            raise
        if self._degraded:
            self._mark_up()
        return value

    def _mark_down(self) -> None:
        with self._lock:
            self._down_until = self._clock() + self._retry
            first = not self._degraded
            self._degraded = True
        if not first:
            return
        if self.fallback is not None:
            logger.warning(
                "Fonte '%s' indisponível: catálogo servido do cache e da reserva '%s'; "
                "nova tentativa em %.0f s.",
                self.name,
                self.fallback.name,
                self._retry,
            )
        else:
            logger.warning(
                "Fonte '%s' indisponível: leituras já em cache continuam sendo servidas.", self.name
            )

    def _mark_up(self) -> None:
        with self._lock:
            recovered = self._degraded
            self._degraded = False
            self._down_until = NEVER
        if recovered:
            logger.info("Fonte '%s' de volta: o catálogo voltou a ser lido dela.", self.name)

    def _refresh_later(self, table: str, key: Hashable, read: Read) -> None:
        refresher = self._refresher
        if refresher is None:
            return
        with self._lock:
            if key in self._refreshing:
                return
            self._refreshing.add(key)

        def task() -> None:
            try:
                with self._key_lock(key):
                    entry = self._entry(key)
                    if entry is None or entry[0] <= self._clock():
                        self._reload(table, key, read, entry)
            except ServiceUnavailableError:
                pass  # a fonte já registrou a falha; sem leitura anterior, nada a servir
            except Exception:
                logger.exception("Falha ao revalidar '%s' em segundo plano.", table)
            finally:
                with self._lock:
                    self._refreshing.discard(key)

        try:
            refresher(task)
        except Exception:
            with self._lock:
                self._refreshing.discard(key)
            logger.exception("Não foi possível agendar a revalidação de '%s'.", table)

    def _entry(self, key: Hashable) -> tuple[float, Any] | None:
        with self._lock:
            return self._entries.get(key)

    def _key_lock(self, key: Hashable) -> threading.Lock:
        with self._lock:
            lock = self._key_locks.get(key)
            if lock is None:
                if len(self._key_locks) >= self.MAX_ENTRIES:
                    # no pior caso, duas leituras simultâneas da mesma chave; nunca um bloqueio
                    self._key_locks.clear()
                lock = self._key_locks[key] = threading.Lock()
            return lock

    def _store(self, key: Hashable, value: Any, ttl: float) -> None:
        now = self._clock()
        frozen = copy.deepcopy(value)
        with self._lock:
            if key not in self._entries and len(self._entries) >= self.MAX_ENTRIES:
                self._entries = {k: e for k, e in self._entries.items() if e[0] > now}
                if len(self._entries) >= self.MAX_ENTRIES:
                    self._entries.clear()
            self._entries[key] = (now + ttl, frozen)


def _freeze(value: Any) -> Hashable:
    if isinstance(value, dict):
        return tuple(sorted((str(k), _freeze(v)) for k, v in value.items()))
    if isinstance(value, MULTI_VALUE_TYPES):
        return tuple(_freeze(item) for item in value)
    return value


def create_data_source(settings: Settings) -> DataSource:
    source = _create_raw_data_source(settings)
    fallback = _create_fallback(settings, source)
    if settings.catalog_cache_seconds <= 0 and fallback is None:
        return source
    return CachedDataSource(
        source,
        settings.catalog_cache_seconds,
        fallback=fallback,
        refresher=refresh_in_background,
    )


def _create_fallback(settings: Settings, source: DataSource) -> DataSource | None:
    """Reserva local do catálogo (seed.json, mesmo conteúdo do seed.sql) para quando o Supabase falhar."""
    if not settings.fallback_to_local or isinstance(source, LocalDataSource):
        return None
    try:
        return LocalDataSource(settings.seed_path)
    except (OSError, ValueError) as error:
        logger.error("Sem reserva local: não foi possível ler %s (%s).", settings.seed_path, error)
        return None


def _create_raw_data_source(settings: Settings) -> DataSource:
    mode = settings.data_source
    if mode not in DATA_SOURCES:
        raise RuntimeError(f"DATA_SOURCE inválido: '{mode}'. Use auto, supabase ou local.")

    has_credentials = bool(settings.supabase_url and settings.supabase_key)
    if mode == "supabase" and not has_credentials:
        raise RuntimeError(
            "DATA_SOURCE=supabase exige SUPABASE_URL e SUPABASE_KEY definidos em backend/.env."
        )

    if mode != "local" and has_credentials:
        from app.config.supabase import create_supabase_client

        return SupabaseDataSource(
            create_supabase_client(settings.supabase_url, settings.supabase_key)
        )

    if mode == "auto":
        logger.warning(
            "SUPABASE_URL/SUPABASE_KEY não definidos: usando dados locais de %s.",
            settings.seed_path,
        )
    return LocalDataSource(settings.seed_path)
