import sys
import threading
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import httpx  # noqa: E402

from app import create_app  # noqa: E402
from app.config.settings import Settings, is_loopback_host  # noqa: E402
from app.errors import ServiceUnavailableError  # noqa: E402
from app.repositories.data_source import (  # noqa: E402
    CachedDataSource,
    LocalDataSource,
    SupabaseDataSource,
    create_data_source,
    refresh_in_background,
)
from app.repositories.lab_repository import LabRepository  # noqa: E402
from app.repositories.lesson_repository import LessonRepository  # noqa: E402
from app.repositories.planet_repository import PlanetRepository  # noqa: E402
from app.repositories.planetary_system_repository import PlanetarySystemRepository  # noqa: E402
from app.services.learning_service import LearningService  # noqa: E402
from app.warmup import catalog_paths, start_catalog_warmup, warm_catalog  # noqa: E402

SEED_JSON = BACKEND_DIR / "app" / "data" / "seed.json"
LOGGER = "app.repositories.data_source"
SUPABASE = {"data_source": "supabase", "supabase_url": "https://exemplo.supabase.co", "supabase_key": "chave-fake"}
LESSON_PLANET_ID = "332fa3b7-b277-472a-a7c5-d1ddda87daee"  # planeta 1.1 (aula)


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


class Remote:
    """Fonte que imita o Supabase: conta consultas, pode atrasar, cair ou mudar de valor."""

    name = "supabase"

    def __init__(self, delay=0.0, barrier=None):
        self.calls = []
        self.down = False
        self.version = 1
        self.delay = delay
        self.barrier = barrier
        self._lock = threading.Lock()

    def _answer(self, call, table):
        with self._lock:
            self.calls.append(call)
        if self.barrier is not None:
            self.barrier.wait()
        if self.delay:
            time.sleep(self.delay)
        if self.down:
            raise ServiceUnavailableError()
        return [{"id": "remoto", "table": table, "version": self.version}]

    def list(self, table, filters=None, order_by=None):
        return self._answer(("list", table, filters, order_by), table)

    def get(self, table, column, value):
        return self._answer(("get", table, column, value), table)[0]

    def ping(self):
        return not self.down


class ManualRefresher:
    """Guarda as revalidações agendadas para o teste rodá-las quando quiser."""

    def __init__(self):
        self.tasks = []

    def __call__(self, task):
        self.tasks.append(task)

    def run_all(self):
        tasks, self.tasks = self.tasks, []
        for task in tasks:
            task()


class FailingQuery:
    def __init__(self, client):
        self._client = client

    def __getattr__(self, name):
        return lambda *args, **kwargs: self

    def execute(self):
        self._client.executions += 1
        raise httpx.ConnectError("conexão recusada")


class FailingSupabaseClient:
    """Cliente do Supabase fora do ar: toda consulta falha como rede recusada."""

    def __init__(self):
        self.executions = 0

    def table(self, name):
        return FailingQuery(self)


class RecordingSource:
    def __init__(self, source):
        self._source = source
        self.name = source.name
        self.calls = []
        self._lock = threading.Lock()

    def list(self, table, filters=None, order_by=None):
        with self._lock:
            self.calls.append(("list", table, filters, order_by))
        return self._source.list(table, filters, order_by)

    def get(self, table, column, value):
        with self._lock:
            self.calls.append(("get", table, column, value))
        return self._source.get(table, column, value)

    def ping(self):
        return self._source.ping()


