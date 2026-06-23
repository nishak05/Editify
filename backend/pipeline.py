import os
import time
import base64
import json
import io
import cv2
import numpy as np
from PIL import Image

from layer_extractor import build_layers

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def image_to_base64(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def reconstruct_background(image_path: str, layers: list) -> str:
    """
    Build ONE combined mask covering all detected layers.
    Run a single OpenCV TELEA inpaint to reconstruct the clean background.
    Returns base64 JPEG of the clean background.
    """
    image_bgr = cv2.imread(image_path)
    h, w      = image_bgr.shape[:2]

    # combined mask — white where any layer exists
    combined_mask = np.zeros((h, w), dtype=np.uint8)

    for layer in layers:
        x  = max(0, layer["x"])
        y  = max(0, layer["y"])
        x2 = min(w, layer["x"] + layer["w"])
        y2 = min(h, layer["y"] + layer["h"])
        combined_mask[y:y2, x:x2] = 255

    # single TELEA inpaint — fast, works for MVP, replaceable later
    clean_bg = cv2.inpaint(
        image_bgr,
        combined_mask,
        inpaintRadius=25,
        flags=cv2.INPAINT_TELEA
    )

    # encode to base64
    _, buffer = cv2.imencode('.jpg', clean_bg, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return base64.b64encode(buffer).decode("utf-8")


def run_pipeline(image_path: str) -> dict:
    """
    Full pipeline:
    1. Extract all layers as transparent PNGs
    2. Build combined mask of all layer regions
    3. Reconstruct clean background in ONE inpaint pass
    4. Return clean background + independent layers

    Editor renders: clean background + layer PNGs
    Every element exists exactly once — no duplicates possible.
    Editing is instant — no AI calls needed during editing.
    """
    start = time.time()
    print(f"\n[PIPELINE] Starting: {os.path.basename(image_path)}")

    img      = Image.open(image_path)
    img_w, img_h = img.size
    print(f"[PIPELINE] Image: {img_w}x{img_h}")

    # step 1 — extract all layers
    layers = build_layers(image_path)
    print(f"[PIPELINE] Extracted {len(layers)} layers")

    # step 2 — reconstruct background once using combined mask
    print("[PIPELINE] Reconstructing clean background...")
    bg_base64 = reconstruct_background(image_path, layers)
    print("[PIPELINE] Background reconstructed")

    elapsed = round(time.time() - start, 2)
    print(f"[PIPELINE] Done in {elapsed}s")

    return {
        "image_w":              img_w,
        "image_h":              img_h,
        "background_base64":    bg_base64,     # clean background, no elements
        "original_base64":      image_to_base64(image_path),  # for inpainting reference
        "layers":               layers,
        "processing_time_s":    elapsed,
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


if __name__ == "__main__":
    TEST_IMAGE = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print("ERROR: Test image missing")
        exit(1)

    print("=" * 50)
    print("Running Editify Pipeline")
    print("=" * 50)

    result = run_pipeline(TEST_IMAGE)
    save_pipeline_output(result)

    print("=" * 50)
    print(f"Layers:     {len(result['layers'])}")
    print(f"Image:      {result['image_w']}x{result['image_h']}")
    print(f"Time:       {result['processing_time_s']}s")
    print("=" * 50)