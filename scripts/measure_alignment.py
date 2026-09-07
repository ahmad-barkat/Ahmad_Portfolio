import os
from PIL import Image
from collections import deque

def get_cleaned_image(input_path, color_threshold=200):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    visited = set()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    bg_mask = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        if (r >= color_threshold and g >= color_threshold and b >= color_threshold) or a == 0:
            bg_mask.add((x, y))
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    out_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    out_pixels = out_img.load()

    for x in range(width):
        for y in range(height):
            if (x, y) not in bg_mask:
                out_pixels[x, y] = pixels[x, y]

    return out_img

brain_dir = r"C:\Users\Super Brand Aneel\.gemini\antigravity-ide\brain\6285ee33-8d36-434f-a76e-ca296de9f9fc\.user_uploaded"

img_samurai = get_cleaned_image(os.path.join(brain_dir, "media_1788760198276.png"))
img_suit = get_cleaned_image(os.path.join(brain_dir, "media_1788760198259.png"))

bbox_samurai = img_samurai.getbbox()
bbox_suit = img_suit.getbbox()

print("Samurai Cleaned BBox:", bbox_samurai)
print("Suit Cleaned BBox:", bbox_suit)
