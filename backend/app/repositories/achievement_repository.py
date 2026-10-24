from collections.abc import Iterable
from datetime import datetime, timezone

from app.models.gamification import AchievementRow, UserAchievementRow
from app.repositories import BaseRepository


class AchievementRepository(BaseRepository):
    """Catálogo de conquistas (só leitura, em cache como o resto do catálogo)."""

    table = "achievements"
    model = AchievementRow
    default_order = ("order_index", "slug")

    def list_all(self) -> list[AchievementRow]:
        return self._list()


class UserAchievementRepository(BaseRepository):
    table = "user_achievements"
    model = UserAchievementRow
    default_order = ("unlocked_at",)

    def list_by_user(self, user_id: str) -> list[UserAchievementRow]:
        return self._list({"user_id": user_id})

    def list_by_users(self, user_ids: Iterable[str]) -> list[UserAchievementRow]:
        return self._list({"user_id": list(user_ids)})

    def create(self, user_id: str, achievement_id: str) -> UserAchievementRow:
        values = {
            "user_id": user_id,
            "achievement_id": achievement_id,
            "unlocked_at": datetime.now(timezone.utc).isoformat(),
        }
        row = self._data_source.insert(self.table, values)
        return self.model.from_row(row)
