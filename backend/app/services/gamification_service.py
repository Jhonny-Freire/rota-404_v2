from collections import Counter
from typing import Any

from app.errors import BadRequestError, ConflictError, NotFoundError, NotImplementedFeatureError
from app.models.gamification import Achievement, ProgressEntry, Ranking, RankingEntry, Score, UserAchievement
from app.repositories.achievement_repository import AchievementRepository, UserAchievementRepository
from app.repositories.account_repository import ProgressRepository, ScoreRepository, UserRepository
from app.repositories.galaxy_repository import GalaxyRepository
from app.repositories.lab_repository import LabRepository
from app.repositories.planet_repository import PlanetRepository
from app.repositories.planetary_system_repository import PlanetarySystemRepository
from app.services import is_uuid, require_by_ref
from app.services.planetary_system_service import SYSTEM_NOT_FOUND
from app.services.user_service import UserService

PLANET_NOT_FOUND = "Planeta não encontrado."
GALAXY_NOT_FOUND = "Galáxia não encontrada."
ACHIEVEMENT_NOT_FOUND = "Conquista não encontrada."
SAVED_STATES = ("in_progress", "completed")
RANKING_SIZE = 50
# pontuação da equipe: 10.000 por laboratório (80.000 por galáxia de 8 labs)
LAB_MAX_SCORE = 10000


