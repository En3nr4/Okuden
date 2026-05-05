"""JSON Schema validation against the canonical Okuden schemas.

The schemas live in ``packages/data/schemas/`` (sibling of this package
inside the monorepo). We resolve them relative to the repo root.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError

# Walk up from this file to the repo root: okuden_ingest/ -> ingest/ -> packages/ -> repo
_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCHEMAS_DIR = _REPO_ROOT / "packages" / "data" / "schemas"

SCHEMA_NAMES = ("api", "struct", "version")


def _load_validator(name: str) -> Draft202012Validator:
    schema_path = _SCHEMAS_DIR / f"{name}.schema.json"
    with schema_path.open(encoding="utf-8") as f:
        schema = json.load(f)
    return Draft202012Validator(schema)


_VALIDATORS = {name: _load_validator(name) for name in SCHEMA_NAMES}


def validate(kind: str, data: Any) -> list[ValidationError]:
    """Validate ``data`` against the schema named ``kind``.

    Returns a list of ValidationError. Empty list means valid.
    """
    if kind not in _VALIDATORS:
        raise ValueError(f"unknown schema kind: {kind!r} (expected one of {SCHEMA_NAMES})")
    return list(_VALIDATORS[kind].iter_errors(data))


def is_valid(kind: str, data: Any) -> bool:
    return not validate(kind, data)


def iter_dataset_errors(kind: str) -> Iterable[tuple[Path, ValidationError]]:
    """Yield (path, error) for every entry in ``packages/data/<kind>/`` that fails validation."""
    data_dir = _REPO_ROOT / "packages" / "data" / kind
    for path in sorted(data_dir.glob("*.json")):
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        for err in validate(kind, data):
            yield path, err
