import re
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402
from app.config.settings import Settings  # noqa: E402
from app.errors import ConflictError, ServiceUnavailableError  # noqa: E402
from app.repositories.data_source import LocalDataSource, SupabaseDataSource  # noqa: E402
from app.services.auth import LoginThrottle, hash_password, verify_password  # noqa: E402

LAB_PLANET = "dc2289ef-4b9b-424d-b351-f4115bd95639"  # 3.4 Conserte a página (lab)
OTHER_LAB_PLANET = "002ca2f6-5188-4a95-aa6a-4466e12a5f6a"  # 4.3 Detetive digital (lab)
LESSON_PLANET = "28178e76-38a1-445f-afb3-4e61ec61fbb9"  # 3.1 (aula)
SECRET_FIELDS = {"password_hash", "token_hash", "nickname_key"}


def auth(token):
    return {"Authorization": f"Bearer {token}"}


class AccountTestCase(unittest.TestCase):
    def setUp(self):
        self.client = create_app(Settings(data_source="local")).test_client()

    def signup(self, nickname="Cometa", password="1234", age=12, **extra):
        response = self.client.post("/api/users", json={"nickname": nickname, "password": password, "age": age, **extra})
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()["data"]

    def error_code(self, response, status):
        self.assertEqual(response.status_code, status, response.get_data(as_text=True))
        return response.get_json()["error"]["code"]


class SignupTest(AccountTestCase):
    def test_signup_returns_token_and_public_user(self):
        data = self.signup(age=10, avatar_key="tigrinho")
        self.assertTrue(data["token"])
        user = data["user"]
        self.assertEqual(user["nickname"], "Cometa")
        self.assertEqual(user["age"], 10)
        self.assertEqual(user["avatar_key"], "tigrinho")
        self.assertEqual(user["age_range"]["slug"], "13-ou-menos")
        self.assertFalse(SECRET_FIELDS & set(user))

    def test_knowledge_level_is_saved_and_validated(self):
        self.assertEqual(self.signup("Nivel", knowledge_level="intermediario")["user"]["knowledge_level"], "intermediario")
        self.assertIsNone(self.signup("SemNivel")["user"]["knowledge_level"])
        response = self.client.post("/api/users", json={"nickname": "Errado", "password": "1234", "age": 15, "knowledge_level": "expert"})
        self.assertEqual(self.error_code(response, 400), "bad_request")
        token = self.signup("Muda")["token"]
        response = self.client.patch("/api/users/me", headers=auth(token), json={"knowledge_level": "avancado"})
        self.assertEqual(response.get_json()["data"]["knowledge_level"], "avancado")

    def test_age_picks_the_age_range(self):
        self.assertEqual(self.signup("Teen", age=14)["user"]["age_range"]["slug"], "14-ou-mais")
        self.assertEqual(self.signup("Kid", age=13)["user"]["age_range"]["slug"], "13-ou-menos")

    def test_knowledge_level_picks_the_galaxy(self):
        cases = [
            (13, "iniciante", "13-ou-menos"),
            (13, "intermediario", "13-ou-menos"),
            (9, "avancado", "14-ou-mais"),
            (14, "iniciante", "13-ou-menos"),
            (14, "intermediario", "14-ou-mais"),
            (30, "avancado", "14-ou-mais"),
        ]
        for index, (age, level, slug) in enumerate(cases):
            with self.subTest(age=age, level=level):
                user = self.signup(f"Nivel{index}", age=age, knowledge_level=level)["user"]
                self.assertEqual(user["age_range"]["slug"], slug)

    def test_changing_level_or_age_moves_the_galaxy(self):
        token = self.signup("Troca", age=12, knowledge_level="intermediario")["token"]

        def patch(body):
            return self.client.patch("/api/users/me", headers=auth(token), json=body).get_json()["data"]

        self.assertEqual(patch({"knowledge_level": "avancado"})["age_range"]["slug"], "14-ou-mais")
        self.assertEqual(patch({"knowledge_level": "intermediario"})["age_range"]["slug"], "13-ou-menos")
        self.assertEqual(patch({"age": 15})["age_range"]["slug"], "14-ou-mais")

    def test_nickname_is_unique_ignoring_case_and_spaces(self):
        self.signup("Super Nova")
        response = self.client.post("/api/users", json={"nickname": "  super   NOVA ", "password": "abcd", "age": 9})
        self.assertEqual(self.error_code(response, 409), "conflict")

    def test_invalid_input_is_rejected(self):
        cases = [
            {"nickname": "ab", "password": "1234", "age": 10},
            {"nickname": "<script>", "password": "1234", "age": 10},
            {"nickname": "Merdinha", "password": "1234", "age": 10},
            {"nickname": "Valido", "password": "123", "age": 10},
            {"nickname": "Valido", "password": "1234", "age": "dez"},
            {"nickname": "Valido", "password": "1234", "age": True},
            {"nickname": "Valido", "password": "1234", "age": 2},
            {"nickname": "Valido", "password": "1234", "age": 10, "avatar_key": "../x"},
            {},
        ]
        for payload in cases:
            with self.subTest(payload=payload):
                self.assertEqual(self.error_code(self.client.post("/api/users", json=payload), 400), "bad_request")

    def test_filter_does_not_block_innocent_names(self):
        for nickname in ("Computador", "Rolando", "Disputa"):
            with self.subTest(nickname=nickname):
                self.signup(nickname)


