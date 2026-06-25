import numpy as np
from PIL import Image
import io
import base64


def pil_to_base64(img: Image.Image, fmt: str = "PNG") -> str:
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def crop_text_layer(image_path, x, y, w, h):
    img  = Image.open(image_path).convert("RGBA")
    crop = img.crop((x, y, x + w, y + h))
    return pil_to_base64(crop, "PNG")


def get_text_inside_logo(text_blocks, logo_box, tolerance=10):
    lx2 = logo_box["x"] + logo_box["w"]
    ly2 = logo_box["y"] + logo_box["h"]
    return [
        b for b in text_blocks
        if (b["x"] >= logo_box["x"] - tolerance and
            b["y"] >= logo_box["y"] - tolerance and
            b["x"] + b["w"] <= lx2 + tolerance and
            b["y"] + b["h"] <= ly2 + tolerance)
    ]


def subtract_text_from_mask(mask, text_blocks, logo_box, tolerance=10):
    """
    Zeroes out OCR text regions from the SAM2 mask.
    What remains is the graphic-only pixels — no text baked in.
    Works on any image regardless of content.
    """
    result = mask.copy()
    lx1 = logo_box["x"] - tolerance
    ly1 = logo_box["y"] - tolerance
    lx2 = logo_box["x"] + logo_box["w"] + tolerance
    ly2 = logo_box["y"] + logo_box["h"] + tolerance

    for block in text_blocks:
        # only subtract text that sits inside the logo region
        bx1 = max(0, block["x"] - tolerance)
        by1 = max(0, block["y"] - tolerance)
        bx2 = block["x"] + block["w"] + tolerance
        by2 = block["y"] + block["h"] + tolerance

        if (block["x"] >= lx1 and block["y"] >= ly1 and
                block["x"] + block["w"] <= lx2 and
                block["y"] + block["h"] <= ly2):
            result[by1:by2, bx1:bx2] = False

    return result


def decompose_logo(image_path, image_rgb, logo_detection, text_blocks, predictor):
    """
    v1: logo graphic (SAM2 mask minus text regions) + individual text layers.
    v2 can add SAM2 auto-segmentation for internal shapes by extending only
    this function — nothing outside this file changes.
    """
    from segment import get_mask_for_box, mask_to_transparent_png

    layers   = []
    layer_id = 1

    logo_box_list = [
        logo_detection["x1"],
        logo_detection["y1"],
        logo_detection["x2"],
        logo_detection["y2"],
    ]

    logo_box_dict = {
        "x": logo_detection["x1"],
        "y": logo_detection["y1"],
        "w": logo_detection["x2"] - logo_detection["x1"],
        "h": logo_detection["y2"] - logo_detection["y1"],
    }

    text_inside = get_text_inside_logo(text_blocks, logo_box_dict)

    graphic_created = False
    try:
        mask = get_mask_for_box(predictor, image_rgb, logo_box_list)

        # remove text pixel regions from graphic mask
        if text_inside:
            mask = subtract_text_from_mask(mask, text_inside, logo_box_dict)

        rows = np.where(mask.any(axis=1))[0]
        cols = np.where(mask.any(axis=0))[0]

        if len(rows) > 0:
            y1, y2 = int(rows.min()), int(rows.max())
            x1, x2 = int(cols.min()), int(cols.max())
            png_img = mask_to_transparent_png(image_rgb, mask)
            b64     = pil_to_base64(png_img, "PNG")

            layers.append({
                "id":         layer_id,
                "type":       "object",
                "label":      "logo",
                "x":          x1,
                "y":          y1,
                "w":          x2 - x1,
                "h":          y2 - y1,
                "confidence": logo_detection["confidence"],
                "base64":     b64,
                "format":     "png",
                "group_id":   "group_0",
                "group_role": "root",
            })
            layer_id += 1
            graphic_created = True

    except Exception as e:
        print(f"[LOGO] SAM2 failed for logo graphic: {e}")

    for block in text_inside:
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
            "group_id":   "group_0" if graphic_created else None,
            "group_role": "child"   if graphic_created else None,
        })
        layer_id += 1

    groups = [{"id": "group_0", "label": "Logo", "type": "group"}] if graphic_created else []

    print(f"[LOGO] Decomposed: 1 graphic + {len(text_inside)} text = {len(layers)} layers")
    return layers, groups