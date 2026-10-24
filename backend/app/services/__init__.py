import re
from typing import Any

from app.errors import NotFoundError
from app.repositories import BaseRepository

UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


def is_uuid(value: str) -> bool:
    return bool(UUID_PATTERN.match(value))


def require_by_ref(repository: BaseRepository, ref: str, not_found_message: str) -> Any:
    ref = ref.strip()
    item = repository.get_by_id(ref.lower()) if is_uuid(ref) else repository.get_by_slug(ref)
    if item is None:
        raise NotFoundError(not_found_message)
    return item
