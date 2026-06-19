import torch
import numpy as np
import cv2
import os
import json
import sys

# tell Python where SAM2 code lives
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sam2'))

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

# config
MODEL_CFG  = "configs/sam2.1/sam2.1_hiera_s.yaml"
CHECKPOINT = os.path.join(os.path.dirname(__file__), "models", "sam2.1_hiera_small.pt")
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"
SAM2_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sam2')

print(f"[SAM2] Using device: {DEVICE}")


def load_model():
    """Load SAM2 into GPU memory. Call once at server startup."""
    os.chdir(SAM2_DIR)
    model     = build_sam2(MODEL_CFG, CHECKPOINT, device=DEVICE)
    predictor = SAM2ImagePredictor(model)
    print("[SAM2] Model loaded successfully")
    return predictor


def generate_grid_points(image_h, image_w, rows=8, cols=8):
    """
    Create a grid of points spread across the image.
    SAM2 needs input points as prompts to know where to look.
    A 5x5 grid = 25 points covering the entire poster evenly.
    """
    points = []
    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            x = int(image_w * c / (cols + 1))
            y = int(image_h * r / (rows + 1))
            points.append([x, y])
    return np.array(points, dtype=np.float32)


def segment_image(image_path: str, predictor) -> dict:
    """
    Main segmentation function.
    Input : path to any poster image
    Output: dict with list of layers [{id, score, x, y, w, h, area, mask}]
    """
    # load image
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        raise ValueError(f"Could not read image at {image_path}")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    h, w      = image_rgb.shape[:2]
    print(f"[SAM2] Image loaded: {w}x{h}px")

    # encode image into SAM2 — this is the heavy step (~3-5 seconds)
    predictor.set_image(image_rgb)
    print("[SAM2] Image encoded, running segmentation...")

    # generate grid prompts
    grid_points = generate_grid_points(h, w, rows=5, cols=5)
    labels      = np.ones(len(grid_points), dtype=np.int32)

    # run SAM2
    with torch.inference_mode():
        with torch.autocast(device_type=DEVICE, dtype=torch.float16):
            masks, scores, _ = predictor.predict(
                point_coords=grid_points,
                point_labels=labels,
                multimask_output=True,
            )

    print(f"[SAM2] Generated {len(masks)} raw masks")

    # flatten masks and scores if shape is (N, H, W)
    if masks.ndim == 3:
        masks_list  = [masks[i] for i in range(masks.shape[0])]
        scores_list = [scores[i] for i in range(scores.shape[0])]
    else:
        masks_list  = list(masks)
        scores_list = list(scores)

    # filter and clean masks
    layers     = []
    seen_areas = set()

    for i, (mask, score) in enumerate(zip(masks_list, scores_list)):
        score = float(score)
        if score < 0.6:
            continue

        # get bounding box
        rows_idx = np.where(mask.any(axis=1))[0]
        cols_idx = np.where(mask.any(axis=0))[0]
        if len(rows_idx) == 0 or len(cols_idx) == 0:
            continue

        y1, y2 = int(rows_idx.min()), int(rows_idx.max())
        x1, x2 = int(cols_idx.min()), int(cols_idx.max())
        area    = int((x2 - x1) * (y2 - y1))

        # skip noise and full-image background
        min_area = int(w * h * 0.005)
        max_area = int(w * h * 0.95)
        if area < min_area or area > max_area:
            continue

        # deduplicate similar masks
        area_key = area // 1000
        if area_key in seen_areas:
            continue
        seen_areas.add(area_key)

        layers.append({
            "id":    i,
            "score": round(score, 3),
            "x":     x1,
            "y":     y1,
            "w":     x2 - x1,
            "h":     y2 - y1,
            "area":  area,
            "mask":  mask.astype(bool),
        })

    print(f"[SAM2] {len(layers)} clean layers after filtering")
    return {"layers": layers, "image_size": {"w": w, "h": h}}


def save_debug_output(image_path: str, result: dict, output_dir: str = None):
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
    """
    Save visual output so you can SEE what SAM2 detected.
    - masked_overlay.jpg : poster with coloured regions over each object
    - layers_data.json   : layer positions and scores
    """
    os.makedirs(output_dir, exist_ok=True)
    image_bgr = cv2.imread(image_path)
    overlay   = image_bgr.copy()

    colours = [
        (255, 80,  80),  (80,  255, 80),  (80,  80,  255),
        (255, 255, 80),  (255, 80,  255), (80,  255, 255),
        (200, 140, 80),  (140, 200, 80),  (80,  140, 200),
    ]

    json_layers = []

    for idx, layer in enumerate(result["layers"]):
        colour = colours[idx % len(colours)]
        mask   = layer["mask"]

        # semi-transparent fill
        overlay[mask] = (
            overlay[mask] * 0.45 + np.array(colour) * 0.55
        ).astype(np.uint8)

        # bounding box
        cv2.rectangle(
            overlay,
            (layer["x"], layer["y"]),
            (layer["x"] + layer["w"], layer["y"] + layer["h"]),
            colour, 2
        )

        # label
        cv2.putText(
            overlay,
            f"L{idx} {layer['score']}",
            (layer["x"] + 4, layer["y"] + 18),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, colour, 1
        )

        json_layers.append({
            "id":    layer["id"],
            "score": layer["score"],
            "x":     layer["x"],
            "y":     layer["y"],
            "w":     layer["w"],
            "h":     layer["h"],
            "area":  layer["area"],
        })

    out_img  = os.path.join(output_dir, "masked_overlay.jpg")
    out_json = os.path.join(output_dir, "layers_data.json")

    cv2.imwrite(out_img, overlay)
    with open(out_json, "w") as f:
        json.dump({
            "layers":     json_layers,
            "image_size": result["image_size"]
        }, f, indent=2)

    print(f"[SAM2] Saved overlay → {out_img}")
    print(f"[SAM2] Saved JSON   → {out_json}")
    return out_img, out_json


# run directly to test
if __name__ == "__main__":
    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    TEST_IMAGE  = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print(f"ERROR: No image at {TEST_IMAGE}")
        exit(1)

    print("=" * 50)
    print("Testing SAM2 segmentation")
    print("=" * 50)

    predictor = load_model()
    result    = segment_image(TEST_IMAGE, predictor)
    save_debug_output(TEST_IMAGE, result)

    print("=" * 50)
    print(f"DONE. Found {len(result['layers'])} layers.")
    print("Open outputs/masked_overlay.jpg to see results.")
    print("=" * 50)