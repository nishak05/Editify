import os
import sys
import torch
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sam2'))

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

MODEL_CFG  = "configs/sam2.1/sam2.1_hiera_s.yaml"
CHECKPOINT = os.path.join(os.path.dirname(__file__), "models", "sam2.1_hiera_small.pt")
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"
SAM2_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sam2')

print(f"[SAM2] Using device: {DEVICE}")


def load_sam2_model():
    os.chdir(SAM2_DIR)
    model     = build_sam2(MODEL_CFG, CHECKPOINT, device=DEVICE)
    predictor = SAM2ImagePredictor(model)
    print("[SAM2] Model loaded successfully")
    return predictor


def get_mask_for_box(predictor, image_rgb: np.ndarray, box: list) -> np.ndarray:
    """
    Get precise pixel mask for a single bounding box using SAM2.
    box = [x1, y1, x2, y2] in absolute pixels.
    Returns boolean mask same size as image.
    """
    predictor.set_image(image_rgb)

    box_array = np.array(box, dtype=np.float32)

    with torch.inference_mode():
        with torch.autocast(device_type=DEVICE, dtype=torch.float16):
            masks, scores, _ = predictor.predict(
                point_coords = None,
                point_labels = None,
                box          = box_array[None, :],  # SAM2 expects (1, 4)
                multimask_output = True,
            )

    # pick highest confidence mask
    best_idx  = scores.argmax()
    best_mask = masks[best_idx].astype(bool)
    return best_mask


def mask_to_transparent_png(image_rgb: np.ndarray, mask: np.ndarray) -> Image.Image:
    """
    Apply mask to image — keep masked pixels, make everything else transparent.
    Returns RGBA PIL image.
    """
    rgba        = np.zeros((*image_rgb.shape[:2], 4), dtype=np.uint8)
    rgba[..., :3] = image_rgb
    rgba[..., 3]  = (mask * 255).astype(np.uint8)  # alpha = 255 where object is

    # crop to bounding box of mask to minimise image size
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]

    if len(rows) == 0 or len(cols) == 0:
        return Image.fromarray(rgba, 'RGBA')

    y1, y2 = int(rows.min()), int(rows.max())
    x1, x2 = int(cols.min()), int(cols.max())

    cropped = rgba[y1:y2+1, x1:x2+1]
    return Image.fromarray(cropped, 'RGBA')