class GamificationService:
    def __init__(
        self,
        accounts: UserService,
        users: UserRepository,
        progress: ProgressRepository,
        scores: ScoreRepository,
        galaxies: GalaxyRepository,
        systems: PlanetarySystemRepository,
        planets: PlanetRepository,
        labs: LabRepository,
        achievements: AchievementRepository,
        user_achievements: UserAchievementRepository,
    ) -> None:
        self._accounts = accounts
        self._users = users
        self._progress = progress
        self._scores = scores
        self._galaxies = galaxies
        self._systems = systems
        self._planets = planets
        self._labs = labs
        self._achievements = achievements
        self._user_achievements = user_achievements

    # ── progresso da conta ──

    def list_progress(self, token: str | None) -> list[dict[str, Any]]:
        user_id = self._accounts.require_row(token)["id"]
        best = self._best_points_by_planet(user_id)
        return [
            ProgressEntry(row.entity_id, row.status, best.get(row.entity_id), row.updated_at).to_dict()
            for row in self._progress.list_by_user(user_id)
            if row.status in SAVED_STATES
        ]

    def update_progress(self, token: str | None, planet_id: str, payload: dict[str, Any] | None) -> dict[str, Any]:
        user_id = self._accounts.require_row(token)["id"]
        payload = payload or {}
        status = payload.get("status")
        if status not in SAVED_STATES:
            raise BadRequestError("status precisa ser 'in_progress' ou 'completed'.")
        planet = self._planets.get_by_id(planet_id.lower()) if is_uuid(planet_id) else None
        if planet is None:
            raise NotFoundError(PLANET_NOT_FOUND)

        current = next((row for row in self._progress.list_by_user(user_id) if row.entity_id == planet.id), None)
        if current is not None and current.status == "completed":
            status = "completed"  # nunca rebaixa um planeta concluído
        row = self._save_progress(user_id, planet.id, status)

        if planet.type == "lab" and status == "completed" and payload.get("points") is not None:
            self._save_best_score(user_id, planet, payload.get("points"))
        best = self._best_points_by_planet(user_id).get(planet.id)
        return ProgressEntry(planet.id, row.status, best, row.updated_at).to_dict()

    def _save_progress(self, user_id: str, planet_id: str, status: str):
        try:
            return self._progress.save(user_id, planet_id, status)
        except ConflictError:
            # duas requisições ao mesmo tempo: a outra criou a linha; agora a gravação vira atualização
            return self._progress.save(user_id, planet_id, status)

    def _save_best_score(self, user_id: str, planet: Any, raw_points: Any) -> None:
        lab = self._labs.get_by_planet_id(planet.id)
        system = self._systems.get_by_id(planet.planetary_system_id)
        if lab is None or system is None:
            raise NotFoundError(PLANET_NOT_FOUND)
        try:
            points = int(raw_points)
        except (TypeError, ValueError):
            raise BadRequestError("points precisa ser um número inteiro.") from None
        points = max(0, min(points, lab.max_score or LAB_MAX_SCORE))
        existing = self._scores.get_for_lab(user_id, lab.id)
        if existing is None:
            try:
                self._scores.create(
                    {
                        "user_id": user_id,
                        "galaxy_id": system.galaxy_id,
                        "planetary_system_id": system.id,
                        "lab_id": lab.id,
                        "points": points,
                    }
                )
                return
            except ConflictError:
                existing = self._scores.get_for_lab(user_id, lab.id)
        if existing is not None and points > existing.points:
            self._scores.update_points(existing.id, points)

    def _best_points_by_planet(self, user_id: str) -> dict[str, int]:
        scores = self._scores.list_by_user(user_id)
        if not scores:
            return {}
        lab_planet = {lab.id: lab.planet_id for lab in self._labs.list_all()}
        best: dict[str, int] = {}
        for score in scores:
            planet_id = lab_planet.get(score.lab_id)
            if planet_id:
                best[planet_id] = max(best.get(planet_id, 0), score.points)
        return best

    # ── ranking (público; com token, também devolve a posição de quem pediu) ──

    def get_galaxy_ranking(self, ref: str, token: str | None = None) -> dict[str, Any]:
        galaxy = require_by_ref(self._galaxies, ref, GALAXY_NOT_FOUND)
        return self._ranking("galaxy", galaxy.id, self._scores.list_by_galaxy(galaxy.id), token)

    def get_system_ranking(self, ref: str, token: str | None = None) -> dict[str, Any]:
        system = require_by_ref(self._systems, ref, SYSTEM_NOT_FOUND)
        return self._ranking("planetary_system", system.id, self._scores.list_by_system(system.id), token)

    def _ranking(self, scope: str, scope_id: str, scores: list[Score], token: str | None) -> dict[str, Any]:
        totals: dict[str, list[int]] = {}
        for score in scores:
            total = totals.setdefault(score.user_id, [0, 0])
            total[0] += score.points
            total[1] += 1
        # só contas com apelido (linhas antigas de teste, sem apelido, ficam de fora)
        users = {user.id: user for user in self._users.list_by_ids(totals) if user.nickname} if totals else {}
        ordered = sorted(
            (uid for uid in totals if uid in users),
            key=lambda uid: (-totals[uid][0], users[uid].nickname.casefold()),
        )
        # quantas conquistas cada um tem (aparece ao lado dos pontos)
        achievements: Counter[str] = Counter()
        if ordered:
            achievements.update(row.user_id for row in self._user_achievements.list_by_users(ordered))
        entries: list[RankingEntry] = []
        for index, uid in enumerate(ordered):
            same_as_previous = entries and entries[-1].points == totals[uid][0]
            position = entries[-1].position if same_as_previous else index + 1
            user = users[uid]
            entries.append(
                RankingEntry(position, uid, user.nickname, user.avatar_key, totals[uid][0], totals[uid][1], achievements[uid])
            )

        me_row = self._accounts.optional_row(token)
        me = next((entry for entry in entries if me_row and entry.user_id == me_row["id"]), None)
        return Ranking(scope, scope_id, entries[:RANKING_SIZE], me).to_dict()

    # ── conquistas: as regras rodam no frontend (config/achievements.ts); aqui o catálogo e o que a conta já ganhou ──

    def list_achievements(self) -> list[dict[str, Any]]:
        return [Achievement.from_catalog(row).to_dict() for row in self._achievements.list_all()]

    def list_my_achievements(self, token: str | None) -> list[dict[str, Any]]:
        user_id = self._accounts.require_row(token)["id"]
        return [entry.to_dict() for entry in self._mine(user_id)]

    def unlock_achievement(self, token: str | None, payload: dict[str, Any] | None) -> tuple[dict[str, Any], bool]:
        """Grava a conquista na conta (idempotente). Devolve (conquista, criada agora?)."""
        user_id = self._accounts.require_row(token)["id"]
        slug = (payload or {}).get("slug")
        if not isinstance(slug, str) or not slug.strip():
            raise BadRequestError("slug é obrigatório.")
        achievement = next((row for row in self._achievements.list_all() if row.slug == slug.strip().lower()), None)
        if achievement is None:
            raise NotFoundError(ACHIEVEMENT_NOT_FOUND)
        existing = self._find_mine(user_id, achievement.id)
        if existing is not None:
            return existing.to_dict(), False
        try:
            row = self._user_achievements.create(user_id, achievement.id)
        except ConflictError:
            # duas abas ao mesmo tempo: a outra gravou primeiro
            existing = self._find_mine(user_id, achievement.id)
            if existing is None:
                raise
            return existing.to_dict(), False
        return UserAchievement(achievement.id, achievement.slug, row.unlocked_at).to_dict(), True

    def _mine(self, user_id: str) -> list[UserAchievement]:
        slugs = {row.id: row.slug for row in self._achievements.list_all()}
        return [
            UserAchievement(row.achievement_id, slugs[row.achievement_id], row.unlocked_at)
            for row in self._user_achievements.list_by_user(user_id)
            if row.achievement_id in slugs
        ]

    def _find_mine(self, user_id: str, achievement_id: str) -> UserAchievement | None:
        return next((entry for entry in self._mine(user_id) if entry.achievement_id == achievement_id), None)

    # ── ainda não disponíveis ──

    def list_scores(self) -> list[dict[str, Any]]:
        raise NotImplementedFeatureError()

    def submit_score(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        raise NotImplementedFeatureError()