class SingleFlightTest(unittest.TestCase):
    def test_concurrent_cold_misses_share_one_query(self):
        remote = Remote(delay=0.05)
        cache = CachedDataSource(remote, 300)
        results = []
        threads = [
            threading.Thread(target=lambda: results.append(cache.list("lessons", {"planet_id": "p1"})))
            for _ in range(10)
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(len(remote.calls), 1)
        self.assertEqual(len(results), 10)
        self.assertTrue(all(result == results[0] for result in results))

    def test_different_keys_still_load_in_parallel(self):
        # a barreira só abre se as duas consultas estiverem no banco ao mesmo tempo
        remote = Remote(barrier=threading.Barrier(2, timeout=5))
        cache = CachedDataSource(remote, 300)
        errors = []

        def read(table):
            try:
                cache.list(table)
            except Exception as error:  # pragma: no cover
                errors.append(error)

        threads = [threading.Thread(target=read, args=(table,)) for table in ("planets", "lessons")]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(errors, [])
        self.assertEqual(len(remote.calls), 2)


class StaleWhileRevalidateTest(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.remote = Remote()
        self.refresher = ManualRefresher()
        self.cache = CachedDataSource(self.remote, 300, clock=self.clock, refresher=self.refresher)

    def test_expired_entry_is_served_at_once_and_refreshed_in_background(self):
        self.cache.list("planets")
        self.remote.version = 2
        self.clock.now += 301
        for _ in range(3):
            self.assertEqual(self.cache.list("planets")[0]["version"], 1)
        self.assertEqual(len(self.remote.calls), 1)  # ninguém esperou o banco
        self.assertEqual(len(self.refresher.tasks), 1)  # uma revalidação só, mesmo com 3 pedidos
        self.refresher.run_all()
        self.assertEqual(len(self.remote.calls), 2)
        self.assertEqual(self.cache.list("planets")[0]["version"], 2)
        self.assertEqual(self.refresher.tasks, [])

        self.clock.now += 301
        self.cache.list("planets")
        self.assertEqual(len(self.refresher.tasks), 1)  # vence de novo, agenda de novo

    def test_failed_refresh_keeps_last_value_and_retries_later(self):
        self.cache.list("planets")
        self.remote.down = True
        self.clock.now += 301
        self.cache.list("planets")
        with self.assertLogs(LOGGER, "WARNING"):
            self.refresher.run_all()
        self.assertEqual(self.cache.list("planets")[0]["version"], 1)
        self.assertEqual(self.refresher.tasks, [])  # dentro da janela de nova tentativa: nada agendado
        self.clock.now += CachedDataSource.RETRY_SECONDS + 1
        self.remote.down = False
        self.remote.version = 3
        self.assertEqual(self.cache.list("planets")[0]["version"], 1)
        with self.assertLogs(LOGGER, "INFO") as logs:
            self.refresher.run_all()
        self.assertIn("de volta", logs.output[0])
        self.assertEqual(self.cache.list("planets")[0]["version"], 3)

    def test_cold_miss_still_waits_for_the_source(self):
        self.assertEqual(self.cache.list("planets")[0]["version"], 1)
        self.assertEqual(self.refresher.tasks, [])

    def test_refresh_in_background_uses_a_daemon_thread(self):
        done = threading.Event()
        seen = []

        def task():
            seen.append(threading.current_thread())
            done.set()

        refresh_in_background(task)
        self.assertTrue(done.wait(5))
        self.assertTrue(seen[0].daemon)
        self.assertIsNot(seen[0], threading.current_thread())


class StaleIfErrorTest(unittest.TestCase):
    def test_expired_entry_is_served_when_source_fails(self):
        clock = Clock()
        remote = Remote()
        cache = CachedDataSource(remote, 300, clock=clock)
        cache.list("planets")
        remote.down = True
        clock.now += 301
        with self.assertLogs(LOGGER, "WARNING"):
            self.assertEqual(cache.list("planets")[0]["version"], 1)
        self.assertEqual(len(remote.calls), 2)
        cache.list("planets")
        self.assertEqual(len(remote.calls), 2)  # não insiste a cada requisição
        clock.now += CachedDataSource.RETRY_SECONDS + 1
        cache.list("planets")
        self.assertEqual(len(remote.calls), 3)

    def test_without_previous_entry_or_fallback_the_error_propagates(self):
        remote = Remote()
        remote.down = True
        cache = CachedDataSource(remote, 300, clock=Clock())
        with self.assertLogs(LOGGER, "WARNING"), self.assertRaises(ServiceUnavailableError):
            cache.list("planets")


class FallbackTest(unittest.TestCase):
    def setUp(self):
        self.clock = Clock()
        self.remote = Remote()
        self.cache = CachedDataSource(
            self.remote, 300, clock=self.clock, fallback=LocalDataSource(SEED_JSON)
        )

    def test_cold_miss_uses_seed_and_circuit_breaker_skips_the_source(self):
        self.remote.down = True
        with self.assertLogs(LOGGER, "WARNING") as logs:
            rows = self.cache.list("age_ranges", order_by=["min_age"])
        self.assertEqual([row["slug"] for row in rows], ["13-ou-menos", "14-ou-mais"])
        self.assertIn("reserva 'local'", logs.output[0])
        galaxy = self.cache.get("galaxies", "slug", "internet-e-web")
        self.assertEqual(galaxy["name"], "Internet e Web")
        self.assertEqual(len(self.remote.calls), 1)  # disjuntor aberto: nem tentou o banco

        self.clock.now += CachedDataSource.RETRY_SECONDS + 1
        self.remote.down = False
        with self.assertLogs(LOGGER, "INFO"):
            self.assertEqual(self.cache.get("galaxies", "slug", "api-rest")["id"], "remoto")
        self.assertEqual(len(self.remote.calls), 2)
        # a leitura de reserva vence logo: o dado real substitui o do seed
        self.assertEqual(self.cache.list("age_ranges", order_by=["min_age"])[0]["id"], "remoto")

    def test_last_real_read_wins_over_seed(self):
        self.cache.list("planets")
        self.remote.down = True
        self.clock.now += 301
        with self.assertLogs(LOGGER, "WARNING"):
            self.assertEqual(self.cache.list("planets"), [{"id": "remoto", "table": "planets", "version": 1}])

    def test_non_catalog_tables_never_fall_back(self):
        self.remote.down = True
        with self.assertRaises(ServiceUnavailableError):
            self.cache.list("scores")

    def test_fallback_without_cache(self):
        cache = CachedDataSource(self.remote, 0, clock=self.clock, fallback=LocalDataSource(SEED_JSON))
        self.assertEqual(cache.list("galaxies")[0]["id"], "remoto")
        self.remote.down = True
        with self.assertLogs(LOGGER, "WARNING"):
            self.assertEqual(len(cache.list("galaxies")), 2)
        self.assertEqual(len(self.remote.calls), 2)


class SettingsTest(unittest.TestCase):
    def test_defaults(self):
        for settings in (Settings(), Settings.from_env({})):
            with self.subTest(settings=settings):
                self.assertTrue(settings.fallback_to_local)
                self.assertEqual(settings.host, "127.0.0.1")
                self.assertFalse(settings.exposed_to_network)
                self.assertEqual(settings.catalog_cache_seconds, 3600)

    def test_fallback_from_env(self):
        for value in ("0", "false", " OFF ", "no"):
            with self.subTest(value=value):
                self.assertFalse(Settings.from_env({"FALLBACK_TO_LOCAL": value}).fallback_to_local)
        for value in ("1", "true", "", " "):
            with self.subTest(value=value):
                self.assertTrue(Settings.from_env({"FALLBACK_TO_LOCAL": value}).fallback_to_local)

    def test_host_from_env(self):
        self.assertEqual(Settings.from_env({"HOST": " 0.0.0.0 "}).host, "0.0.0.0")
        self.assertTrue(Settings.from_env({"HOST": "0.0.0.0"}).exposed_to_network)
        self.assertEqual(Settings.from_env({"HOST": " "}).host, "127.0.0.1")

    def test_is_loopback_host(self):
        for host in ("127.0.0.1", "localhost", "LOCALHOST", "::1", "[::1]", "127.0.0.2"):
            with self.subTest(host=host):
                self.assertTrue(is_loopback_host(host))
        for host in ("0.0.0.0", "::", "192.168.0.10", "meu-notebook", ""):
            with self.subTest(host=host):
                self.assertFalse(is_loopback_host(host))

    def test_env_example_documents_the_new_variables(self):
        example = (BACKEND_DIR / ".env.example").read_text(encoding="utf-8")
        for line in ("HOST=127.0.0.1", "FALLBACK_TO_LOCAL=1", "CATALOG_CACHE_SECONDS=3600"):
            self.assertIn(line, example.splitlines())


class CreateDataSourceFallbackTest(unittest.TestCase):
    def create(self, **overrides):
        with mock.patch("app.config.supabase.create_supabase_client", return_value=FailingSupabaseClient()):
            return create_data_source(Settings(**{**SUPABASE, **overrides}))

    def test_supabase_gets_seed_fallback_and_background_refresh(self):
        source = self.create()
        self.assertIsInstance(source, CachedDataSource)
        self.assertIsInstance(source.source, SupabaseDataSource)
        self.assertIsInstance(source.fallback, LocalDataSource)
        self.assertIs(source._refresher, refresh_in_background)
        self.assertEqual(source.name, "supabase")

    def test_fallback_can_be_disabled(self):
        self.assertIsNone(self.create(fallback_to_local=False).fallback)

    def test_local_mode_has_no_fallback(self):
        source = create_data_source(Settings(data_source="local"))
        self.assertIsNone(source.fallback)

    def test_fallback_survives_disabled_cache(self):
        source = self.create(catalog_cache_seconds=0)
        self.assertIsInstance(source, CachedDataSource)
        self.assertIsInstance(source.fallback, LocalDataSource)

    def test_missing_seed_only_disables_fallback(self):
        with self.assertLogs(LOGGER, "ERROR"):
            source = self.create(seed_path=BACKEND_DIR / "nao-existe.json")
        self.assertIsNone(source.fallback)


class ApiWithSupabaseDownTest(unittest.TestCase):
    def test_catalog_keeps_working_from_seed(self):
        fake = FailingSupabaseClient()
        with mock.patch("app.config.supabase.create_supabase_client", return_value=fake):
            client = create_app(Settings(**SUPABASE)).test_client()
        with self.assertLogs(LOGGER, "WARNING") as logs:
            system = client.get("/api/systems/enderecos-e-sites")
            lesson = client.get(f"/api/lessons/{LESSON_PLANET_ID}")
            galaxies = client.get("/api/galaxies")
            health = client.get("/api/health")
        self.assertEqual(system.status_code, 200)
        self.assertEqual(len(system.get_json()["data"]["planets"]), 4)
        self.assertEqual(lesson.status_code, 200)
        self.assertEqual(lesson.get_json()["data"]["content"]["code"], "1.1")
        self.assertEqual([g["slug"] for g in galaxies.get_json()["data"]], ["internet-e-web", "api-rest"])
        # uma tentativa no catálogo (o disjuntor abre) e o ping do health, que sempre consulta
        self.assertEqual(fake.executions, 2)
        self.assertEqual(
            health.get_json()["data"],
            {"status": "degraded", "data_source": "supabase", "database": "error"},
        )
        self.assertNotIn("chave-fake", "\n".join(logs.output))


class LearningQueriesTest(unittest.TestCase):
    def test_planet_id_ref_takes_three_queries(self):
        source = RecordingSource(LocalDataSource(SEED_JSON))
        service = LearningService(
            LessonRepository(source),
            LabRepository(source),
            PlanetRepository(source),
            PlanetarySystemRepository(source),
        )
        detail = service.get_lesson(LESSON_PLANET_ID.upper())
        self.assertEqual(detail["planet"]["id"], LESSON_PLANET_ID)
        self.assertEqual(detail["system"]["slug"], "dispositivos-e-conexao")
        self.assertEqual(
            [call[:3] for call in source.calls],
            [("get", "planets", "id"), ("get", "lessons", "planet_id"), ("get", "planetary_systems", "id")],
        )


class WarmupTest(unittest.TestCase):
    def recorded_app(self):
        source = RecordingSource(LocalDataSource(SEED_JSON))
        cache = CachedDataSource(source, 300)
        with mock.patch("app.create_data_source", return_value=cache):
            app = create_app(Settings(data_source="local"))
        return app, source

    def test_paths_match_what_the_frontend_requests(self):
        paths = catalog_paths(create_app(Settings(data_source="local")))
        planet_paths = [p for p in paths if p.startswith(("/api/lessons/", "/api/labs/"))]
        self.assertEqual(len(planet_paths), 32)
        self.assertIn(f"/api/lessons/{LESSON_PLANET_ID}", planet_paths)
        for path in ("/api/age-ranges", "/api/systems", "/api/systems?galaxy=internet-e-web",
                     "/api/systems/enderecos-e-sites", "/api/systems/api-em-situacoes-reais"):
            self.assertIn(path, paths)

    def test_after_warmup_every_path_is_served_from_memory(self):
        app, source = self.recorded_app()
        ok, total = warm_catalog(app)
        self.assertEqual(ok, total)
        warmed = len(source.calls)
        client = app.test_client()
        for path in ["/api/galaxies", "/api/galaxies/internet-e-web", *catalog_paths(app)]:
            self.assertEqual(client.get(path).status_code, 200)
        self.assertEqual(len(source.calls), warmed)

    def test_warmup_runs_in_background_and_logs(self):
        app = create_app(Settings(data_source="local"))
        with self.assertLogs("app.warmup", "INFO") as logs:
            thread = start_catalog_warmup(app)
            thread.join(30)
        self.assertFalse(thread.is_alive())
        self.assertTrue(thread.daemon)
        self.assertRegex(logs.output[0], r"pré-aquecido: (\d+) de \1 rotas")

    def test_warmup_works_offline_with_fallback(self):
        with mock.patch("app.config.supabase.create_supabase_client", return_value=FailingSupabaseClient()):
            app = create_app(Settings(**SUPABASE))
        with self.assertLogs(LOGGER, "WARNING"):
            ok, total = warm_catalog(app)
        self.assertEqual(ok, total)
        self.assertGreater(total, 20)

    def test_warmup_survives_a_broken_api(self):
        app = SimpleNamespace(test_client=lambda: SimpleNamespace(
            get=lambda path: SimpleNamespace(status_code=500, get_json=lambda silent=False: None)
        ))
        self.assertEqual(catalog_paths(app), ["/api/age-ranges", "/api/systems"])


if __name__ == "__main__":
    unittest.main()
