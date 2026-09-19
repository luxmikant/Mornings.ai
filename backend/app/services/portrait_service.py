import asyncio
import io
from PIL import Image
import rembg
from app.services.storage_service import R2StorageService

def _center_crop_square(image: Image.Image) -> Image.Image:
    width, height = image.size
    new_size = min(width, height)
    left = (width - new_size) / 2
    top = (height - new_size) / 2
    right = (width + new_size) / 2
    bottom = (height + new_size) / 2
    return image.crop((left, top, right, bottom))

async def remove_background(input_image_bytes: bytes) -> bytes:
    def _remove():
        return rembg.remove(input_image_bytes)
    return await asyncio.to_thread(_remove)

async def process_portrait(input_image_bytes: bytes, user_id: str) -> str:
    # Remove background
    no_bg_bytes = await remove_background(input_image_bytes)
    
    # Process image
    image = Image.open(io.BytesIO(no_bg_bytes))
    image = _center_crop_square(image)
    image = image.resize((1024, 1024), Image.Resampling.LANCZOS)
    image = image.convert("RGBA")
    
    output_buffer = io.BytesIO()
    image.save(output_buffer, format="PNG")
    processed_bytes = output_buffer.getvalue()
    
    # Upload to R2
    storage_service = R2StorageService()
    key = f"user-portraits/{user_id}.png"
    public_url = await storage_service.upload_bytes(processed_bytes, key, content_type="image/png")
    
    return public_url
