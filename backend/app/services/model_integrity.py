"""Verify original model weights by SHA-256 before they are loaded.

Does not alter weights, architecture, or inference configuration.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import httpx

from app.config import settings

EXPECTED_ILLEGAL_WASTE_SHA256 = "126704d854e4f16fffc1471709b2429dcdae03806c4090c0b919080612583027"
EXPECTED_SEGREGATION_SHA256 = "34554a5db8d8363605dbbc64f9d120f65a13b6dc259f9cf2ac5c70a14b2ad05c"

_last_verified: dict[str, str] = {}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_model_path(configured: str) -> Path:
    p = Path(configured)
    if p.is_absolute() and p.exists():
        return p
    # Check cwd
    candidate = (Path.cwd() / p).resolve()
    if candidate.exists():
        return candidate
    # Check relative to backend directory
    backend_dir = Path(__file__).resolve().parent.parent.parent
    candidate = (backend_dir / p).resolve()
    if candidate.exists():
        return candidate
    # Check relative to repo root (parent of backend)
    candidate = (backend_dir.parent / p).resolve()
    if candidate.exists():
        return candidate
    return (backend_dir / p).resolve()


def ensure_model_file(path: Path, url: str, expected_sha256: str) -> Path:
    if not path.exists():
        if not url:
            raise FileNotFoundError(f"Model file not found: {path.name}")
        path.parent.mkdir(parents=True, exist_ok=True)
        with httpx.Client(timeout=300.0, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            path.write_bytes(response.content)

    actual = sha256_file(path)
    if actual != expected_sha256.lower():
        raise ValueError(
            f"Model integrity check failed for {path.name}: hash does not match the original weights."
        )
    _last_verified[path.name] = actual
    return path


def prepare_model_paths() -> tuple[Path, Path]:
    illegal_path = resolve_model_path(settings.illegal_waste_model)
    seg_path = resolve_model_path(settings.segregation_model)
    illegal_expected = (settings.illegal_waste_model_sha256 or EXPECTED_ILLEGAL_WASTE_SHA256).lower()
    seg_expected = (settings.segregation_model_sha256 or EXPECTED_SEGREGATION_SHA256).lower()
    ensure_model_file(illegal_path, settings.illegal_waste_model_url, illegal_expected)
    ensure_model_file(seg_path, settings.segregation_model_url, seg_expected)
    return illegal_path, seg_path


def verified_hashes() -> dict[str, str]:
    return dict(_last_verified)