class SessionTest(AccountTestCase):
    def test_login_and_me(self):
        self.signup("Orion", "senha1")
        response = self.client.post("/api/sessions", json={"nickname": "orion", "password": "senha1"})
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["data"]["token"]
        me = self.client.get("/api/users/me", headers=auth(token)).get_json()["data"]
        self.assertEqual(me["nickname"], "Orion")

    def test_wrong_password_and_unknown_nickname_give_the_same_401(self):
        self.signup("Orion", "senha1")
        for payload in ({"nickname": "Orion", "password": "errada"}, {"nickname": "Ninguem", "password": "senha1"}):
            response = self.client.post("/api/sessions", json=payload)
            self.assertEqual(self.error_code(response, 401), "unauthorized")
            self.assertEqual(response.get_json()["error"]["message"], "Apelido ou senha incorretos.")

    def test_too_many_wrong_passwords_lock_the_nickname(self):
        self.signup("Orion", "senha1")
        for _ in range(LoginThrottle.MAX_FAILURES):
            self.client.post("/api/sessions", json={"nickname": "Orion", "password": "errada"})
        response = self.client.post("/api/sessions", json={"nickname": "Orion", "password": "senha1"})
        self.assertEqual(self.error_code(response, 429), "too_many_requests")

    def test_me_requires_a_valid_token(self):
        self.assertEqual(self.error_code(self.client.get("/api/users/me"), 401), "unauthorized")
        self.assertEqual(self.error_code(self.client.get("/api/users/me", headers=auth("x")), 401), "unauthorized")

    def test_logout_and_new_login_end_the_old_session(self):
        first = self.signup("Orion", "senha1")["token"]
        second = self.client.post("/api/sessions", json={"nickname": "Orion", "password": "senha1"}).get_json()["data"]["token"]
        self.assertEqual(self.client.get("/api/users/me", headers=auth(first)).status_code, 401)
        self.assertEqual(self.client.delete("/api/sessions/me", headers=auth(second)).status_code, 200)
        self.assertEqual(self.client.get("/api/users/me", headers=auth(second)).status_code, 401)

    def test_update_avatar_and_age(self):
        token = self.signup(age=12)["token"]
        response = self.client.patch("/api/users/me", headers=auth(token), json={"avatar_key": "piaba", "age": 15})
        user = response.get_json()["data"]
        self.assertEqual((user["avatar_key"], user["age"], user["age_range"]["slug"]), ("piaba", 15, "14-ou-mais"))
        self.assertEqual(self.error_code(self.client.patch("/api/users/me", headers=auth(token), json={}), 400), "bad_request")


class ProgressTest(AccountTestCase):
    def test_progress_needs_login(self):
        self.assertEqual(self.client.get("/api/progress").status_code, 401)
        self.assertEqual(self.client.put(f"/api/progress/{LAB_PLANET}", json={"status": "completed"}).status_code, 401)

    def test_lab_completion_keeps_the_best_points(self):
        token = self.signup()["token"]
        put = lambda body: self.client.put(f"/api/progress/{LAB_PLANET}", headers=auth(token), json=body)  # noqa: E731
        self.assertEqual(put({"status": "completed", "points": 8000}).get_json()["data"]["best_points"], 8000)
        self.assertEqual(put({"status": "completed", "points": 6000}).get_json()["data"]["best_points"], 8000)
        self.assertEqual(put({"status": "completed", "points": 90000}).get_json()["data"]["best_points"], 10000)
        entry = put({"status": "in_progress"}).get_json()["data"]
        self.assertEqual(entry["status"], "completed")  # não rebaixa
        listed = self.client.get("/api/progress", headers=auth(token)).get_json()["data"]
        self.assertEqual([(e["planet_id"], e["status"], e["best_points"]) for e in listed], [(LAB_PLANET, "completed", 10000)])

    def test_lesson_progress_has_no_points(self):
        token = self.signup()["token"]
        self.client.put(f"/api/progress/{LESSON_PLANET}", headers=auth(token), json={"status": "in_progress"})
        listed = self.client.get("/api/progress", headers=auth(token)).get_json()["data"]
        self.assertEqual([(e["status"], e["best_points"]) for e in listed], [("in_progress", None)])

    def test_invalid_progress_requests(self):
        token = self.signup()["token"]
        bad = self.client.put(f"/api/progress/{LAB_PLANET}", headers=auth(token), json={"status": "locked"})
        self.assertEqual(self.error_code(bad, 400), "bad_request")
        missing = self.client.put("/api/progress/00000000-0000-4000-8000-000000000000", headers=auth(token), json={"status": "completed"})
        self.assertEqual(self.error_code(missing, 404), "not_found")


