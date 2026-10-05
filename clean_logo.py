import sys
from PIL import Image, ImageFilter
from collections import deque

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    # We will do a BFS flood-fill from all 4 boundaries for near-white pixels
    visited = set()
    queue = deque()
    
    # Add all border pixels that are near white
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, a = pixels[x, y]
            if r > 220 and g > 220 and b > 220:
                queue.append((x, y))
                visited.add((x, y))
                
    for y in range(h):
        for x in [0, w - 1]:
            if (x, y) not in visited:
                r, g, b, a = pixels[x, y]
                if r > 220 and g > 220 and b > 220:
                    queue.append((x, y))
                    visited.add((x, y))
                    
    # BFS
    directions = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
    while queue:
        cx, cy = queue.popleft()
        pixels[cx, cy] = (255, 255, 255, 0) # completely transparent
        
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny]
                # If near white, continue flood fill
                if r > 225 and g > 225 and b > 225:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                elif r > 200 and g > 200 and b > 200:
                    # Antialiasing edge: feather alpha
                    visited.add((nx, ny))
                    avg = (r + g + b) / 3.0
                    alpha = int(max(0, min(255, (255 - avg) * 3)))
                    pixels[nx, ny] = (r, g, b, alpha)
                    
    # Crop to non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        # Add 5px padding
        pad = 4
        crop_box = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        cropped = img.crop(crop_box)
    else:
        cropped = img
        
    cropped.save(output_path, "PNG")
    print(f"Saved transparent logo to {output_path} with size {cropped.size}")

if __name__ == "__main__":
    make_transparent("public/branding/kerala-superstore-round-logo.png", "public/branding/kerala-superstore-round-logo.png")
    # Also save to public/logo.png
    make_transparent("public/branding/kerala-superstore-round-logo.png", "public/logo.png")
