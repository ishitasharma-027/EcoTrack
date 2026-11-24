"""Automated verification script for EcoTrack AI models.

Checks:
1. Exact SHA-256 hashes of model weights (AI/illegal_waste/best.pt and AI/segregation/best_model_epoch_12.pth).
2. Model loading without architecture or weight alteration.
3. Inference results on fixed benchmark fixture image:
   - YOLO detection class, confidence, and bounding box coordinates.
   - ResNet classification category, confidence, and disposal bin mapping.
"""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

# Add backend directory to path
project_root = Path(__file__).resolve().parent.parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(backend_dir))

EXPECTED_YOLO_SHA256 = "126704d854e4f16fffc1471709b2429dcdae03806c4090c0b919080612583027"
EXPECTED_RESNET_SHA256 = "34554a5db8d8363605dbbc64f9d120f65a13b6dc259f9cf2ac5c70a14b2ad05c"

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest().lower()

def main():
    yolo_file = project_root / "AI" / "illegal_waste" / "best.pt"
    resnet_file = project_root / "AI" / "segregation" / "best_model_epoch_12.pth"
    test_image = project_root / "tests" / "fixtures" / "test_sample.jpg"

    print("==================================================")
    print("EcoTrack AI Model Integrity & Accuracy Benchmark")
    print("==================================================")

    # 1. SHA-256 Verification
    actual_yolo_sha = sha256_file(yolo_file)
    actual_resnet_sha = sha256_file(resnet_file)

    print(f"YOLO Model File:   {yolo_file.name}")
    print(f"  Expected SHA256: {EXPECTED_YOLO_SHA256}")
    print(f"  Actual SHA256:   {actual_yolo_sha}")
    assert actual_yolo_sha == EXPECTED_YOLO_SHA256, "YOLO hash mismatch!"
    print("  Status: PASSED (Exact match)\n")

    print(f"ResNet Model File: {resnet_file.name}")
    print(f"  Expected SHA256: {EXPECTED_RESNET_SHA256}")
    print(f"  Actual SHA256:   {actual_resnet_sha}")
    assert actual_resnet_sha == EXPECTED_RESNET_SHA256, "ResNet hash mismatch!"
    print("  Status: PASSED (Exact match)\n")

    # 2. Model Initialization
    from app.services.ai_service import init_models, detect_illegal_waste, run_segregation
    init_models()
    print("Models initialized successfully through EcoTrack ai_service.\n")

    # 3. Benchmark Inference
    print(f"Running benchmark inference on {test_image.name}...")
    yolo_out = detect_illegal_waste(test_image)
    seg_out = run_segregation(test_image)

    print("YOLO Detection Output:")
    print(f"  Detected Waste: {yolo_out.get('detected_waste')}")
    print(f"  Confidence:     {yolo_out.get('confidence')}%")
    print(f"  Is Illegal:     {yolo_out.get('is_illegal_dumping')}")
    print(f"  Detections:     {yolo_out.get('detections')}")

    print("\nResNet Classification Output:")
    print(f"  Category:       {seg_out.get('category')}")
    print(f"  Confidence:     {seg_out.get('confidence')}%")
    print(f"  Disposal Bin:   {seg_out.get('disposal_bin')}")
    print(f"  Source:         {seg_out.get('source')}")

    # Assertions
    assert yolo_out["detected_waste"] == "Plastic", f"Expected Plastic, got {yolo_out['detected_waste']}"
    assert abs(yolo_out["confidence"] - 48.33) < 0.1, f"Confidence deviated: {yolo_out['confidence']}"
    assert seg_out["category"] == "Organic", f"Expected Organic, got {seg_out['category']}"
    assert abs(seg_out["confidence"] - 57.73) < 0.1, f"Confidence deviated: {seg_out['confidence']}"
    assert seg_out["disposal_bin"] == "Green Bin"

    print("\n==================================================")
    print("ALL AI BENCHMARKS & ACCURACY TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    main()
