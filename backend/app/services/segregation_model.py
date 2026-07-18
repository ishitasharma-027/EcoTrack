"""ResNet18-based waste segregation classifier."""

from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

# 6 classes from trained checkpoint
SEGREGATION_CLASSES = ["Organic", "Plastic", "Paper", "Glass", "Metal", "Other"]

DISPOSAL_GUIDE: dict[str, dict] = {
    "Organic": {"bin": "Green Bin", "color": "#22c55e", "guide": "Compost or dispose in organic waste bin."},
    "Plastic": {"bin": "Blue Bin", "color": "#3b82f6", "guide": "Rinse and place in plastic recycling bin."},
    "Paper": {"bin": "Blue Bin", "color": "#60a5fa", "guide": "Keep dry and place in paper recycling."},
    "Glass": {"bin": "Blue Bin", "color": "#06b6d4", "guide": "Rinse bottles and jars for glass recycling."},
    "Metal": {"bin": "Blue Bin", "color": "#64748b", "guide": "Place cans and metal items in recycling."},
    "Other": {"bin": "Gray Bin", "color": "#94a3b8", "guide": "Dispose in general waste if not recyclable."},
    "Cardboard": {"bin": "Blue Bin", "color": "#f59e0b", "guide": "Flatten and place in cardboard recycling."},
    "Battery": {"bin": "E-Waste Collection", "color": "#ef4444", "guide": "Take to authorized e-waste center."},
    "Shoes": {"bin": "Donation / Textile", "color": "#a855f7", "guide": "Donate or use textile recycling."},
    "Foam": {"bin": "Gray Bin", "color": "#78716c", "guide": "Check local foam recycling options."},
    "Garbage": {"bin": "Gray Bin", "color": "#475569", "guide": "General waste disposal."},
    "Cigarette": {"bin": "Hazardous Bin", "color": "#dc2626", "guide": "Dispose in designated hazardous waste."},
}


class SegregationNet(nn.Module):
    def __init__(self, num_classes: int = 6):
        super().__init__()
        self.backbone = models.resnet18(weights=None)
        self.backbone.fc = nn.Sequential(nn.Dropout(0.5), nn.Linear(512, num_classes))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)


_transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

_model: SegregationNet | None = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_segregation_model(model_path: Path) -> None:
    global _model
    _model = SegregationNet(num_classes=len(SEGREGATION_CLASSES))
    checkpoint = torch.load(model_path, map_location=_device, weights_only=False)
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.to(_device)
    _model.eval()


def predict_segregation(image_path: Path) -> dict:
    if _model is None:
        raise RuntimeError("Segregation model not loaded")

    image = Image.open(image_path).convert("RGB")
    tensor = _transform(image).unsqueeze(0).to(_device)

    with torch.no_grad():
        logits = _model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
        confidence, idx = torch.max(probs, dim=0)

    label = SEGREGATION_CLASSES[idx.item()]
    guide = DISPOSAL_GUIDE.get(label, DISPOSAL_GUIDE["Other"])
    return {
        "category": label,
        "confidence": round(float(confidence.item()) * 100, 2),
        "disposal_bin": guide["bin"],
        "disposal_color": guide["color"],
        "disposal_guide": guide["guide"],
    }
