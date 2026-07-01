import os
import math
import urllib.request
import torch
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH  = os.path.join(BACKEND_DIR, "models", "big-lama.pt")

PRIMARY_URL  = "https://github.com/enesmsahin/simple-lama-inpainting/releases/download/v0.1.0/big-lama.pt"
FALLBACK_URL = "https://huggingface.co/okaris/simple-lama/resolve/main/big-lama.pt"

_model = None


def _download_checkpoint():
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    for url in [PRIMARY_URL, FALLBACK_URL]:
        try:
            print(f"[LAMA] Downloading checkpoint from {url}")
            urllib.request.urlretrieve(url, MODEL_PATH)
            print(f"[LAMA] Checkpoint saved to {MODEL_PATH}")
            return
        except Exception as e:
            print(f"[LAMA] Download failed ({url}): {e}")
    raise RuntimeError("[LAMA] All download sources failed. Place big-lama.pt manually in backend/models/")


def _load_model():
    global _model
    if _model is not None:
        return _model

    if not os.path.exists(MODEL_PATH):
        _download_checkpoint()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[LAMA] Loading checkpoint on {device}...")
    _model = torch.jit.load(MODEL_PATH, map_location=device)
    _model.eval()
    print("[LAMA] Model ready")
    return _model


def _ceil_mod(x, mod):
    return x if x % mod == 0 else (x // mod + 1) * mod


def _pad_to_mod(arr, mod=8):
    # arr shape: (C, H, W)
    _, h, w = arr.shape
    ph = _ceil_mod(h, mod)
    pw = _ceil_mod(w, mod)
    return np.pad(arr, ((0, 0), (0, ph - h), (0, pw - w)), mode="symmetric")


def _norm(np_img):
    if np_img.ndim == 2:
        np_img = np_img[:, :, np.newaxis]
    return np.transpose(np_img, (2, 0, 1)).astype("float32") / 255.0


def lama_reconstruct_background(image_bgr: np.ndarray, combined_mask: np.ndarray) -> np.ndarray:
    
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    h, w   = image_bgr.shape[:2]

    # convert to RGB for the model
    image_rgb = image_bgr[:, :, ::-1].copy()

    img_t  = _pad_to_mod(_norm(image_rgb))
    mask_t = _pad_to_mod(_norm(combined_mask))
    mask_t = (mask_t > 0).astype("float32")

    img_tensor  = torch.from_numpy(img_t).unsqueeze(0).to(device)
    mask_tensor = torch.from_numpy(mask_t).unsqueeze(0).to(device)

    model = _load_model()

    with torch.no_grad():
        result = model(img_tensor, mask_tensor)

    # back to (H, W, C) uint8, crop padding, convert to BGR
    result_np = result[0].permute(1, 2, 0).cpu().numpy()
    result_np = np.clip(result_np * 255, 0, 255).astype(np.uint8)
    result_np = result_np[:h, :w]
    return result_np[:, :, ::-1].copy()