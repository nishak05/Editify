import os
import sys
import torch
import numpy as np
from PIL import Image

from groundingdino.util.inference import load_model, load_image, predict

GROUNDING_CONFIG   = os.path.join(os.path.dirname(__file__), "models", "GroundingDINO_SwinT_OGC.py")
GROUNDING_WEIGHTS  = os.path.join(os.path.dirname(__file__), "models", "groundingdino_swint_ogc.pth")
DEVICE             = "cuda" if torch.cuda.is_available() else "cpu"

# detection thresholds
BOX_THRESHOLD  = 0.30   # confidence needed to keep a box
TEXT_THRESHOLD = 0.25   # confidence needed to keep a text label
MIN_BOX_SIZE = 10

print(f"[GDINO] Using device: {DEVICE}")


def load_grounding_model():
    model = load_model(GROUNDING_CONFIG, GROUNDING_WEIGHTS)
    model = model.to(DEVICE)
    print("[GDINO] Model loaded successfully")
    return model


def detect_objects(image_path: str, model, text_prompt: str = None) -> list:
    """
    Detect objects using GroundingDINO.
    Returns bounding boxes in image coordinates.
    """
    if text_prompt is None:
        # text_prompt = (
        #     "product . text . logo . background . "
        #     "image . graphic . illustration . icon . button"
        # )
        text_prompt = (
            "product . logo . person . icon . illustration . graphic . shape . cup"
        )

    image_pil, image_tensor = load_image(image_path)


    img_h, img_w = image_pil.shape[:2]

    with torch.no_grad():
        boxes, confidences, labels = predict(
            model       = model,
            image       = image_tensor,
            caption     = text_prompt,
            box_threshold  = BOX_THRESHOLD,
            text_threshold = TEXT_THRESHOLD,
        )

    print(f"[GDINO] Detected {len(boxes)} objects with prompt: '{text_prompt}'")

    # boxes come back as normalised (0-1) centre-format [cx, cy, w, h]
    # convert to absolute pixel corner-format [x1, y1, x2, y2]
    results = []
    for box, conf, label in zip(boxes, confidences, labels):
        cx, cy, w, h = box.tolist()

        # convert normalised → absolute pixels
        abs_cx = cx * img_w
        abs_cy = cy * img_h
        abs_w  = w  * img_w
        abs_h  = h  * img_h

        x1 = max(0, int(abs_cx - abs_w / 2))
        y1 = max(0, int(abs_cy - abs_h / 2))
        x2 = min(img_w, int(abs_cx + abs_w / 2))
        y2 = min(img_h, int(abs_cy + abs_h / 2))

        results.append({
            "label":      label,
            "confidence": round(float(conf), 3),
            "x1": x1, "y1": y1,
            "x2": x2, "y2": y2,
            "cx": int(abs_cx), "cy": int(abs_cy),
            "w":  x2 - x1,     "h":  y2 - y1,
        })

    # sort by confidence descending
    results.sort(key=lambda r: r["confidence"], reverse=True)
    
    results = [
        r for r in results
        if r["w"] >= MIN_BOX_SIZE and r["h"] >= MIN_BOX_SIZE
    ]
    return results


def boxes_to_sam_prompts(detections: list) -> tuple:
    """
    Convert detections into SAM2 point prompts.
    """
    if not detections:
        return None, None, []

    points = []
    labels = []

    for det in detections:
        points.append([det["cx"], det["cy"]])
        labels.append(det["label"])

    point_coords  = np.array(points, dtype=np.float32)
    point_labels  = np.ones(len(points), dtype=np.int32)  # 1 = foreground

    return point_coords, point_labels, labels


def save_detection_debug(image_path: str, detections: list, output_dir: str = None):
    """
    Save detection boxes for debugging.
    """
    import cv2

    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
    os.makedirs(output_dir, exist_ok=True)

    image = cv2.imread(image_path)
    colours = [
        (255, 80,  80),  (80, 255,  80),  (80,  80, 255),
        (255, 255, 80),  (255, 80, 255),  (80, 255, 255),
    ]

    for idx, det in enumerate(detections):
        colour = colours[idx % len(colours)]
        cv2.rectangle(image, (det["x1"], det["y1"]), (det["x2"], det["y2"]), colour, 2)
        cv2.putText(
            image,
            f"{det['label']} {det['confidence']}",
            (det["x1"] + 4, det["y1"] + 18),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, colour, 1
        )

    out_path = os.path.join(output_dir, "grounding_debug.jpg")
    cv2.imwrite(out_path, image)
    print(f"[GDINO] Saved detection debug → {out_path}")
    return out_path


if __name__ == "__main__":
    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    TEST_IMAGE  = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print(f"ERROR: No image at {TEST_IMAGE}")
        exit(1)

    print("=" * 50)
    print("Testing GroundingDINO detection")
    print("=" * 50)

    model      = load_grounding_model()
    detections = detect_objects(TEST_IMAGE, model)

    point_coords, point_labels, sam_labels = boxes_to_sam_prompts(detections)

    print(f"\nDetected {len(detections)} objects:")
    for d in detections:
        print(f"  {d['label']:20s} conf={d['confidence']}  box=({d['x1']},{d['y1']}) → ({d['x2']},{d['y2']})")

    save_detection_debug(TEST_IMAGE, detections)

    print("=" * 50)
    print("Open outputs/grounding_debug.jpg to see boxes.")
    print("=" * 50)