import json
import re
import sys
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

import httpx  # noqa: E402
from postgrest import SyncPostgrestClient  # noqa: E402
from postgrest.exceptions import APIError  # noqa: E402

from app import create_app  # noqa: E402
from app.config.settings import Settings  # noqa: E402
from app.errors import ServiceUnavailableError  # noqa: E402
from app.models.catalog import AgeRange, Galaxy, Planet  # noqa: E402
from app.repositories.data_source import (  # noqa: E402
    CATALOG_TABLES,
    CachedDataSource,
    LocalDataSource,
    SupabaseDataSource,
    create_data_source,
)
from app.repositories.age_range_repository import AgeRangeRepository  # noqa: E402
from app.repositories.galaxy_repository import GalaxyRepository  # noqa: E402
from app.repositories.planet_repository import PlanetRepository  # noqa: E402
from app.repositories.planetary_system_repository import PlanetarySystemRepository  # noqa: E402
from app.services.galaxy_service import GalaxyService  # noqa: E402

SEED_JSON = BACKEND_DIR / "app" / "data" / "seed.json"
SEED_SQL = ROOT_DIR / "supabase" / "seed.sql"
MIGRATION_SQL = ROOT_DIR / "supabase" / "migrations" / "20261009000000_init_schema.sql"

NOT_IMPLEMENTED_MESSAGE = "Recurso ainda não disponível nesta versão do Rota 404."
ALLOWED_ORIGIN = "http://localhost:3000"
SEED_TABLES = ("age_ranges", "galaxies", "planetary_systems", "planets", "lessons", "labs")

SPEC_IDS = {
    "age_ranges": {
        "13-ou-menos": "0c856487-b78e-405e-8b27-94a2d5dc8b09",
        "14-ou-mais": "a09f8844-a733-444c-929c-c8a3a7ca161f",
    },
    "galaxies": {
        "internet-e-web": "87bdb573-d9fa-44fb-b5f0-ff6deb5096dd",
        "api-rest": "c21c7bb8-1bdb-4541-8518-e83cfd054744",
    },
    "planetary_systems": {
        "dispositivos-e-conexao": "8476d0aa-b1fd-44b3-8c18-0b2eba3db184",
        "enderecos-e-sites": "f8fb02b1-2fde-41e3-9906-af4bfadde841",
        "navegador-e-paginas-web": "e529d3ff-c674-4bfb-8aae-d85876868b5b",
        "comunicacao-e-seguranca": "3c9f5340-e271-46a4-8870-0bffaebc5743",
        "conhecendo-uma-api": "3aed5f0e-b2e0-428a-8f57-4aaf50901071",
        "requisicoes-http": "79a05b84-f077-42e0-8d0d-15e5b054db40",
        "entendendo-os-dados": "6fc855ce-43ab-4861-9023-bdb09be46be1",
        "api-em-situacoes-reais": "60bbf8fb-fa63-414f-a62e-984e37f76100",
    },
}

# (sistema, código, tipo, engine) — tabela "Os 16 motores" do contrato da fase 2.
G1_ENGINES = [
    ("dispositivos-e-conexao", "1.1", "lesson", "o-que-e-uma-rede"),
    ("dispositivos-e-conexao", "1.2", "lesson", "como-meu-dispositivo-chega-a-internet"),
    ("dispositivos-e-conexao", "1.3", "lab", "conectando-uma-rede"),
    ("dispositivos-e-conexao", "1.4", "lab", "missao-recuperar-a-conexao"),
    ("enderecos-e-sites", "2.1", "lesson", "todo-dispositivo-precisa-de-um-endereco"),
    ("enderecos-e-sites", "2.2", "lesson", "ip-dominio-e-site"),
    ("enderecos-e-sites", "2.3", "lab", "encontrando-o-destino"),
    ("enderecos-e-sites", "2.4", "lab", "missao-encontrar-o-servidor"),
    ("navegador-e-paginas-web", "3.1", "lesson", "o-que-acontece-quando-acesso-um-site"),
    ("navegador-e-paginas-web", "3.2", "lesson", "html-os-blocos-de-uma-pagina"),
    ("navegador-e-paginas-web", "3.3", "lab", "monte-sua-pagina"),
    ("navegador-e-paginas-web", "3.4", "lab", "conserte-a-pagina"),
    ("comunicacao-e-seguranca", "4.1", "lesson", "como-as-informacoes-viajam"),
    ("comunicacao-e-seguranca", "4.2", "lesson", "http-e-https"),
    ("comunicacao-e-seguranca", "4.3", "lab", "detetive-digital"),
    ("comunicacao-e-seguranca", "4.4", "lab", "missao-navegacao-segura"),
]

LESSON = {
    "id": "95a3636d-25e3-4d45-b604-5bba2bce0897",
    "slug": "o-que-e-uma-rede",
    "planet_id": "332fa3b7-b277-472a-a7c5-d1ddda87daee",
}
LAB = {
    "id": "d0039508-5774-4eae-ac41-f38a9e9a7e2b",
    "slug": "conectando-uma-rede",
    "planet_id": "d8a76f7c-f8a8-4485-a562-a1f56f66eaa9",
}

FUTURE_ENDPOINTS = [
    ("GET", "/api/progress"),
    ("PUT", "/api/progress/qualquer-planeta"),
    ("GET", "/api/scores"),
    ("POST", "/api/scores"),
    ("GET", "/api/achievements"),
    ("GET", "/api/achievements/me"),
    ("GET", "/api/rankings/galaxies/internet-e-web"),
    ("GET", "/api/rankings/systems/requisicoes-http"),
    ("GET", "/api/users/me"),
    ("POST", "/api/users"),
    ("PATCH", "/api/users/me"),
]

AGE_RANGE_FIELDS = {"id", "name", "slug", "min_age", "max_age", "description", "created_at", "updated_at"}
GALAXY_FIELDS = {
    "id", "age_range_id", "name", "slug", "description", "order_index", "sprite_key", "created_at", "updated_at",
}
SYSTEM_FIELDS = {
    "id", "galaxy_id", "name", "slug", "description", "order_index", "sprite_key", "created_at", "updated_at",
}
PLANET_FIELDS = {
    "id", "planetary_system_id", "type", "name", "slug", "description", "sprite_key", "order_index",
    "created_at", "updated_at",
}
LESSON_FIELDS = {"id", "planet_id", "title", "slug", "order_index", "content", "created_at", "updated_at"}
LAB_FIELDS = {"id", "planet_id", "title", "slug", "order_index", "max_score", "config", "created_at", "updated_at"}


def local_app(**overrides):
    return create_app(Settings(data_source="local", **overrides))


