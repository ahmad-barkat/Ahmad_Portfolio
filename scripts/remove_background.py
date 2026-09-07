import os
from PIL import Image

def convert_white_to_transparent(input_path, output_path, threshold=235):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        # If pixel is close to white background
        if r >= threshold and g >= threshold and b >= threshold:
            newData.append((255, 255, 255, 0))
        else:
            # Gentle edge feathering for smooth transition
            avg = (r + g + b) / 3
            if avg > 210:
                alpha = int(255 * (1.0 - (avg - 210) / (255 - 210)))
                newData.append((r, g, b, max(0, min(255, alpha))))
            else:
                newData.append((r, g, b, 255))

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent PNG to {output_path}")

public_dir = r"d:\Ahmad Updated Portfolio\Ahmad_Portfolio\public"
convert_white_to_transparent(os.path.join(public_dir, "cutout_samurai.png"), os.path.join(public_dir, "transparent_samurai.png"))
convert_white_to_transparent(os.path.join(public_dir, "cutout_suit.png"), os.path.join(public_dir, "transparent_suit.png"))