class RankingTest(AccountTestCase):
    def finish(self, token, planet, points):
        response = self.client.put(f"/api/progress/{planet}", headers=auth(token), json={"status": "completed", "points": points})
        self.assertEqual(response.status_code, 200)

    def test_galaxy_ranking_sums_best_points_and_shares_ties(self):
        ana = self.signup("Ana")["token"]
        bia = self.signup("Bia")["token"]
        caio = self.signup("Caio")["token"]
        self.finish(ana, LAB_PLANET, 90)
        self.finish(ana, OTHER_LAB_PLANET, 100)
        self.finish(bia, LAB_PLANET, 100)
        self.finish(caio, LAB_PLANET, 100)
        ranking = self.client.get("/api/rankings/galaxies/internet-e-web", headers=auth(caio)).get_json()["data"]
        rows = [(e["position"], e["display_name"], e["points"], e["completed_labs"]) for e in ranking["entries"]]
        self.assertEqual(rows, [(1, "Ana", 190, 2), (2, "Bia", 100, 1), (2, "Caio", 100, 1)])
        self.assertEqual(ranking["me"]["display_name"], "Caio")
        self.assertEqual(ranking["scope"], "galaxy")

    def test_system_ranking_and_public_access(self):
        ana = self.signup("Ana")["token"]
        self.finish(ana, LAB_PLANET, 70)
        ranking = self.client.get("/api/rankings/systems/navegador-e-paginas-web").get_json()["data"]
        self.assertEqual([e["points"] for e in ranking["entries"]], [70])
        self.assertIsNone(ranking["me"])
        other = self.client.get("/api/rankings/systems/comunicacao-e-seguranca").get_json()["data"]
        self.assertEqual(other["entries"], [])

    def test_ranking_shows_how_many_achievements_each_one_has(self):
        ana = self.signup("Ana")["token"]
        bia = self.signup("Bia")["token"]
        self.finish(ana, LAB_PLANET, 100)
        self.finish(bia, LAB_PLANET, 90)
        for slug in ("c-02", "s-03"):
            self.client.post("/api/achievements/me", headers=auth(ana), json={"slug": slug})
        ranking = self.client.get("/api/rankings/galaxies/internet-e-web").get_json()["data"]
        self.assertEqual([(e["display_name"], e["achievements"]) for e in ranking["entries"]], [("Ana", 2), ("Bia", 0)])

    def test_unknown_scope_is_404(self):
        self.assertEqual(self.error_code(self.client.get("/api/rankings/galaxies/nao-existe"), 404), "not_found")