def load_seed():
    return json.loads(SEED_JSON.read_text(encoding="utf-8"))


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = local_app().test_client()

    def get_data(self, path):
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        return response.get_json()["data"]

    def assert_error(self, response, status, code):
        self.assertEqual(response.status_code, status)
        self.assertTrue(response.is_json)
        error = response.get_json()["error"]
        self.assertEqual(error["code"], code)
        self.assertTrue(error["message"])
        return error


class CatalogApiTest(ApiTestCase):
    def test_health(self):
        self.assertEqual(
            self.get_data("/api/health"),
            {"status": "ok", "data_source": "local", "database": "ok"},
        )

    def test_age_ranges_sorted_by_min_age(self):
        age_ranges = self.get_data("/api/age-ranges")
        self.assertEqual([item["slug"] for item in age_ranges], ["13-ou-menos", "14-ou-mais"])
        self.assertEqual([item["min_age"] for item in age_ranges], [0, 14])
        self.assertEqual([item["max_age"] for item in age_ranges], [13, None])
        self.assertEqual([item["name"] for item in age_ranges], ["13 anos ou menos", "14 anos ou mais"])
        for item in age_ranges:
            self.assertEqual(set(item), AGE_RANGE_FIELDS)

    def test_age_range_detail_by_slug_and_uuid(self):
        uuid = SPEC_IDS["age_ranges"]["13-ou-menos"]
        by_slug = self.get_data("/api/age-ranges/13-ou-menos")
        by_uuid = self.get_data(f"/api/age-ranges/{uuid}")
        by_upper_uuid = self.get_data(f"/api/age-ranges/{uuid.upper()}")
        self.assertEqual(by_slug, by_uuid)
        self.assertEqual(by_slug, by_upper_uuid)
        self.assertEqual(set(by_slug), AGE_RANGE_FIELDS | {"galaxies"})
        self.assertEqual([galaxy["slug"] for galaxy in by_slug["galaxies"]], ["internet-e-web"])

        older = self.get_data("/api/age-ranges/14-ou-mais")
        self.assertEqual([galaxy["slug"] for galaxy in older["galaxies"]], ["api-rest"])

    def test_galaxies_list_and_age_range_filter(self):
        galaxies = self.get_data("/api/galaxies")
        self.assertEqual([galaxy["slug"] for galaxy in galaxies], ["internet-e-web", "api-rest"])
        self.assertEqual([galaxy["sprite_key"] for galaxy in galaxies], ["galaxy-internet-e-web", "galaxy-api-rest"])
        for galaxy in galaxies:
            self.assertEqual(set(galaxy), GALAXY_FIELDS)

        by_slug = self.get_data("/api/galaxies?age_range=13-ou-menos")
        self.assertEqual([galaxy["slug"] for galaxy in by_slug], ["internet-e-web"])
        by_uuid = self.get_data(f"/api/galaxies?age_range={SPEC_IDS['age_ranges']['14-ou-mais']}")
        self.assertEqual([galaxy["slug"] for galaxy in by_uuid], ["api-rest"])

    def test_galaxies_invalid_filter(self):
        self.assert_error(self.client.get("/api/galaxies?age_range=nao-existe"), 404, "not_found")
        self.assert_error(self.client.get("/api/galaxies?age_range="), 400, "bad_request")
        self.assert_error(self.client.get("/api/galaxies?age_range=13-anos-ou-menos"), 404, "not_found")

    def test_galaxy_detail_with_ordered_systems_and_planets(self):
        galaxy = self.get_data("/api/galaxies/internet-e-web")
        self.assertEqual(set(galaxy), GALAXY_FIELDS | {"age_range", "systems"})
        self.assertEqual(galaxy["name"], "Internet e Web")
        self.assertEqual(galaxy["age_range"]["slug"], "13-ou-menos")
        self.assertEqual(
            [system["slug"] for system in galaxy["systems"]],
            ["dispositivos-e-conexao", "enderecos-e-sites", "navegador-e-paginas-web", "comunicacao-e-seguranca"],
        )
        self.assertEqual([system["order_index"] for system in galaxy["systems"]], [1, 2, 3, 4])
        self.assertEqual([system["sprite_key"] for system in galaxy["systems"]], ["star-1", "star-2", "star-3", "star-4"])
        for system in galaxy["systems"]:
            with self.subTest(system=system["slug"]):
                self.assertEqual(set(system), SYSTEM_FIELDS | {"planets"})
                planets = system["planets"]
                self.assertEqual([planet["order_index"] for planet in planets], [1, 2, 3, 4])
                self.assertEqual([planet["type"] for planet in planets], ["lesson", "lesson", "lab", "lab"])
                for planet in planets:
                    self.assertEqual(set(planet), PLANET_FIELDS)
                    self.assertEqual(planet["planetary_system_id"], system["id"])
        expected = [engine for _, _, _, engine in G1_ENGINES]
        self.assertEqual([p["slug"] for s in galaxy["systems"] for p in s["planets"]], expected)
        self.assertEqual(galaxy, self.get_data(f"/api/galaxies/{SPEC_IDS['galaxies']['internet-e-web']}"))

        api_rest = self.get_data("/api/galaxies/api-rest")
        self.assertEqual(
            [system["name"] for system in api_rest["systems"]],
            ["Conhecendo uma API", "Requisições HTTP", "Entendendo os dados", "API em situações reais"],
        )
        self.assertEqual([system["planets"] for system in api_rest["systems"]], [[], [], [], []])

    def test_systems_list_and_galaxy_filter(self):
        systems = self.get_data("/api/systems")
        self.assertEqual(len(systems), 8)
        for system in systems:
            self.assertEqual(set(system), SYSTEM_FIELDS)

        filtered = self.get_data("/api/systems?galaxy=api-rest")
        self.assertEqual(
            [system["slug"] for system in filtered],
            ["conhecendo-uma-api", "requisicoes-http", "entendendo-os-dados", "api-em-situacoes-reais"],
        )
        self.assertEqual(filtered, self.get_data(f"/api/systems?galaxy={SPEC_IDS['galaxies']['api-rest']}"))
        self.assert_error(self.client.get("/api/systems?galaxy=nao-existe"), 404, "not_found")

    def test_system_detail_with_galaxy_and_planets(self):
        system = self.get_data("/api/systems/requisicoes-http")
        self.assertEqual(set(system), SYSTEM_FIELDS | {"galaxy", "planets"})
        self.assertEqual(system["name"], "Requisições HTTP")
        self.assertIsNone(system["description"])
        self.assertEqual(system["galaxy"]["slug"], "api-rest")
        self.assertEqual(system["planets"], [])
        self.assertEqual(system, self.get_data(f"/api/systems/{SPEC_IDS['planetary_systems']['requisicoes-http']}"))

        first = self.get_data("/api/systems/dispositivos-e-conexao")
        self.assertEqual(
            [(planet["slug"], planet["type"]) for planet in first["planets"]],
            [(engine, kind) for system_slug, _, kind, engine in G1_ENGINES if system_slug == "dispositivos-e-conexao"],
        )
        for planet in first["planets"]:
            self.assertNotIn("kind", planet)
            self.assertIsNone(planet["description"])

    def test_json_keeps_accents_readable(self):
        body = self.client.get("/api/systems/requisicoes-http").get_data()
        self.assertIn("Requisições HTTP".encode("utf-8"), body)
        self.assertNotIn(b"\\u00", body)


