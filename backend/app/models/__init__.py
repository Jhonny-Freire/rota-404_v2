from dataclasses import asdict, fields
from typing import Any, Self


class Model:
    @classmethod
    def from_row(cls, row: dict[str, Any]) -> Self:
        return cls(**{field.name: row.get(field.name) for field in fields(cls)})

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
