import os
from PIL import Image
from collections import deque

def process_and_align_hd_cutouts():
    brain_dir = r"C:\Users\Super Brand Aneel\.gemini\antigravity-ide\brain\6285ee33-8d36-434f-a76e-ca296de9f9fc\.user_uploaded"
    public_dir = r"d:\Ahmad Updated Portfolio\Ahmad_Portfolio\public"

    samurai_path = os.path.join(brain_dir, "media_1788760198276.png")
    suit_path = os.path.join(brain_dir, "media_1788760198259.png")

    img_samurai = Image.open(samurai_path).convert("RGBA")
    img_suit = Image.open(suit_path).convert("RGBA")

    width, height = img_samurai.size

    def clean_background(img):
        w, h = img.size
        pixels = img.load()
        visited = set()
        queue = deque()

        for x in range(w):
            queue.append((x, 0))
            queue.append((x, h - 1))
        for y in range(h):
            queue.append((0, y))
            queue.append((w - 1, y))

        bg_mask = set()
        while queue:
            x, y = queue.popleft()
            if (x, y) in visited:
                continue
            visited.add((x, y))

            r, g, b, a = pixels[x, y]
            # Treat white/light pixels or low alpha pixels near edges as transparent background
            if (r >= 195 and g >= 195 and b >= 195) or a <= 15:
                bg_mask.add((x, y))
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                        queue.append((nx, ny))

        out_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        out_pixels = out_img.load()
        for x in range(w):
            for y in range(h):
                if (x, y) not in bg_mask:
                    out_pixels[x, y] = pixels[x, y]
        return out_img

    print("Cleaning Samurai image...")
    clean_samurai = clean_background(img_samurai)

    print("Cleaning Suit image...")
    clean_suit = clean_background(img_suit)

    # Calculate unified bounding box across BOTH images to ensure 100% IDENTICAL aspect ratio & pixel alignment
    box_samurai = clean_samurai.getbbox()
    box_suit = clean_suit.getbbox()

    print("Samurai BBox:", box_samurai)
    print("Suit BBox:", box_suit)

    # Use unified cropping box
    min_x = min(box_samurai[0], box_suit[0]) - 5
    min_y = min(box_samurai[1], box_suit[1]) - 5
    max_x = max(box_samurai[2], box_suit[2]) + 5
    max_y = max(box_samurai[3], box_suit[3])

    # Clamp coordinates
    min_x = max(0, min_x)
    min_y = max(0, min_y)
    max_x = min(width, max_x)
    max_y = min(height, max_y)

    crop_box = (min_x, min_y, max_x, max_y)
    print("Unified Crop Box (1:1 Alignment Guaranteed):", crop_box)

    cropped_samurai = clean_samurai.crop(crop_box)
    cropped_suit = clean_suit.crop(crop_box)

    # HD Ultra High-Resolution Upscaling (Lanczos filter) for crisp razor-sharp quality
    hd_target_width = 1200
    aspect_ratio = cropped_samurai.height / cropped_samurai.width
    hd_target_height = int(hd_target_width * aspect_ratio)

    hd_samurai = cropped_samurai.resize((hd_target_width, hd_target_height), Image.Resampling.LANCZOS)
    hd_suit = cropped_suit.resize((hd_target_width, hd_target_height), Image.Resampling.LANCZOS)

    out_samurai_path = os.path.join(public_dir, "transparent_samurai.png")
    out_suit_path = os.path.join(public_dir, "transparent_suit.png")

    hd_samurai.save(out_samurai_path, "PNG")
    hd_suit.save(out_suit_path, "PNG")

    print(f"Saved HD Ultra Samurai Cutout to {out_samurai_path} ({hd_target_width}x{hd_target_height})")
    print(f"Saved HD Ultra Suit Cutout to {out_suit_path} ({hd_target_width}x{hd_target_height})")

if __name__ == "__main__":
    process_and_align_hd_cutouts()