class LearningApiTest(ApiTestCase):
    def test_list_lessons_and_labs(self):
        lessons = self.get_data("/api/lessons")
        labs = self.get_data("/api/labs")
        self.assertEqual(len(lessons), 8)
        self.assertEqual(len(labs), 8)
        for lesson in lessons:
            self.assertEqual(set(lesson), LESSON_FIELDS)
        for lab in labs:
            self.assertEqual(set(lab), LAB_FIELDS)
            self.assertEqual(lab["max_score"], 100)
        for items in (lessons, labs):
            order = [item["order_index"] for item in items]
            self.assertEqual(order, sorted(order))

    def test_list_filtered_by_system_slug_and_uuid(self):
        system_id = SPEC_IDS["planetary_systems"]["dispositivos-e-conexao"]
        for kind, path in (("lesson", "/api/lessons"), ("lab", "/api/labs")):
            with self.subTest(path=path):
                expected = [
                    engine for system, _, item_kind, engine in G1_ENGINES
                    if system == "dispositivos-e-conexao" and item_kind == kind
                ]
                by_slug = self.get_data(f"{path}?system=dispositivos-e-conexao")
                self.assertEqual([item["slug"] for item in by_slug], expected)
                self.assertEqual(by_slug, self.get_data(f"{path}?system={system_id}"))
                self.assertEqual(self.get_data(f"{path}?system=requisicoes-http"), [])
                error = self.assert_error(self.client.get(f"{path}?system=nao-existe"), 404, "not_found")
                self.assertEqual(error["message"], "Sistema planetário não encontrado.")
                self.assert_error(self.client.get(f"{path}?system="), 400, "bad_request")

    def test_every_system_lists_its_engines(self):
        for system_slug in SPEC_IDS["planetary_systems"]:
            with self.subTest(system=system_slug):
                items = self.get_data(f"/api/lessons?system={system_slug}") + self.get_data(
                    f"/api/labs?system={system_slug}"
                )
                expected = [engine for system, _, _, engine in G1_ENGINES if system == system_slug]
                self.assertEqual(sorted(item["slug"] for item in items), sorted(expected))

    def test_lesson_detail_by_every_kind_of_ref(self):
        refs = [
            LESSON["id"],
            LESSON["id"].upper(),
            LESSON["slug"],
            LESSON["planet_id"],
            f"%20{LESSON['slug']}%20",
        ]
        details = [self.get_data(f"/api/lessons/{ref}") for ref in refs]
        for detail in details[1:]:
            self.assertEqual(detail, details[0])
        lesson = details[0]
        self.assertEqual(set(lesson), LESSON_FIELDS | {"planet", "system"})
        self.assertEqual(lesson["id"], LESSON["id"])
        self.assertEqual(lesson["title"], "O que é uma rede?")
        self.assertEqual(lesson["content"]["code"], "1.1")
        self.assertEqual(lesson["content"]["engine"], "o-que-e-uma-rede")
        self.assertTrue(lesson["content"]["central_idea"])
        self.assertEqual(set(lesson["planet"]), PLANET_FIELDS)
        self.assertEqual(lesson["planet"]["id"], LESSON["planet_id"])
        self.assertEqual(lesson["planet"]["type"], "lesson")
        self.assertEqual(set(lesson["system"]), SYSTEM_FIELDS)
        self.assertEqual(lesson["system"]["slug"], "dispositivos-e-conexao")

    def test_lab_detail_by_every_kind_of_ref(self):
        refs = [LAB["id"], LAB["id"].upper(), LAB["slug"], LAB["planet_id"]]
        details = [self.get_data(f"/api/labs/{ref}") for ref in refs]
        for detail in details[1:]:
            self.assertEqual(detail, details[0])
        lab = details[0]
        self.assertEqual(set(lab), LAB_FIELDS | {"planet", "system"})
        self.assertEqual(lab["max_score"], 100)
        self.assertEqual(lab["config"], {"code": "1.3", "type": "montagem", "engine": "conectando-uma-rede"})
        self.assertEqual(lab["planet"]["type"], "lab")
        self.assertEqual(lab["planet"]["id"], LAB["planet_id"])
        self.assertEqual(lab["system"]["slug"], "dispositivos-e-conexao")

    def test_all_sixteen_engines_resolve_by_planet_slug(self):
        for system_slug, code, kind, engine in G1_ENGINES:
            with self.subTest(engine=engine):
                path = "/api/lessons/" if kind == "lesson" else "/api/labs/"
                detail = self.get_data(path + engine)
                payload = detail["content"] if kind == "lesson" else detail["config"]
                self.assertEqual(payload["engine"], engine)
                self.assertEqual(payload["code"], code)
                self.assertEqual(detail["planet"]["slug"], engine)
                self.assertEqual(detail["planet"]["type"], kind)
                self.assertEqual(detail["system"]["slug"], system_slug)

    def test_not_found_messages(self):
        cases = [
            ("/api/lessons/nao-existe", "Aula não encontrada."),
            ("/api/lessons/00000000-0000-4000-8000-000000000000", "Aula não encontrada."),
            ("/api/labs/nao-existe", "Laboratório não encontrado."),
            (f"/api/labs/{LESSON['id']}", "Laboratório não encontrado."),
            (f"/api/lessons/{LAB['slug']}", "Aula não encontrada: este planeta é um laboratório."),
            (f"/api/lessons/{LAB['planet_id']}", "Aula não encontrada: este planeta é um laboratório."),
            (f"/api/labs/{LESSON['planet_id']}", "Laboratório não encontrado: este planeta é uma aula."),
        ]
        for path, message in cases:
            with self.subTest(path=path):
                error = self.assert_error(self.client.get(path), 404, "not_found")
                self.assertEqual(error["message"], message)


