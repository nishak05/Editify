import os
import time
import base64
import json
import io
import cv2
import numpy as np
from PIL import Image

from layer_extractor import build_layers
from config import INPAINT_BACKGROUND_METHOD

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def reconstruct_background(image_path: str, layers: list) -> str:
    image_bgr = cv2.imread(image_path)
    h, w      = image_bgr.shape[:2]

    object_mask = np.zeros((h, w), dtype=np.uint8)
    text_mask   = np.zeros((h, w), dtype=np.uint8)

    for layer in layers:
        if layer.get("type") == "text":
            # expand bbox slightly to catch character edge artifacts
            x  = max(0, layer["x"] - 2)
            y  = max(0, layer["y"] - 3)
            x2 = min(w, layer["x"] + layer["w"] + 2)
            y2 = min(h, layer["y"] + layer["h"] + 3)
            text_mask[y:y2, x:x2] = 255
        else:
            x  = max(0, layer["x"])
            y  = max(0, layer["y"])
            x2 = min(w, layer["x"] + layer["w"])
            y2 = min(h, layer["y"] + layer["h"])
            object_mask[y:y2, x:x2] = 255

    # merge overlapping text regions via dilation then close gaps
    if text_mask.any():
        kernel    = np.ones((3, 3), np.uint8)
        text_mask = cv2.dilate(text_mask, kernel, iterations=1)

    clean_bg = image_bgr.copy()

    # object layers — LaMa if enabled, TELEA fallback
    if object_mask.any():
        if INPAINT_BACKGROUND_METHOD == "lama":
            try:
                from inpaint_lama import lama_reconstruct_background
                print("[PIPELINE] Using LaMa for object layers")
                clean_bg = lama_reconstruct_background(clean_bg, object_mask)
            except Exception as e:
                print(f"[PIPELINE] LaMa failed ({e}), falling back to TELEA for objects")
                clean_bg = cv2.inpaint(clean_bg, object_mask, inpaintRadius=25, flags=cv2.INPAINT_TELEA)
        else:
            clean_bg = cv2.inpaint(clean_bg, object_mask, inpaintRadius=25, flags=cv2.INPAINT_TELEA)

    # text layers — always TELEA, applied on top of object result
    if text_mask.any():
        print("[PIPELINE] Using TELEA for text layers")
        clean_bg = cv2.inpaint(clean_bg, text_mask, inpaintRadius=25, flags=cv2.INPAINT_TELEA)

    _, buffer = cv2.imencode('.jpg', clean_bg, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return base64.b64encode(buffer).decode("utf-8")

def run_pipeline(image_path: str) -> dict:
    start = time.time()
    print(f"\n[PIPELINE] Starting: {os.path.basename(image_path)}")

    img          = Image.open(image_path)
    img_w, img_h = img.size
    print(f"[PIPELINE] Image: {img_w}x{img_h}")

    layers, groups = build_layers(image_path)
    print(f"[PIPELINE] {len(layers)} layers, {len(groups)} groups")

    print("[PIPELINE] Reconstructing background...")
    bg_base64 = reconstruct_background(image_path, layers)

    elapsed = round(time.time() - start, 2)
    print(f"[PIPELINE] Done in {elapsed}s")

    return {
        "image_w":           img_w,
        "image_h":           img_h,
        "background_base64": bg_base64,
        "original_base64":   image_to_base64(image_path),
        "layers":            layers,
        "groups":            groups,
        "processing_time_s": elapsed,
    }


def save_pipeline_output(result: dict, output_dir: str = None) -> str:
    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, "outputs")
    os.makedirs(output_dir, exist_ok=True)

    result_slim = {
        "image_w":           result["image_w"],
        "image_h":           result["image_h"],
        "processing_time_s": result["processing_time_s"],
        "layer_count":       len(result["layers"]),
        "group_count":       len(result["groups"]),
        "groups":            result["groups"],
        "layers": [
            {k: v for k, v in layer.items() if k != "base64"}
            for layer in result["layers"]
        ]
    }

    out_path = os.path.join(output_dir, "pipeline_output.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result_slim, f, indent=2, ensure_ascii=False)

    print(f"[PIPELINE] Saved → {out_path}")
    return out_path