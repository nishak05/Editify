import cv2
import torch
import numpy as np
from PIL import Image

_lama_instance = None


def get_lama_model():
    global _lama_instance
    if _lama_instance is None:
        from simple_lama_inpainting import SimpleLama
        _lama_instance = SimpleLama()
    return _lama_instance


def lama_reconstruct_background(image_bgr: np.ndarray, combined_mask: np.ndarray) -> np.ndarray:
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)
    pil_mask  = Image.fromarray(combined_mask)

    model  = get_lama_model()
    result = model(pil_image, pil_mask)

    result_rgb = np.array(result)
    return cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)