class GalaxyOrderTest(unittest.TestCase):
    def test_unfiltered_list_orders_by_age_range_then_order_index_then_name(self):
        stamp = "2026-10-09T00:00:00+00:00"
        older = AgeRange("ar-older", "Mais velhos", "mais-velhos", 14, None, None, stamp, stamp)
        younger = AgeRange("ar-younger", "Mais novos", "mais-novos", 0, 13, None, stamp, stamp)

        def galaxy(slug, name, age_range, order_index):
            return Galaxy(slug, age_range.id, name, slug, None, order_index, None, stamp, stamp)

        galaxies = [
            galaxy("a-velha", "A velha", older, 0),
            galaxy("z-nova-2", "Z nova", younger, 2),
            galaxy("b-nova-1", "B nova", younger, 1),
            galaxy("a-nova-1", "A nova", younger, 1),
        ]
        service = GalaxyService(
            SimpleNamespace(list_all=lambda: galaxies),
            SimpleNamespace(list_all=lambda: [younger, older]),
            SimpleNamespace(),
            SimpleNamespace(),
        )
        self.assertEqual(
            [item["slug"] for item in service.list_galaxies()],
            ["a-nova-1", "b-nova-1", "z-nova-2", "a-velha"],
        )


class RecordingDataSource:
    def __init__(self, source):
        self._source = source
        self.name = source.name
        self.calls = []

    def list(self, table, filters=None, order_by=None):
        self.calls.append(("list", table, filters, order_by))
        return self._source.list(table, filters, order_by)

    def get(self, table, column, value):
        self.calls.append(("get", table, column, value))
        return self._source.get(table, column, value)

    def ping(self):
        self.calls.append(("ping",))
        return self._source.ping()


class GalaxyPlanetsQueryTest(unittest.TestCase):
    def test_planets_of_all_systems_come_from_a_single_in_query(self):
        source = RecordingDataSource(LocalDataSource(SEED_JSON))
        service = GalaxyService(
            GalaxyRepository(source),
            AgeRangeRepository(source),
            PlanetarySystemRepository(source),
            PlanetRepository(source),
        )
        galaxy = service.get_galaxy("internet-e-web")
        planet_calls = [call for call in source.calls if call[1] == "planets"]
        self.assertEqual(len(planet_calls), 1)
        _, _, filters, order_by = planet_calls[0]
        self.assertEqual(list(filters), ["planetary_system_id"])
        self.assertEqual(filters["planetary_system_id"], [system["id"] for system in galaxy["systems"]])
        self.assertEqual(order_by, ["order_index", "name"])
        self.assertEqual(sum(len(system["planets"]) for system in galaxy["systems"]), 16)

    def test_galaxy_without_systems_skips_planets_query(self):
        source = RecordingDataSource(LocalDataSource(SEED_JSON))
        empty_systems = SimpleNamespace(list_by_galaxy=lambda galaxy_id: [])
        service = GalaxyService(
            GalaxyRepository(source), AgeRangeRepository(source), empty_systems, PlanetRepository(source)
        )
        self.assertEqual(service.get_galaxy("api-rest")["systems"], [])
        self.assertFalse([call for call in source.calls if call[1] == "planets"])


class PlanetModelTest(unittest.TestCase):
    ROW = {
        "id": "p1",
        "planetary_system_id": "s1",
        "name": "1.3 Conectando uma rede",
        "slug": "conectando-uma-rede",
        "kind": "lab",
        "order_index": 3,
        "sprite_key": "planet-deploy",
        "created_at": "2026-10-09T00:00:00+00:00",
        "updated_at": "2026-10-09T00:00:00+00:00",
    }

    def test_kind_column_becomes_type(self):
        planet = Planet.from_row(self.ROW)
        self.assertEqual(planet.type, "lab")
        data = planet.to_dict()
        self.assertEqual(set(data), PLANET_FIELDS)
        self.assertNotIn("kind", data)
        self.assertIsNone(data["description"])
        self.assertEqual(self.ROW["kind"], "lab")
        self.assertNotIn("type", self.ROW)

    def test_explicit_type_wins(self):
        self.assertEqual(Planet.from_row({**self.ROW, "type": "lesson"}).type, "lesson")


class ErrorApiTest(ApiTestCase):
    def test_unknown_slug_returns_404(self):
        for path in (
            "/api/age-ranges/nao-existe",
            "/api/age-ranges/13-anos-ou-menos",
            "/api/galaxies/nao-existe",
            "/api/systems/nao-existe",
            "/api/galaxies/00000000-0000-4000-8000-000000000000",
        ):
            with self.subTest(path=path):
                self.assert_error(self.client.get(path), 404, "not_found")

    def test_unknown_route_returns_json_404(self):
        for path in ("/api/nao-existe", "/", "/api/age-ranges/", "/api/lessons/"):
            with self.subTest(path=path):
                error = self.assert_error(self.client.get(path), 404, "not_found")
                self.assertEqual(error["message"], "Rota não encontrada.")

    def test_method_not_allowed_returns_json_405(self):
        response = self.client.post("/api/age-ranges")
        self.assert_error(response, 405, "method_not_allowed")
        self.assertIn("GET", response.headers["Allow"])
        self.assert_error(self.client.post("/api/lessons"), 405, "method_not_allowed")

    def test_future_endpoints_return_501(self):
        for method, path in FUTURE_ENDPOINTS:
            with self.subTest(method=method, path=path):
                response = self.client.open(path, method=method, json={})
                error = self.assert_error(response, 501, "not_implemented")
                self.assertEqual(error["message"], NOT_IMPLEMENTED_MESSAGE)


class CorsTest(ApiTestCase):
    def test_allowed_origin_receives_header(self):
        response = self.client.get("/api/health", headers={"Origin": ALLOWED_ORIGIN})
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN)
        self.assertIn("Origin", response.headers.get("Vary", ""))

    def test_other_origin_does_not_receive_header(self):
        response = self.client.get("/api/health", headers={"Origin": "http://intruso.test"})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)
        self.assertIn("Origin", response.headers.get("Vary", ""))

    def test_error_responses_also_receive_header(self):
        for path, status in (("/api/progress", 501), ("/api/lessons/nao-existe", 404)):
            with self.subTest(path=path):
                response = self.client.get(path, headers={"Origin": ALLOWED_ORIGIN})
                self.assertEqual(response.status_code, status)
                self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN)

    def test_preflight_returns_204(self):
        response = self.client.options(
            "/api/progress/qualquer-planeta",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "PUT",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.get_data(), b"")
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN)
        methods = response.headers.get("Access-Control-Allow-Methods", "")
        for method in ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"):
            self.assertIn(method, methods)
        self.assertIn("Content-Type", response.headers.get("Access-Control-Allow-Headers", ""))

    def test_preflight_on_unknown_route_returns_404(self):
        response = self.client.options("/api/nao-existe", headers={"Origin": ALLOWED_ORIGIN})
        self.assert_error(response, 404, "not_found")

    def test_cors_origins_from_env(self):
        settings = Settings.from_env({"CORS_ORIGINS": " http://feira.test , http://outra.test ,"})
        self.assertEqual(settings.cors_origins, ("http://feira.test", "http://outra.test"))
        self.assertEqual(
            Settings.from_env({}).cors_origins,
            ("http://localhost:3000", "http://127.0.0.1:3000"),
        )
        client = local_app(cors_origins=("http://feira.test",)).test_client()
        response = client.get("/api/health", headers={"Origin": "http://feira.test"})
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "http://feira.test")
        response = client.get("/api/health", headers={"Origin": ALLOWED_ORIGIN})
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)


