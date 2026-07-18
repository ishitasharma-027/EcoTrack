from pathlib import Path

from ultralytics import YOLO

from app.config import settings
from app.services.segregation_model import DISPOSAL_GUIDE, predict_segregation, load_segregation_model

_illegal_model: YOLO | None = None


def init_models() -> None:
    global _illegal_model
    illegal_path = Path(settings.illegal_waste_model)
    if not illegal_path.is_absolute():
        illegal_path = Path(__file__).resolve().parent.parent.parent / illegal_path

    seg_path = Path(settings.segregation_model)
    if not seg_path.is_absolute():
        seg_path = Path(__file__).resolve().parent.parent.parent / seg_path

    _illegal_model = YOLO(str(illegal_path))
    load_segregation_model(seg_path)


def detect_illegal_waste(image_path: Path) -> dict:
    if _illegal_model is None:
        raise RuntimeError("Illegal waste model not loaded")

    results = _illegal_model(str(image_path), verbose=False)
    detections = []
    primary_class = "Unknown"
    max_conf = 0.0

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = _illegal_model.names.get(cls_id, "Unknown")
            xyxy = box.xyxy[0].tolist()
            detections.append(
                {
                    "class": label,
                    "confidence": round(conf * 100, 2),
                    "bbox": {
                        "x1": round(xyxy[0], 2),
                        "y1": round(xyxy[1], 2),
                        "x2": round(xyxy[2], 2),
                        "y2": round(xyxy[3], 2),
                    },
                }
            )
            if conf > max_conf:
                max_conf = conf
                primary_class = label

    # Flag illegal dumping if garbage/foam/cigarette detected or multiple waste items
    illegal_types = {"Garbage", "Foam", "Cigarette"}
    is_illegal = any(d["class"] in illegal_types for d in detections) or len(detections) >= 2

    return {
        "detected_waste": primary_class if detections else "None",
        "confidence": round(max_conf * 100, 2) if detections else 0.0,
        "is_illegal_dumping": is_illegal or len(detections) > 0,
        "detections": detections,
        "annotated_available": len(detections) > 0,
    }


def run_segregation(image_path: Path) -> dict:
    """Primary: ResNet classifier. Fallback: YOLO detections aggregated."""
    try:
        result = predict_segregation(image_path)
        result["source"] = "classifier"
        result["all_detections"] = []
        return result
    except Exception:
        pass

    if _illegal_model is None:
        raise RuntimeError("Models not loaded")

    yolo_result = detect_illegal_waste(image_path)
    detections = yolo_result.get("detections", [])
    if not detections:
        label = "Other"
        conf = 0.0
    else:
        best = max(detections, key=lambda d: d["confidence"])
        label = best["class"]
        conf = best["confidence"]

    guide = DISPOSAL_GUIDE.get(label, DISPOSAL_GUIDE["Other"])
    return {
        "category": label,
        "confidence": conf,
        "disposal_bin": guide["bin"],
        "disposal_color": guide["color"],
        "disposal_guide": guide["guide"],
        "source": "yolo",
        "all_detections": detections,
    }
