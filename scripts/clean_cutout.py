import os
from PIL import Image
from collections import deque

def remove_outer_white_background(input_path, output_path, color_threshold=210):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Visited matrix
    visited = set()
    queue = deque()

    # Add all border pixels to queue if they are light background pixels
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    def is_bg(r, g, b):
        return r >= color_threshold and g >= color_threshold and b >= color_threshold

    # BFS Flood Fill from edges
    bg_mask = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]

        # If it's a light background pixel or already transparent
        if is_bg(r, g, b) or a == 0:
            bg_mask.add((x, y))
            # Check 4-neighbors
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    # Create new image with transparent background
    for x in range(width):
        for y in range(height):
            if (x, y) in bg_mask:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Keep original non-background pixel untouched
                pass

    img.save(output_path, "PNG")
    print(f"Cleaned background saved to {output_path}")

brain_dir = r"C:\Users\Super Brand Aneel\.gemini\antigravity-ide\brain\6285ee33-8d36-434f-a76e-ca296de9f9fc\.user_uploaded"
public_dir = r"d:\Ahmad Updated Portfolio\Ahmad_Portfolio\public"

remove_outer_white_background(
    os.path.join(brain_dir, "media_1788760198276.png"),
    os.path.join(public_dir, "transparent_samurai.png"),
    color_threshold=210
)

remove_outer_white_background(
    os.path.join(brain_dir, "media_1788760198259.png"),
    os.path.join(public_dir, "transparent_suit.png"),
    color_threshold=210
)