class FakeQuery:
    def __init__(self, client):
        self._client = client

    def _record(self, name, *args, **kwargs):
        self._client.calls.append((name, args, kwargs))
        return self

    def select(self, *columns):
        return self._record("select", *columns)

    def eq(self, column, value):
        return self._record("eq", column, value)

    def in_(self, column, values):
        return self._record("in_", column, values)

    def order(self, column, *, desc=False):
        return self._record("order", column, desc=desc)

    def limit(self, size):
        return self._record("limit", size)

    def execute(self):
        self._client.calls.append(("execute", (), {}))
        if self._client.error is not None:
            raise self._client.error
        return SimpleNamespace(data=self._client.rows)


class FakeSupabaseClient:
    def __init__(self, rows=None, error=None):
        self.rows = [] if rows is None else rows
        self.error = error
        self.calls = []

    def table(self, name):
        self.calls.append(("table", (name,), {}))
        return FakeQuery(self)

    def executions(self):
        return sum(1 for call in self.calls if call[0] == "execute")


class SupabaseDataSourceTest(unittest.TestCase):
    def test_list_chains_select_eq_order_execute(self):
        rows = [{"id": "1"}, {"id": "2"}]
        client = FakeSupabaseClient(rows=rows)
        result = SupabaseDataSource(client).list(
            "galaxies", {"age_range_id": "abc"}, ["order_index", "-name"]
        )
        self.assertEqual(result, rows)
        self.assertEqual(
            client.calls,
            [
                ("table", ("galaxies",), {}),
                ("select", ("*",), {}),
                ("eq", ("age_range_id", "abc"), {}),
                ("order", ("order_index",), {"desc": False}),
                ("order", ("name",), {"desc": True}),
                ("execute", (), {}),
            ],
        )

    def test_list_with_list_or_tuple_filter_uses_in(self):
        for values in (["s1", "s2"], ("s1", "s2")):
            with self.subTest(values=values):
                client = FakeSupabaseClient(rows=[{"id": "p1"}])
                result = SupabaseDataSource(client).list(
                    "planets", {"planetary_system_id": values, "kind": "lab"}, ["order_index"]
                )
                self.assertEqual(result, [{"id": "p1"}])
                self.assertEqual(
                    client.calls,
                    [
                        ("table", ("planets",), {}),
                        ("select", ("*",), {}),
                        ("in_", ("planetary_system_id", ["s1", "s2"]), {}),
                        ("eq", ("kind", "lab"), {}),
                        ("order", ("order_index",), {"desc": False}),
                        ("execute", (), {}),
                    ],
                )

    def test_empty_in_filter_skips_the_request(self):
        client = FakeSupabaseClient(rows=[{"id": "nao-deveria-vir"}])
        self.assertEqual(SupabaseDataSource(client).list("planets", {"planetary_system_id": []}), [])
        self.assertEqual(client.calls, [])

    def test_in_filter_with_real_postgrest_builder(self):
        client = SyncPostgrestClient("http://127.0.0.1:9/rest/v1")
        builder_type = type(client.from_("planets").select("*"))
        captured = []

        def fake_execute(query):
            captured.append(str(query.request.params))
            return SimpleNamespace(data=[])

        with mock.patch.object(builder_type, "execute", autospec=True, side_effect=fake_execute):
            SupabaseDataSource(client).list("planets", {"planetary_system_id": ["a", "b"]}, ["order_index"])
        self.assertEqual(captured, ["select=%2A&planetary_system_id=in.%28a%2Cb%29&order=order_index.asc"])

    def test_get_uses_limit_and_returns_first_row(self):
        client = FakeSupabaseClient(rows=[{"id": "x", "slug": "api-rest"}])
        self.assertEqual(
            SupabaseDataSource(client).get("galaxies", "slug", "api-rest"),
            {"id": "x", "slug": "api-rest"},
        )
        self.assertEqual(
            client.calls,
            [
                ("table", ("galaxies",), {}),
                ("select", ("*",), {}),
                ("eq", ("slug", "api-rest"), {}),
                ("limit", (1,), {}),
                ("execute", (), {}),
            ],
        )
        self.assertIsNone(SupabaseDataSource(FakeSupabaseClient()).get("galaxies", "slug", "x"))

    def test_ping(self):
        client = FakeSupabaseClient()
        self.assertTrue(SupabaseDataSource(client).ping())
        self.assertEqual(client.calls[:2], [("table", ("age_ranges",), {}), ("select", ("id",), {})])
        failing = FakeSupabaseClient(error=httpx.ConnectError("conexão recusada"))
        with self.assertLogs("app.repositories.data_source", "ERROR"):
            self.assertFalse(SupabaseDataSource(failing).ping())

    def test_client_errors_become_service_unavailable(self):
        errors = [
            APIError({"message": "relation does not exist", "code": "42P01", "hint": None, "details": None}),
            httpx.ConnectError("conexão recusada"),
            httpx.ReadTimeout("tempo esgotado"),
        ]
        for error in errors:
            with self.subTest(error=type(error).__name__):
                source = SupabaseDataSource(FakeSupabaseClient(error=error))
                with self.assertLogs("app.repositories.data_source", "ERROR") as logs:
                    with self.assertRaises(ServiceUnavailableError) as raised:
                        source.list("age_ranges")
                self.assertIs(raised.exception.__cause__, error)
                self.assertEqual(raised.exception.status_code, 503)
                self.assertIn(type(error).__name__, logs.output[0])
                self.assertIn("age_ranges", logs.output[0])

    def test_unexpected_payload_becomes_service_unavailable(self):
        source = SupabaseDataSource(FakeSupabaseClient(rows="<html>"))
        with self.assertLogs("app.repositories.data_source", "ERROR"):
            with self.assertRaises(ServiceUnavailableError):
                source.list("age_ranges")

    def test_api_returns_503_when_supabase_fails(self):
        fake = FakeSupabaseClient(error=httpx.ConnectError("conexão recusada"))
        settings = Settings(
            data_source="supabase",
            supabase_url="https://exemplo.supabase.co",
            supabase_key="chave-fake",
            fallback_to_local=False,
        )
        with mock.patch("app.config.supabase.create_supabase_client", return_value=fake):
            client = create_app(settings).test_client()
        with self.assertLogs("app.repositories.data_source", "ERROR") as logs:
            response = client.get("/api/age-ranges")
            again = client.get("/api/age-ranges")
            health = client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(again.status_code, 503)
        self.assertEqual(fake.executions(), 3)
        self.assertEqual(response.get_json()["error"]["code"], "service_unavailable")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(
            health.get_json()["data"],
            {"status": "degraded", "data_source": "supabase", "database": "error"},
        )
        self.assertNotIn("chave-fake", "\n".join(logs.output))

    def test_api_reads_rows_from_supabase(self):
        rows = load_seed()["age_ranges"]
        fake = FakeSupabaseClient(rows=rows)
        settings = Settings(data_source="auto", supabase_url="https://exemplo.supabase.co", supabase_key="chave-fake")
        with mock.patch("app.config.supabase.create_supabase_client", return_value=fake) as factory:
            client = create_app(settings).test_client()
        factory.assert_called_once_with("https://exemplo.supabase.co", "chave-fake")
        response = client.get("/api/age-ranges")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"], rows)
        self.assertIn(("order", ("min_age",), {"desc": False}), fake.calls)

    def test_api_caches_catalog_reads_but_not_health(self):
        fake = FakeSupabaseClient(rows=load_seed()["age_ranges"])
        settings = Settings(data_source="supabase", supabase_url="https://exemplo.supabase.co", supabase_key="k")
        with mock.patch("app.config.supabase.create_supabase_client", return_value=fake):
            client = create_app(settings).test_client()
        first = client.get("/api/age-ranges").get_json()
        second = client.get("/api/age-ranges").get_json()
        self.assertEqual(first, second)
        self.assertEqual(fake.executions(), 1)
        client.get("/api/health")
        client.get("/api/health")
        self.assertEqual(fake.executions(), 3)

    def test_api_without_cache_always_queries(self):
        fake = FakeSupabaseClient(rows=load_seed()["age_ranges"])
        settings = Settings(
            data_source="supabase", supabase_url="https://exemplo.supabase.co", supabase_key="k", catalog_cache_seconds=0
        )
        with mock.patch("app.config.supabase.create_supabase_client", return_value=fake):
            client = create_app(settings).test_client()
        client.get("/api/age-ranges")
        client.get("/api/age-ranges")
        self.assertEqual(fake.executions(), 2)


class LocalDataSourceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = LocalDataSource(SEED_JSON)
        cls.system_ids = [
            SPEC_IDS["planetary_systems"]["dispositivos-e-conexao"],
            SPEC_IDS["planetary_systems"]["comunicacao-e-seguranca"],
        ]

    def test_list_with_list_or_tuple_filter(self):
        for values in (self.system_ids, tuple(self.system_ids)):
            with self.subTest(values=type(values).__name__):
                rows = self.source.list("planets", {"planetary_system_id": values}, ["order_index", "name"])
                self.assertEqual(len(rows), 8)
                self.assertEqual({row["planetary_system_id"] for row in rows}, set(self.system_ids))
                order = [row["order_index"] for row in rows]
                self.assertEqual(order, sorted(order))

    def test_in_filter_combined_with_equality(self):
        rows = self.source.list("planets", {"planetary_system_id": self.system_ids, "kind": "lab"})
        self.assertEqual(len(rows), 4)
        self.assertEqual({row["kind"] for row in rows}, {"lab"})

    def test_empty_in_filter_returns_nothing(self):
        self.assertEqual(self.source.list("planets", {"planetary_system_id": []}), [])

    def test_rows_are_copies(self):
        rows = self.source.list("age_ranges")
        rows[0]["name"] = "alterado"
        self.assertNotEqual(self.source.list("age_ranges")[0]["name"], "alterado")


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


class CountingSource:
    name = "contador"

    def __init__(self, rows=None, errors=None):
        self.rows = rows if rows is not None else [{"id": "1", "slug": "a", "data": {"x": 1}}]
        self.errors = list(errors or [])
        self.calls = []

    def _maybe_fail(self):
        if self.errors:
            raise self.errors.pop(0)

    def list(self, table, filters=None, order_by=None):
        self.calls.append(("list", table, filters, order_by))
        self._maybe_fail()
        return [dict(row) for row in self.rows]

    def get(self, table, column, value):
        self.calls.append(("get", table, column, value))
        self._maybe_fail()
        return next((dict(row) for row in self.rows if row.get(column) == value), None)

    def ping(self):
        self.calls.append(("ping",))
        return True


