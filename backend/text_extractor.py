from ocr import extract_text


def extract_text_layers(image_path: str) -> list:
    """
    Single reusable text extraction module.
    Both layer_extractor.py and logo_decomposer.py call this.
    Returns only what OCR genuinely provides — no guessed metadata.
    """
    raw_blocks = extract_text(image_path)

    return [
        {
            "type":       "text",
            "text":       block["text"],
            "label":      block["text"],
            "x":          block["x"],
            "y":          block["y"],
            "w":          block["w"],
            "h":          block["h"],
            "confidence": block["confidence"],
        }
        for block in raw_blocks
    ]