class AchievementTest(AccountTestCase):
    def unlock(self, token, slug):
        return self.client.post("/api/achievements/me", headers=auth(token), json={"slug": slug})

    def test_catalog_is_public_and_ordered(self):
        catalog = self.client.get("/api/achievements").get_json()["data"]
        self.assertEqual(len(catalog), 19)
        self.assertEqual([a["slug"] for a in catalog[:2]], ["c-01", "c-02"])
        self.assertEqual({a["rarity"] for a in catalog}, {"comum", "rara", "lenda", "brutal", "secreta"})
        secret = next(a for a in catalog if a["slug"] == "s-03")
        self.assertEqual((secret["code"], secret["secret"], secret["sprite_key"]), ("S-03", True, "s-03"))

    def test_unlock_is_idempotent_and_listed(self):
        token = self.signup("Piaba")["token"]
        first = self.unlock(token, "s-01")
        self.assertEqual(first.status_code, 201)
        again = self.unlock(token, " S-01 ")
        self.assertEqual(again.status_code, 200)
        self.assertEqual(again.get_json()["data"]["unlocked_at"], first.get_json()["data"]["unlocked_at"])
        self.assertEqual(self.unlock(token, "c-02").status_code, 201)
        mine = self.client.get("/api/achievements/me", headers=auth(token)).get_json()["data"]
        self.assertEqual([m["slug"] for m in mine], ["s-01", "c-02"])
        other = self.signup("Outra")["token"]
        self.assertEqual(self.client.get("/api/achievements/me", headers=auth(other)).get_json()["data"], [])

    def test_invalid_unlock_requests(self):
        self.assertEqual(self.error_code(self.client.get("/api/achievements/me"), 401), "unauthorized")
        self.assertEqual(self.error_code(self.client.post("/api/achievements/me", json={"slug": "c-01"}), 401), "unauthorized")
        token = self.signup()["token"]
        self.assertEqual(self.error_code(self.unlock(token, "nao-existe"), 404), "not_found")
        self.assertEqual(self.error_code(self.unlock(token, ""), 400), "bad_request")
        response = self.client.post("/api/achievements/me", headers=auth(token), json={"slug": 3})
        self.assertEqual(self.error_code(response, 400), "bad_request")

    def test_frontend_config_matches_the_catalog(self):
        config = (BACKEND_DIR.parent / "frontend" / "config" / "achievements.ts").read_text(encoding="utf-8")
        found = re.findall(r'slug: "([a-z]-\d\d)", rarity: "(\w+)", name: "([^"]+)"', config)
        catalog = self.client.get("/api/achievements").get_json()["data"]
        self.assertEqual(found, [(a["slug"], a["rarity"], a["name"]) for a in catalog])


class PasswordTest(unittest.TestCase):
    def test_hash_is_salted_and_verifiable(self):
        first, second = hash_password("segredo", 1000), hash_password("segredo", 1000)
        self.assertNotEqual(first, second)
        self.assertNotIn("segredo", first)
        self.assertTrue(verify_password("segredo", first))
        self.assertFalse(verify_password("outra", first))
        self.assertFalse(verify_password("segredo", None))
        self.assertFalse(verify_password("segredo", "lixo"))


class WriteSourceTest(unittest.TestCase):
    def test_local_insert_and_update(self):
        source = LocalDataSource(BACKEND_DIR / "app" / "data" / "seed.json")
        row = source.insert("users", {"nickname": "A"})
        self.assertTrue(row["id"] and row["created_at"])
        self.assertEqual(source.update("users", {"id": row["id"]}, {"nickname": "B"})[0]["nickname"], "B")
        self.assertEqual(source.get("users", "id", row["id"])["nickname"], "B")
        self.assertEqual(source.update("users", {"id": "outro"}, {"nickname": "C"}), [])

    def test_supabase_unique_violation_becomes_conflict(self):
        from postgrest.exceptions import APIError

        class Query:
            def __init__(self, code):
                self.code = code

            def insert(self, row):
                return self

            def execute(self):
                raise APIError({"code": self.code, "message": "erro", "details": None, "hint": None})

        class Client:
            def __init__(self, code):
                self.code = code

            def table(self, name):
                return Query(self.code)

        with self.assertRaises(ConflictError):
            SupabaseDataSource(Client("23505")).insert("users", {})
        with self.assertLogs("app.repositories.data_source", level="ERROR") as logs, self.assertRaises(ServiceUnavailableError):
            SupabaseDataSource(Client("PGRST204")).insert("users", {})
        self.assertIn("20261022000000_accounts.sql", "\n".join(logs.output))


if __name__ == "__main__":
    unittest.main()


class MissingKnowledgeColumnTest(unittest.TestCase):
    """Supabase sem a migration do nível: a conta é gravada sem a coluna nova."""

    def test_signup_and_update_work_without_the_column(self):
        from app.errors import MissingColumnError
        from app.repositories.account_repository import UserRepository

        class NoLevelColumn(LocalDataSource):
            def insert(self, table, row):
                if "knowledge_level" in row:
                    raise MissingColumnError()
                return super().insert(table, row)

            def update(self, table, filters, values):
                if "knowledge_level" in values:
                    raise MissingColumnError()
                return super().update(table, filters, values)

        users = UserRepository(NoLevelColumn(BACKEND_DIR / "app" / "data" / "seed.json"))
        row = users.create({"nickname": "Sem", "knowledge_level": "iniciante"})
        self.assertEqual(row["nickname"], "Sem")
        self.assertNotIn("knowledge_level", row)
        self.assertIsNone(users.update(row["id"], {"knowledge_level": "avancado"}))
        self.assertEqual(users.update(row["id"], {"age": 15, "knowledge_level": "avancado"})["age"], 15)