class CachedDataSourceTest(unittest.TestCase):
    def setUp(self):
        self.clock = FakeClock()
        self.inner = CountingSource()
        self.cache = CachedDataSource(self.inner, 300, clock=self.clock)

    def test_hit_and_miss_for_list(self):
        first = self.cache.list("planets", {"planetary_system_id": ["s1", "s2"]}, ["order_index"])
        second = self.cache.list("planets", {"planetary_system_id": ["s1", "s2"]}, ["order_index"])
        self.assertEqual(first, second)
        self.assertEqual(len(self.inner.calls), 1)

        self.cache.list("planets", {"planetary_system_id": ["s2", "s1"]}, ["order_index"])
        self.cache.list("planets", {"planetary_system_id": ["s1", "s2"]}, ["-order_index"])
        self.cache.list("planets", {"planetary_system_id": "s1"}, ["order_index"])
        self.cache.list("lessons", {"planetary_system_id": ["s1", "s2"]}, ["order_index"])
        self.cache.list("planets")
        self.assertEqual(len(self.inner.calls), 6)

    def test_filters_key_ignores_dict_order(self):
        self.cache.list("planets", {"a": 1, "b": 2})
        self.cache.list("planets", {"b": 2, "a": 1})
        self.assertEqual(len(self.inner.calls), 1)

    def test_get_is_cached_including_misses(self):
        self.assertEqual(self.cache.get("lessons", "slug", "a")["id"], "1")
        self.assertEqual(self.cache.get("lessons", "slug", "a")["id"], "1")
        self.assertIsNone(self.cache.get("lessons", "slug", "zzz"))
        self.assertIsNone(self.cache.get("lessons", "slug", "zzz"))
        self.cache.get("lessons", "id", "a")
        self.assertEqual(len(self.inner.calls), 3)

    def test_ttl_expiration(self):
        self.cache.list("galaxies")
        self.clock.now += 299
        self.cache.list("galaxies")
        self.assertEqual(len(self.inner.calls), 1)
        self.clock.now += 2
        self.cache.list("galaxies")
        self.assertEqual(len(self.inner.calls), 2)
        self.cache.list("galaxies")
        self.assertEqual(len(self.inner.calls), 2)

    def test_zero_ttl_disables_cache(self):
        cache = CachedDataSource(self.inner, 0, clock=self.clock)
        cache.list("galaxies")
        cache.list("galaxies")
        cache.get("galaxies", "slug", "a")
        cache.get("galaxies", "slug", "a")
        self.assertEqual(len(self.inner.calls), 4)

    def test_only_catalog_tables_are_cached(self):
        self.assertEqual(
            CATALOG_TABLES,
            {"age_ranges", "galaxies", "planetary_systems", "planets", "lessons", "labs"},
        )
        for table in CATALOG_TABLES:
            self.cache.list(table)
            self.cache.list(table)
        self.assertEqual(len(self.inner.calls), len(CATALOG_TABLES))
        self.inner.calls.clear()
        for table in ("users", "user_progress", "scores"):
            self.cache.list(table)
            self.cache.list(table)
            self.cache.get(table, "id", "1")
            self.cache.get(table, "id", "1")
        self.assertEqual(len(self.inner.calls), 12)

    def test_ping_is_never_cached(self):
        self.assertTrue(self.cache.ping())
        self.assertTrue(self.cache.ping())
        self.assertEqual(self.inner.calls, [("ping",), ("ping",)])

    def test_errors_are_not_cached(self):
        inner = CountingSource(errors=[ServiceUnavailableError()])
        cache = CachedDataSource(inner, 300, clock=self.clock)
        with self.assertLogs("app.repositories.data_source", "WARNING"):
            with self.assertRaises(ServiceUnavailableError):
                cache.list("galaxies")
        self.assertEqual(len(cache.list("galaxies")), 1)
        cache.list("galaxies")
        self.assertEqual(len(inner.calls), 2)

    def test_callers_cannot_mutate_cached_rows(self):
        rows = self.cache.list("galaxies")
        rows[0]["slug"] = "alterado"
        rows[0]["data"]["x"] = 99
        rows.append({"id": "intruso"})
        again = self.cache.list("galaxies")
        self.assertEqual(again, [{"id": "1", "slug": "a", "data": {"x": 1}}])
        again[0]["slug"] = "outro"
        self.assertEqual(self.cache.list("galaxies")[0]["slug"], "a")

    def test_clear(self):
        self.cache.list("galaxies")
        self.cache.clear()
        self.cache.list("galaxies")
        self.assertEqual(len(self.inner.calls), 2)

    def test_entry_limit_keeps_memory_bounded(self):
        for index in range(CachedDataSource.MAX_ENTRIES + 10):
            self.cache.get("lessons", "slug", f"slug-{index}")
        self.assertLessEqual(len(self.cache._entries), CachedDataSource.MAX_ENTRIES)

    def test_thread_safety(self):
        errors = []

        def worker():
            try:
                for index in range(200):
                    self.cache.list("planets", {"planetary_system_id": [str(index % 7)]})
                    self.cache.get("lessons", "slug", str(index % 11))
            except Exception as error:  # pragma: no cover
                errors.append(error)

        threads = [threading.Thread(target=worker) for _ in range(8)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(errors, [])
        self.assertEqual(len(self.cache._entries), 18)

    def test_delegates_name(self):
        self.assertEqual(self.cache.name, "contador")
        self.assertIs(self.cache.source, self.inner)


class CreateDataSourceTest(unittest.TestCase):
    def test_local_is_cached_by_default(self):
        source = create_data_source(Settings(data_source="local"))
        self.assertIsInstance(source, CachedDataSource)
        self.assertIsInstance(source.source, LocalDataSource)
        self.assertEqual(source.name, "local")

    def test_cache_disabled_returns_raw_source(self):
        source = create_data_source(Settings(data_source="local", catalog_cache_seconds=0))
        self.assertIsInstance(source, LocalDataSource)

    def test_supabase_is_cached(self):
        with mock.patch("app.config.supabase.create_supabase_client", return_value=FakeSupabaseClient()):
            source = create_data_source(
                Settings(data_source="supabase", supabase_url="https://exemplo.supabase.co", supabase_key="k")
            )
        self.assertIsInstance(source, CachedDataSource)
        self.assertIsInstance(source.source, SupabaseDataSource)
        self.assertEqual(source.name, "supabase")

    def test_auto_without_credentials_falls_back_to_local(self):
        with self.assertLogs("app.repositories.data_source", "WARNING"):
            source = create_data_source(Settings(data_source="auto"))
        self.assertIsInstance(source.source, LocalDataSource)
        self.assertEqual(source.name, "local")

    def test_supabase_without_credentials_raises(self):
        with self.assertRaises(RuntimeError):
            create_data_source(Settings(data_source="supabase", supabase_url="https://exemplo.supabase.co"))

    def test_invalid_mode_raises(self):
        with self.assertRaises(RuntimeError):
            create_data_source(Settings(data_source="planilha"))

    def test_local_mode_ignores_credentials(self):
        with mock.patch("app.config.supabase.create_supabase_client") as factory:
            source = create_data_source(
                Settings(data_source="local", supabase_url="https://exemplo.supabase.co", supabase_key="k")
            )
        factory.assert_not_called()
        self.assertIsInstance(source.source, LocalDataSource)

    def test_settings_repr_hides_key(self):
        self.assertNotIn("segredo", repr(Settings(supabase_key="segredo")))

    def test_catalog_cache_seconds_from_env(self):
        self.assertEqual(Settings.from_env({}).catalog_cache_seconds, 3600)
        self.assertEqual(Settings.from_env({"CATALOG_CACHE_SECONDS": " "}).catalog_cache_seconds, 3600)
        self.assertEqual(Settings.from_env({"CATALOG_CACHE_SECONDS": "0"}).catalog_cache_seconds, 0)
        self.assertEqual(Settings.from_env({"CATALOG_CACHE_SECONDS": "45"}).catalog_cache_seconds, 45)
        self.assertEqual(Settings.from_env({"CATALOG_CACHE_SECONDS": "-5"}).catalog_cache_seconds, 0)
        example = (BACKEND_DIR / ".env.example").read_text(encoding="utf-8")
        self.assertIn("CATALOG_CACHE_SECONDS=3600", example)


SQL_TOKEN = re.compile(r"'(?:[^']|'')*'(?:::jsonb)?|\bnull\b|-?\d+|[()]")
SQL_INSERT = re.compile(
    r"insert into public\.(\w+) \(([^)]*)\)\s+values\s+(.*?)\s+on conflict \(id\) do nothing;",
    re.IGNORECASE | re.DOTALL,
)
SQL_CREATE_TABLE = re.compile(r"create table if not exists public\.(\w+) \((.*?)\n\);", re.DOTALL)
SQL_COLUMN = re.compile(r"^  (\w+) ", re.MULTILINE)


def parse_seed_sql(text):
    tables = {}
    for table, columns, values in SQL_INSERT.findall(text):
        names = [name.strip() for name in columns.split(",")]
        rows, current = [], None
        for token in SQL_TOKEN.findall(values):
            if token == "(":
                current = []
            elif token == ")":
                rows.append(dict(zip(names, current, strict=True)))
                current = None
            elif token.lower() == "null":
                current.append(None)
            elif token.endswith("::jsonb"):
                current.append(json.loads(token[1 : -len("'::jsonb")].replace("''", "'")))
            elif token.startswith("'"):
                current.append(token[1:-1].replace("''", "'"))
            else:
                current.append(int(token))
        tables[table] = rows
    return tables


def migration_columns(sql):
    return {
        table: [column for column in SQL_COLUMN.findall(body) if column != "constraint"]
        for table, body in SQL_CREATE_TABLE.findall(sql)
    }


class SeedConsistencyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql_text = SEED_SQL.read_text(encoding="utf-8")
        cls.sql = parse_seed_sql(cls.sql_text)
        cls.json = load_seed()

    def test_uuids_and_slugs_match_between_sql_and_json(self):
        for table in SPEC_IDS:
            with self.subTest(table=table):
                sql_pairs = {(row["slug"], row["id"]) for row in self.sql[table]}
                json_pairs = {(row["slug"], row["id"]) for row in self.json[table]}
                self.assertEqual(sql_pairs, set(SPEC_IDS[table].items()))
                self.assertEqual(json_pairs, sql_pairs)

    def test_regex_uuids_match(self):
        uuid_pattern = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
        sql_ids = set(re.findall(uuid_pattern, self.sql_text))
        json_ids = {
            row[key] for rows in self.json.values() for row in rows for key in row if key == "id" or key.endswith("_id")
        }
        self.assertEqual(sql_ids, json_ids)

    def test_rows_are_identical(self):
        self.assertEqual(list(self.sql), list(SEED_TABLES))
        self.assertEqual(list(self.json), list(SEED_TABLES))
        for table, rows in self.sql.items():
            with self.subTest(table=table):
                self.assertEqual(rows, self.json[table])
                for sql_row, json_row in zip(rows, self.json[table], strict=True):
                    self.assertEqual(list(sql_row), list(json_row))

    def test_jsonb_values_are_cast(self):
        self.assertEqual(self.sql_text.count("'::jsonb"), 16)
        self.assertTrue(all(isinstance(row["content"], dict) for row in self.sql["lessons"]))
        self.assertTrue(all(isinstance(row["config"], dict) for row in self.sql["labs"]))

    def test_foreign_keys_are_consistent_and_inserted_in_order(self):
        ids = {table: {row["id"] for row in self.json[table]} for table in SEED_TABLES}
        references = [
            ("galaxies", "age_range_id", "age_ranges"),
            ("planetary_systems", "galaxy_id", "galaxies"),
            ("planets", "planetary_system_id", "planetary_systems"),
            ("lessons", "planet_id", "planets"),
            ("labs", "planet_id", "planets"),
        ]
        order = list(self.sql)
        for table, column, parent in references:
            with self.subTest(table=table):
                self.assertLess(order.index(parent), order.index(table))
                self.assertTrue({row[column] for row in self.json[table]} <= ids[parent])

    def test_snapshot_matches_the_g1_engines(self):
        planets = {row["id"]: row for row in self.json["planets"]}
        systems = {row["id"]: row["slug"] for row in self.json["planetary_systems"]}
        found = []
        for table, payload_key, kind in (("lessons", "content", "lesson"), ("labs", "config", "lab")):
            for row in self.json[table]:
                planet = planets[row["planet_id"]]
                self.assertEqual(planet["kind"], kind)
                self.assertEqual(planet["slug"], row["slug"])
                self.assertEqual(row[payload_key]["engine"], row["slug"])
                found.append((systems[planet["planetary_system_id"]], row[payload_key]["code"], kind, row["slug"]))
        self.assertEqual(sorted(found), sorted(G1_ENGINES))
        self.assertEqual(len(planets), 16)
        self.assertEqual({row["max_score"] for row in self.json["labs"]}, {100})
        self.assertEqual(len({row["planet_id"] for row in self.json["lessons"] + self.json["labs"]}), 16)


class MigrationStructureTest(unittest.TestCase):
    CATALOG_TABLES = {"age_ranges", "galaxies", "planetary_systems", "planets", "lessons", "labs", "achievements", "avatars"}
    USER_TABLES = {"users", "user_progress", "scores", "user_achievements"}

    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION_SQL.read_text(encoding="utf-8")

    def test_all_tables_have_trigger_and_rls(self):
        tables = set(re.findall(r"create table if not exists public\.(\w+)", self.sql))
        self.assertEqual(tables, self.CATALOG_TABLES | self.USER_TABLES)
        triggers = set(re.findall(r"create trigger set_updated_at before update on public\.(\w+)", self.sql))
        rls = set(re.findall(r"alter table public\.(\w+) enable row level security;", self.sql))
        self.assertEqual(triggers, tables)
        self.assertEqual(rls, tables)

    def test_public_read_policies_only_on_catalog(self):
        policies = set(
            re.findall(
                r"create policy catalog_public_read on public\.(\w+)\s+for select to anon, authenticated using \(true\);",
                self.sql,
            )
        )
        self.assertEqual(policies, self.CATALOG_TABLES)

    def test_catalog_columns_match_the_snapshot(self):
        columns = migration_columns(self.sql)
        seed = load_seed()
        for table in SEED_TABLES:
            with self.subTest(table=table):
                self.assertEqual(columns[table], list(seed[table][0]))

    def test_planets_use_kind_column(self):
        columns = migration_columns(self.sql)
        self.assertIn("kind", columns["planets"])
        self.assertNotIn("type", columns["planets"])
        self.assertIn("kind text not null check (kind in ('lesson', 'lab'))", self.sql)

    def test_foreign_keys_have_indexes(self):
        checked = 0
        for table, body in SQL_CREATE_TABLE.findall(self.sql):
            leading = set(re.findall(rf"create index if not exists \w+ on public\.{table} \((\w+)", self.sql))
            leading |= set(re.findall(r"unique \((\w+)", body))
            for column, unique in re.findall(
                r"^  (\w+) uuid (?:not null )?(unique )?references public\.\w+", body, re.MULTILINE
            ):
                checked += 1
                with self.subTest(table=table, column=column):
                    self.assertTrue(unique or column in leading)
        self.assertEqual(checked, 14)

    def test_idempotent_statements(self):
        self.assertNotRegex(self.sql, r"create table (?!if not exists)")
        self.assertNotRegex(self.sql, r"create index (?!if not exists)")
        self.assertEqual(self.sql.count("create policy"), self.sql.count("drop policy if exists"))
        self.assertEqual(self.sql.count("create trigger"), self.sql.count("drop trigger if exists"))


if __name__ == "__main__":
    unittest.main()
