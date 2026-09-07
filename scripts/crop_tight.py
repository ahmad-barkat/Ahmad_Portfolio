import os
from PIL import Image

def crop_to_content(file_path):
    img = Image.open(file_path).convert("RGBA")
    bbox = img.getbbox() # Tight bounding box of non-transparent pixels
    if bbox:
        cropped = img.crop(bbox)
        cropped.save(file_path, "PNG")
        print(f"Cropped {file_path} from {img.size} to tight bbox {cropped.size}")

public_dir = r"d:\Ahmad Updated Portfolio\Ahmad_Portfolio\public"
crop_to_content(os.path.join(public_dir, "transparent_samurai.png"))
crop_to_content(os.path.join(public_dir, "transparent_suit.png"))
