import os
import time
import base64
import json
from PIL import Image

from layer_extractor import build_layers, save_layers

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def image_to_base64(image_path: str) -> str:
    """Read image file and return base64 string for sending to frontend."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def crop_layer_image(image_path: str, x: int, y: int, w: int, h: int) -> str:
    """
    Crop a region from the original image and return as base64.
    This gives the frontend the actual pixel content of each layer
    so Fabric.js can render it on the canvas.
    """
    img    = Image.open(image_path).convert("RGB")
    region = img.crop((x, y, x + w, y + h))

    # save cropped region to temp file then encode
    temp_path = os.path.join(BACKEND_DIR, "outputs", f"crop_temp.jpg")
    region.save(temp_path, quality=95)

    return image_to_base64(temp_path)


def run_pipeline(image_path: str) -> dict:
    """
    Full pipeline: image → layer JSON ready for Fabric.js canvas.

    Steps:
    1. GroundingDINO detects named objects
    2. PaddleOCR reads all text
    3. Each layer gets its cropped image as base64
    4. Returns complete response the frontend expects

    Returns:
        {
            image_w, image_h,
            image_base64,        ← full poster for canvas background
            layers: [
                {id, type, label/text, x, y, w, h, confidence, base64}
            ]
        }
    """
    start = time.time()
    print(f"\n[PIPELINE] Starting pipeline for: {os.path.basename(image_path)}")

    # get image dimensions
    img    = Image.open(image_path)
    img_w, img_h = img.size
    print(f"[PIPELINE] Image size: {img_w}x{img_h}")

    # run detection + OCR
    layers = build_layers(image_path)

    # attach cropped base64 image to each layer
    # frontend needs this to render each element on canvas
    print("[PIPELINE] Cropping layer images...")
    for layer in layers:
        try:
            layer["base64"] = crop_layer_image(
                image_path,
                layer["x"], layer["y"],
                layer["w"], layer["h"]
            )
        except Exception as e:
            print(f"[PIPELINE] Crop failed for layer {layer['id']}: {e}")
            layer["base64"] = ""

    elapsed = round(time.time() - start, 2)
    print(f"[PIPELINE] Done in {elapsed}s — {len(layers)} layers extracted")

    return {
        "image_w":      img_w,
        "image_h":      img_h,
        "image_base64": image_to_base64(image_path),
        "layers":       layers,
        "processing_time_s": elapsed,
    }


def save_pipeline_output(result: dict, output_dir: str = None) -> str:
    """Save pipeline result to JSON — useful for debugging and development."""
    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, "outputs")
    os.makedirs(output_dir, exist_ok=True)

    # save without base64 blobs — they're huge and unreadable in JSON viewer
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

    print(f"[PIPELINE] Saved slim output → {out_path}")
    return out_path


if __name__ == "__main__":
    TEST_IMAGE = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print("ERROR: Test image missing")
        exit(1)

    print("=" * 50)
    print("Running Full Editify Pipeline")
    print("=" * 50)

    result = run_pipeline(TEST_IMAGE)
    save_pipeline_output(result)

    print("=" * 50)
    print(f"Pipeline complete.")
    print(f"  Layers:          {len(result['layers'])}")
    print(f"  Image size:      {result['image_w']}x{result['image_h']}")
    print(f"  Processing time: {result['processing_time_s']}s")
    print(f"  Image base64:    {len(result['image_base64'])} chars")
    print("=" * 50)