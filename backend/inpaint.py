import os
import torch
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_ID    = "stable-diffusion-v1-5/stable-diffusion-inpainting"
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

print(f"[INPAINT] Using device: {DEVICE}")

inpaint_pipeline = None


def load_inpaint_model():
    global inpaint_pipeline

    if inpaint_pipeline is not None:
        print("[INPAINT] Model already loaded")
        return inpaint_pipeline

    print("[INPAINT] Loading SD inpainting pipeline...")

    from diffusers import StableDiffusionInpaintPipeline

    inpaint_pipeline = StableDiffusionInpaintPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False,
    )

    inpaint_pipeline = inpaint_pipeline.to(DEVICE)
    inpaint_pipeline.enable_attention_slicing()

    print("[INPAINT] Model loaded successfully")
    return inpaint_pipeline


def unload_inpaint_model():
    global inpaint_pipeline

    if inpaint_pipeline is not None:
        del inpaint_pipeline
        inpaint_pipeline = None
        torch.cuda.empty_cache()
        print("[INPAINT] Model unloaded, VRAM freed")


def inpaint_region(
    original_image_path: str,
    mask: np.ndarray,
    prompt: str = "background, clean, seamless, no text, no objects",
    negative_prompt: str = "text, logo, object, watermark, distorted",
    num_steps: int = 20,
) -> Image.Image:
    """Fill masked region with AI-generated background. Mask: 255=fill, 0=keep."""

    pipeline = load_inpaint_model()

    original = Image.open(original_image_path).convert("RGB")
    orig_w, orig_h = original.size
    print(f"[INPAINT] Original size: {orig_w}x{orig_h}")

    # SD requires 512x512 — resize in, resize result back out
    sd_size      = (512, 512)
    img_resized  = original.resize(sd_size, Image.LANCZOS)
    mask_pil     = Image.fromarray(mask.astype(np.uint8))
    mask_resized = mask_pil.resize(sd_size, Image.NEAREST)

    print(f"[INPAINT] Running {num_steps} inference steps...")

    # run pipeline but get raw latents — bypasses the fp16 image processor bug on GTX 1650
    with torch.no_grad():
        output = pipeline(
            prompt              = prompt,
            negative_prompt     = negative_prompt,
            image               = img_resized,
            mask_image          = mask_resized,
            num_inference_steps = num_steps,
            guidance_scale      = 7.5,
            output_type         = "pil",
        )

    result = output.images[0]

    # check if result is black (NaN issue on GTX 1650) — if so, use original
    result_arr = np.array(result)
    if result_arr.mean() < 10:
        print("[INPAINT] WARNING: Black output detected, applying fallback...")
        # fallback: blur the boundary of original image to simulate inpainting
        import cv2
        orig_arr  = np.array(img_resized)
        mask_arr  = np.array(mask_resized)
        # use opencv inpainting as CPU fallback
        mask_cv   = (mask_arr > 127).astype(np.uint8) * 255
        result_arr = cv2.inpaint(orig_arr, mask_cv, inpaintRadius=15, flags=cv2.INPAINT_TELEA)
        result = Image.fromarray(result_arr)
        print("[INPAINT] Fallback inpainting applied")

    result_fullsize = result.resize((orig_w, orig_h), Image.LANCZOS)
    print("[INPAINT] Inpainting complete")
    return result_fullsize


def create_mask_from_bbox(image_path: str, x: int, y: int, w: int, h: int) -> np.ndarray:
    """Create binary mask from bounding box. Used when user deletes a layer."""
    original     = Image.open(image_path)
    img_w, img_h = original.size
    mask         = np.zeros((img_h, img_w), dtype=np.uint8)
    mask[y:y+h, x:x+w] = 255
    return mask


def save_inpaint_result(result_image: Image.Image, output_dir: str = None) -> str:
    if output_dir is None:
        output_dir = os.path.join(BACKEND_DIR, "outputs")
    os.makedirs(output_dir, exist_ok=True)

    out_path = os.path.join(output_dir, "inpaint_result.jpg")
    result_image.save(out_path, quality=95)
    print(f"[INPAINT] Saved → {out_path}")
    return out_path


if __name__ == "__main__":
    TEST_IMAGE = os.path.join(BACKEND_DIR, "test_images", "sale_img.jpg")

    if not os.path.exists(TEST_IMAGE):
        print(f"ERROR: No image at {TEST_IMAGE}")
        exit(1)

    print("=" * 50)
    print("Testing Stable Diffusion Inpainting")
    print("=" * 50)

    original     = Image.open(TEST_IMAGE)
    img_w, img_h = original.size

    # mask the right poster card — x=630, y=46, w=410, h=573 from grounding.py
    test_mask = create_mask_from_bbox(TEST_IMAGE, x=630, y=46, w=410, h=573)

    mask_path = os.path.join(BACKEND_DIR, "outputs", "test_mask.jpg")
    Image.fromarray(test_mask).save(mask_path)
    print(f"[INPAINT] Mask saved → {mask_path}")

    result = inpaint_region(TEST_IMAGE, test_mask)
    save_inpaint_result(result)
    unload_inpaint_model()

    print("=" * 50)
    print("DONE. Open outputs/inpaint_result.jpg")
    print("=" * 50)