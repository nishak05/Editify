import os
from paddleocr import PaddleOCR
import cv2

# OCR model instance
ocr_model = None


def load_ocr_model():
    """
    Load PaddleOCR once and reuse.
    Supports English + Hindi text detection.
    """
    global ocr_model

    if ocr_model is None:
        print("[OCR] Loading PaddleOCR...")
        ocr_model = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            use_gpu=False,     
            show_log=False      
        )
        print("[OCR] Model loaded successfully")

    return ocr_model


def extract_text(image_path: str):
    """
    Extract text blocks from image.

    Returns:
    [
        {
            text,
            confidence,
            x,
            y,
            w,
            h
        }
    ]
    """

    model = load_ocr_model()

    result = model.ocr(image_path)

    text_blocks = []

    if result is None:
        return text_blocks

    for line in result[0]:

        box = line[0]
        text = line[1][0]
        confidence = float(line[1][1])

        # Skip low confidence detections
        if confidence < 0.50:
            continue

        x_coords = [int(point[0]) for point in box]
        y_coords = [int(point[1]) for point in box]

        x = min(x_coords)
        y = min(y_coords)

        w = max(x_coords) - x
        h = max(y_coords) - y

        text_blocks.append(
            {
                "text": text,
                "confidence": round(confidence, 3),
                "x": x,
                "y": y,
                "w": w,
                "h": h,
            }
        )

    print(f"[OCR] Found {len(text_blocks)} text blocks")

    return text_blocks


def save_ocr_debug(image_path, text_blocks, output_dir=None):
    """
    Draw OCR boxes on image for verification.
    """

    if output_dir is None:
        output_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "outputs"
        )

    os.makedirs(output_dir, exist_ok=True)

    image = cv2.imread(image_path)

    for block in text_blocks:

        x = block["x"]
        y = block["y"]
        w = block["w"]
        h = block["h"]

        cv2.rectangle(
            image,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

        cv2.putText(
            image,
            block["text"],
            (x, y - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            1
        )

    output_path = os.path.join(
        output_dir,
        "ocr_debug.jpg"
    )

    cv2.imwrite(output_path, image)

    print(f"[OCR] Saved debug image -> {output_path}")

    return output_path


if __name__ == "__main__":

    BACKEND_DIR = os.path.dirname(
        os.path.abspath(__file__)
    )

    TEST_IMAGE = os.path.join(
        BACKEND_DIR,
        "test_images",
        "sale_img.jpg"
    )

    if not os.path.exists(TEST_IMAGE):
        print(f"ERROR: Missing image -> {TEST_IMAGE}")
        exit(1)

    print("=" * 50)
    print("Testing PaddleOCR")
    print("=" * 50)

    text_blocks = extract_text(TEST_IMAGE)

    print("\nDetected Text:")

    for block in text_blocks:
        print(
            f"{block['text']} | "
            f"conf={block['confidence']} | "
            f"({block['x']},{block['y']})"
        )

    save_ocr_debug(TEST_IMAGE, text_blocks)

    print("=" * 50)
    print("Open outputs/ocr_debug.jpg")
    print("=" * 50)