"""Tests mirror the Node fixture self-test: valid fixtures pass, invalid ones fail."""
import json
from pathlib import Path

import pytest

from okuden_ingest.validate import SCHEMA_NAMES, validate

_FIXTURES = Path(__file__).resolve().parents[2] / "data" / "__fixtures__"


@pytest.mark.parametrize("name", SCHEMA_NAMES)
def test_valid_fixture_passes(name: str) -> None:
    data = json.loads((_FIXTURES / f"{name}-valid.json").read_text(encoding="utf-8"))
    errors = validate(name, data)
    assert errors == [], f"valid {name} fixture rejected: {errors}"


@pytest.mark.parametrize("name", SCHEMA_NAMES)
def test_invalid_fixture_fails(name: str) -> None:
    data = json.loads((_FIXTURES / f"{name}-invalid.json").read_text(encoding="utf-8"))
    errors = validate(name, data)
    assert errors, f"invalid {name} fixture was accepted (should have failed)"


def test_unknown_kind_raises() -> None:
    with pytest.raises(ValueError):
        validate("not-a-kind", {})
