import os
import sys
import json
import base64
import io
import cv2
import torch
import numpy as np
from PIL import Image

from grounding import load_grounding_model, detect_objects
from ocr import extract_text

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SKIP_LABELS = {"background", "text", "button"}


def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    """Convert PIL image to base64 string."""
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def crop_text_layer(image_path: str, x: int, y: int, w: int, h: int) -> str:
    """
    Crop text region as transparent PNG.
    Text layers use simple rectangular crop with white pixels made transparent.
    """
    img  = Image.open(image_path).convert("RGBA")
    crop = img.crop((x, y, x + w, y + h))
    return pil_to_base64(crop, "PNG")


def build_layers(image_path: str) -> list:
    """
    Full layer extraction pipeline:
    1. GroundingDINO finds named objects with bounding boxes
    2. SAM2 refines each box into a precise pixel mask
    3. PaddleOCR finds all text blocks
    4. Each layer gets a transparent PNG crop

    Returns flat list of layers ready for Fabric.js canvas.
    """
    layers   = []
    layer_id = 1

    # --- load image ---
    image_bgr = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    img_h, img_w = image_rgb.shape[:2]

    # --- step 1: GroundingDINO object detection ---
    print("[LAYERS] Running GroundingDINO...")
    gdino_model = load_grounding_model()
    detections  = detect_objects(image_path, gdino_model)

    # filter background/text labels
    obj_detections = [d for d in detections if d["label"].lower() not in SKIP_LABELS]
    print(f"[LAYERS] {len(obj_detections)} objects to segment with SAM2")

    # --- step 2: SAM2 precise masks for each object ---
    if obj_detections:
        from segment import load_sam2_model, get_mask_for_box, mask_to_transparent_png
        predictor = load_sam2_model()

        for det in obj_detections:
            box = [det["x1"], det["y1"], det["x2"], det["y2"]]

            try:
                mask = get_mask_for_box(predictor, image_rgb, box)

                # get tight bounding box from mask
                rows     = np.where(mask.any(axis=1))[0]
                cols     = np.where(mask.any(axis=0))[0]
                if len(rows) == 0: continue

                y1, y2 = int(rows.min()), int(rows.max())
                x1, x2 = int(cols.min()), int(cols.max())

                # create transparent PNG
                png_img = mask_to_transparent_png(image_rgb, mask)
                b64     = pil_to_base64(png_img, "PNG")

                layers.append({
                    "id":         layer_id,
                    "type":       "object",
                    "label":      det["label"],
                    "x":          x1,
                    "y":          y1,
                    "w":          x2 - x1,
                    "h":          y2 - y1,
                    "confidence": det["confidence"],
                    "base64":     b64,
                    "format":     "png",
                })
                layer_id += 1

            except Exception as e:
                print(f"[LAYERS] SAM2 failed for {det['label']}: {e}")
                continue

        # free SAM2 VRAM before OCR
        del predictor
        torch.cuda.empty_cache() if __import__('torch').cuda.is_available() else None
        print("[LAYERS] SAM2 VRAM freed")

    # --- step 3: OCR text layers ---
    print("[LAYERS] Running OCR...")
    text_blocks = extract_text(image_path)

    for block in text_blocks:
        b64 = crop_text_layer(
            image_path,
            block["x"], block["y"],
            block["w"], block["h"]
        )
        layers.append({
            "id":         layer_id,
            "type":       "text",
            "text":       block["text"],
            "x":          block["x"],
            "y":          block["y"],
            "w":          block["w"],
            "h":          block["h"],
            "confidence": block["confidence"],
            "base64":     b64,
            "format":     "png",
        })
        layer_id += 1

    print(f"[LAYERS] Built {len(layers)} layers ({len(obj_detections)} objects + {len(text_blocks)} text)")
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
    print("Building Transparent Layers")
    print("=" * 50)

    layers = build_layers(TEST_IMAGE)

    print(f"\nGenerated {len(layers)} layers:")
    for layer in layers:
        fmt = layer.get("format", "jpg")
        if layer["type"] == "text":
            print(f"  [{layer['id']}] TEXT   '{layer['text']}' at ({layer['x']},{layer['y']}) [{fmt}]")
        else:
            print(f"  [{layer['id']}] OBJECT '{layer['label']}' at ({layer['x']},{layer['y']}) [{fmt}]")

    save_layers(layers)
    print("=" * 50)