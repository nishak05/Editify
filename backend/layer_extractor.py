import os
import json
import base64
import io
import cv2
import torch
import numpy as np
from PIL import Image

from grounding import load_grounding_model, detect_objects
from ocr import extract_text
from proposal_engine import run_proposal_engine, compute_groups, reject_text_inside_objects
from logo_decomposer import decompose_logo, get_text_inside_logo

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

LOGO_AREA_THRESHOLD = 0.20

def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def crop_text_layer(image_path, x, y, w, h):
    img  = Image.open(image_path).convert("RGBA")
    crop = img.crop((x, y, x + w, y + h))
    return pil_to_base64(crop, "PNG")


def classify_image_type(detections, img_w, img_h):
    image_area = img_w * img_h

    best_det      = None
    best_fraction = 0.0

    for d in detections:
        label    = d["label"].strip().lower()
        fraction = (d["x2"] - d["x1"]) * (d["y2"] - d["y1"]) / image_area
        if label in {"logo", "logo icon"} and fraction > LOGO_AREA_THRESHOLD and fraction > best_fraction:
            best_fraction = fraction
            best_det      = d

    if best_det:
        print(f"[LAYERS] Image classified as: logo (logo covers {best_fraction:.1%})")
        return "logo", best_det

    print("[LAYERS] Image classified as: not-logo")
    return "not-logo", None

def build_layers(image_path: str) -> tuple:
    image_bgr = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    img_h, img_w = image_rgb.shape[:2]

    # --- GroundingDINO ---
    print("[LAYERS] Running GroundingDINO...")
    gdino_model = load_grounding_model()
    detections  = detect_objects(image_path, gdino_model)

    object_proposals = [
        {
            "type":       "object",
            "label":      d["label"],
            "x":          d["x1"],
            "y":          d["y1"],
            "w":          d["x2"] - d["x1"],
            "h":          d["y2"] - d["y1"],
            "confidence": d["confidence"],
        }
        for d in detections
    ]

    # --- OCR ---
    print("[LAYERS] Running OCR...")
    text_blocks = extract_text(image_path)

    # --- classify and route ---
    image_type, logo_detection = classify_image_type(detections, img_w, img_h)

    if image_type == "logo":
        from segment import load_sam2_model
        predictor      = load_sam2_model()
        layers, groups = decompose_logo(
            image_path, image_rgb, logo_detection, text_blocks, predictor
        )
        del predictor
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("[LAYERS] SAM2 VRAM freed")

        logo_box_dict = {
            "x": logo_detection["x1"],
            "y": logo_detection["y1"],
            "w": logo_detection["x2"] - logo_detection["x1"],
            "h": logo_detection["y2"] - logo_detection["y1"],
        }
        text_inside_ids = {id(b) for b in get_text_inside_logo(text_blocks, logo_box_dict)}
        next_id = max((l["id"] for l in layers), default=0) + 1

        for block in text_blocks:
            if id(block) in text_inside_ids:
                continue
            b64 = crop_text_layer(image_path, block["x"], block["y"], block["w"], block["h"])
            layers.append({
                "id":         next_id,
                "type":       "text",
                "text":       block["text"],
                "label":      block["text"],
                "x":          block["x"],
                "y":          block["y"],
                "w":          block["w"],
                "h":          block["h"],
                "confidence": block["confidence"],
                "base64":     b64,
                "format":     "png",
                "group_id":   None,
                "group_role": None,
            })
            next_id += 1

        print(f"[LAYERS] Built {len(layers)} layers, {len(groups)} groups")
        return layers, groups

    # --- not-logo path ---
    clean_objects = run_proposal_engine(object_proposals, img_w, img_h)
    print(f"[LAYERS] {len(clean_objects)} objects passed proposal engine")

    layers   = []
    layer_id = 1

    if clean_objects:
        print(f"[LAYERS] Running SAM2 on {len(clean_objects)} objects...")
        from segment import load_sam2_model, get_mask_for_box, mask_to_transparent_png
        predictor = load_sam2_model()

        for proposal in clean_objects:
            box = [
                proposal["x"],
                proposal["y"],
                proposal["x"] + proposal["w"],
                proposal["y"] + proposal["h"],
            ]
            try:
                mask = get_mask_for_box(predictor, image_rgb, box)
                rows = np.where(mask.any(axis=1))[0]
                cols = np.where(mask.any(axis=0))[0]
                if len(rows) == 0:
                    continue

                y1, y2 = int(rows.min()), int(rows.max())
                x1, x2 = int(cols.min()), int(cols.max())
                png_img = mask_to_transparent_png(image_rgb, mask)
                b64     = pil_to_base64(png_img, "PNG")

                layers.append({
                    "id":         layer_id,
                    "type":       "object",
                    "label":      proposal["label"],
                    "x":          x1,
                    "y":          y1,
                    "w":          x2 - x1,
                    "h":          y2 - y1,
                    "confidence": proposal["confidence"],
                    "base64":     b64,
                    "format":     "png",
                })
                layer_id += 1

            except Exception as e:
                print(f"[LAYERS] SAM2 failed for '{proposal['label']}': {e}")
                continue

        del predictor
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("[LAYERS] SAM2 VRAM freed")

    # --- text layers: reject any that sit inside an accepted object box ---
    object_boxes = [
        {"x": l["x"], "y": l["y"], "w": l["w"], "h": l["h"]}
        for l in layers
    ]

    text_proposals = [
        {
            "type":       "text",
            "text":       b["text"],
            "label":      b["text"],
            "x":          b["x"],
            "y":          b["y"],
            "w":          b["w"],
            "h":          b["h"],
            "confidence": b["confidence"],
        }
        for b in text_blocks
    ]

    clean_text, rejected_text = reject_text_inside_objects(text_proposals, object_boxes)
    if rejected_text:
        print(f"[LAYERS] Rejected {len(rejected_text)} text blocks inside object layers")

    for block in clean_text:
        b64 = crop_text_layer(
            image_path,
            block["x"], block["y"],
            block["w"], block["h"]
        )
        layers.append({
            "id":         layer_id,
            "type":       "text",
            "text":       block["text"],
            "label":      block["text"],
            "x":          block["x"],
            "y":          block["y"],
            "w":          block["w"],
            "h":          block["h"],
            "confidence": block["confidence"],
            "base64":     b64,
            "format":     "png",
        })
        layer_id += 1

    annotated, groups = compute_groups(layers)

    print(f"[LAYERS] Built {len(annotated)} layers ({len(clean_objects)} objects + {len(clean_text)} text), {len(groups)} groups")
    return annotated, groups