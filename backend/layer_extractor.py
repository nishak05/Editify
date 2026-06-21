import os
import json
from grounding import load_grounding_model, detect_objects
from ocr import extract_text

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

# labels that GroundingDINO detects but we handle separately or don't need
SKIP_LABELS = {"background", "text", "button"}


def build_layers(image_path: str) -> list:
    """
    Run GroundingDINO + OCR on image, combine results into a flat layer list.
    Each layer has: id, type, x, y, w, h, confidence (+ text for text layers).
    This JSON is what the Fabric.js canvas loads to render editable elements.
    """
    layers   = []
    layer_id = 1

    # --- object layers via GroundingDINO ---
    print("[LAYERS] Running object detection...")
    gdino_model = load_grounding_model()
    detections  = detect_objects(image_path, gdino_model)

    for det in detections:
        if det["label"].lower() in SKIP_LABELS:
            continue

        layers.append({
            "id":         layer_id,
            "type":       "object",
            "label":      det["label"],
            "x":          det["x1"],
            "y":          det["y1"],
            "w":          det["w"],
            "h":          det["h"],
            "confidence": det["confidence"],
        })
        layer_id += 1

    # --- text layers via PaddleOCR ---
    print("[LAYERS] Running OCR...")
    text_blocks = extract_text(image_path)

    for block in text_blocks:
        layers.append({
            "id":         layer_id,
            "type":       "text",
            "text":       block["text"],
            "x":          block["x"],
            "y":          block["y"],
            "w":          block["w"],
            "h":          block["h"],
            "confidence": block["confidence"],
        })
        layer_id += 1

    print(f"[LAYERS] Built {len(layers)} layers ({len(detections)} objects + {len(text_blocks)} text)")
    return layers


def save_layers(layers: list, output_dir: str = None) -> str:
    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, "outputs")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "layers.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(layers, f, indent=2, ensure_ascii=False)

    print(f"[LAYERS] Saved → {output_path}")
    return output_path


if __name__ == "__main__":
    TEST_IMAGE = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print("ERROR: Test image missing")
        exit(1)

    print("=" * 50)
    print("Building Editable Layers")
    print("=" * 50)

    layers = build_layers(TEST_IMAGE)

    print(f"\nGenerated {len(layers)} layers:")
    for layer in layers:
        if layer["type"] == "text":
            print(f"  [{layer['id']}] TEXT     '{layer['text']}' at ({layer['x']},{layer['y']})")
        else:
            print(f"  [{layer['id']}] OBJECT   '{layer['label']}' at ({layer['x']},{layer['y']})")

    save_layers(layers)

    print("=" * 50)
    print("Open outputs/layers.json")
    print("=" * 50)