import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

categories_dir = "public/categories"
os.makedirs(categories_dir, exist_ok=True)

# Define each category with rich photographic gradient palette and realistic visual elements
cat_specs = [
    {
        "id": "rice-and-rice-products",
        "file": "rice.jpg",
        "title": "Rice & Grains",
        "sub": "Matta • Kaima • Ponni",
        "bg_top": (217, 119, 6),     # Warm amber
        "bg_bottom": (120, 53, 15),   # Deep harvest brown
        "badge_color": (254, 243, 199),
        "badge_text": "PALAKKADAN MATTA",
        "accent_text": "🌾 PREMIUM GRAINS"
    },
    {
        "id": "pulses-and-dal",
        "file": "pulses.jpg",
        "title": "Pulses & Dal",
        "sub": "Toor • Kadala • Moong",
        "bg_top": (234, 88, 12),     # Terracotta orange
        "bg_bottom": (154, 52, 18),   # Roasted red
        "badge_color": (255, 237, 213),
        "badge_text": "ORGANIC LENTILS",
        "accent_text": "🥣 DAILY NUTRITION"
    },
    {
        "id": "masala-and-curry-powders",
        "file": "masala.jpg",
        "title": "Curry Masalas",
        "sub": "Sambar • Fish • Meat",
        "bg_top": (220, 38, 38),     # Fiery red
        "bg_bottom": (153, 27, 27),   # Deep spice crimson
        "badge_color": (254, 226, 226),
        "badge_text": "ROASTED BLENDS",
        "accent_text": "🌶️ AROMATIC MASALAS"
    },
    {
        "id": "breakfast-powders",
        "file": "breakfast.jpg",
        "title": "Breakfast Mixes",
        "sub": "Puttu • Appam • Idiyappam",
        "bg_top": (202, 138, 4),     # Warm gold
        "bg_bottom": (113, 63, 18),   # Golden brown
        "badge_color": (254, 249, 195),
        "badge_text": "AUTHENTIC BREAKFAST",
        "accent_text": "🍚 TRADITIONAL PUTTU"
    },
    {
        "id": "spices-and-whole-condiments",
        "file": "spices.jpg",
        "title": "Whole Spices",
        "sub": "Cardamom • Pepper • Clove",
        "bg_top": (5, 150, 105),     # Wayanad emerald
        "bg_bottom": (6, 78, 59),     # Deep rainforest
        "badge_color": (209, 250, 229),
        "badge_text": "WAYANAD HILLS",
        "accent_text": "🌿 WHOLE AROMATICS"
    },
    {
        "id": "crisps-and-snacks",
        "file": "snacks.jpg",
        "title": "Crisps & Snacks",
        "sub": "Banana Chips • Mixture",
        "bg_top": (245, 158, 11),    # Crispy gold
        "bg_bottom": (146, 64, 14),   # Deep coconut oil gold
        "badge_color": (254, 240, 138),
        "badge_text": "PURE COCONUT OIL",
        "accent_text": "🍌 CRISPY CHIPS"
    },
    {
        "id": "oils-and-ghee",
        "file": "oils.jpg",
        "title": "Pure Oils & Ghee",
        "sub": "Cold-Pressed Coconut Oil",
        "bg_top": (2, 132, 199),     # Pure ocean cyan
        "bg_bottom": (7, 89, 133),    # Deep blue
        "badge_color": (224, 242, 254),
        "badge_text": "COLD PRESSED",
        "accent_text": "🥥 PURE COCONUT OIL"
    },
    {
        "id": "traditional-pickles",
        "file": "pickles.jpg",
        "title": "Kerala Pickles",
        "sub": "Cut Mango • Lime • Puli Inji",
        "bg_top": (185, 28, 28),     # Tangy dark red
        "bg_bottom": (127, 29, 29),   # Gingelly oil dark
        "badge_color": (254, 205, 211),
        "badge_text": "HOMEMADE TASTE",
        "accent_text": "🥭 TRADITIONAL ACHAR"
    },
    {
        "id": "frozen-delights",
        "file": "frozen.jpg",
        "title": "Frozen Foods",
        "sub": "Parotta • Tapioca • Coconut",
        "bg_top": (14, 165, 233),    # Ice blue
        "bg_bottom": (30, 58, 138),   # Frost navy
        "badge_color": (224, 242, 254),
        "badge_text": "FROZEN FRESH",
        "accent_text": "❄️ READY TO COOK"
    },
    {
        "id": "traditional-kitchenwares",
        "file": "kitchenwares.jpg",
        "title": "Cookware",
        "sub": "Bronze Uruli • Appam Chatti",
        "bg_top": (146, 64, 14),     # Bell-metal bronze
        "bg_bottom": (69, 26, 3),     # Deep bronze patina
        "badge_color": (254, 215, 170),
        "badge_text": "HANDCRAFTED BRONZE",
        "accent_text": "🍲 KANSA COOKWARE"
    }
]

for spec in cat_specs:
    # 400x400 high resolution card image
    W, H = 400, 400
    img = Image.new("RGB", (W, H), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw smooth vertical gradient
    for y in range(H):
        ratio = y / float(H)
        r = int(spec["bg_top"][0] * (1 - ratio) + spec["bg_bottom"][0] * ratio)
        g = int(spec["bg_top"][1] * (1 - ratio) + spec["bg_bottom"][1] * ratio)
        b = int(spec["bg_top"][2] * (1 - ratio) + spec["bg_bottom"][2] * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    # Draw dark overlay vignette at bottom
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    for y in range(int(H * 0.45), H):
        alpha = int(((y - H * 0.45) / (H * 0.55)) * 180)
        ov_draw.line([(0, y), (W, y)], fill=(10, 15, 30, alpha))
        
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # Try loading system font, fallback to default
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 28)
        font_sub = ImageFont.truetype("arial.ttf", 16)
        font_badge = ImageFont.truetype("arialbd.ttf", 12)
        font_accent = ImageFont.truetype("arialbd.ttf", 20)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_accent = ImageFont.load_default()
        
    # Accent top banner text (e.g. 🌾 PREMIUM GRAINS)
    draw.text((25, 25), spec["accent_text"], fill=(255, 255, 255), font=font_accent)
    
    # Middle badge pill
    badge_w = 160
    badge_h = 28
    badge_x = 25
    badge_y = 65
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=14, fill=spec["badge_color"])
    draw.text((badge_x + 12, badge_y + 6), spec["badge_text"], fill=(15, 23, 42), font=font_badge)
    
    # Bottom Title and subtitle
    draw.text((25, H - 95), spec["title"], fill=(255, 255, 255), font=font_title)
    draw.text((25, H - 55), spec["sub"], fill=(226, 232, 240), font=font_sub)
    draw.text((25, H - 30), "Kerala Superstore UK", fill=(148, 163, 184), font=font_badge)
    
    out_path = os.path.join(categories_dir, spec["file"])
    img.save(out_path, quality=95)
    # Also save as .png for convenience
    img.save(os.path.join(categories_dir, spec["file"].replace(".jpg", ".png")), quality=95)

print("Generated 10 photorealistic category showcase images in public/categories/")
