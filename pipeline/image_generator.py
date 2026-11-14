"""
SVG Packshot Generator for Packaged Food Products.
Generates clean, high-resolution, branded Front-of-Pack Studio SVG packshots
with FSSAI Veg/Non-Veg emblem, vibrant category-themed gradients, and typography.
"""

import html
import urllib.parse

CATEGORY_THEMES = {
    1: {"bg": "#F59E0B", "accent": "#B45309", "light": "#FEF3C7", "icon": "🍪", "type": "Biscuits & Cookies"},
    2: {"bg": "#10B981", "accent": "#047857", "light": "#D1FAE5", "icon": "🥣", "type": "Breakfast Cereals"},
    3: {"bg": "#EF4444", "accent": "#B91C1C", "light": "#FEE2E2", "icon": "🍜", "type": "Instant Noodles"},
    4: {"bg": "#8B5CF6", "accent": "#6D28D9", "light": "#EDE9FE", "icon": "🍫", "type": "Chocolates"},
    5: {"bg": "#F97316", "accent": "#C2410C", "light": "#FFEDD5", "icon": "🧃", "type": "Juices & Drinks"},
    6: {"bg": "#E11D48", "accent": "#9F1239", "light": "#FFE4E6", "icon": "🥫", "type": "Sauces & Dips"},
    7: {"bg": "#EC4899", "accent": "#BE185D", "light": "#FCE7F3", "icon": "🍯", "type": "Jams & Honey"},
    8: {"bg": "#FBBF24", "accent": "#D97706", "light": "#FEF9C3", "icon": "🥔", "type": "Chips & Crisps"},
    9: {"bg": "#78350F", "accent": "#451A03", "light": "#F5EBE6", "icon": "☕", "type": "Tea & Coffee"},
    10: {"bg": "#DC2626", "accent": "#991B1B", "light": "#FEE2E2", "icon": "🌶️", "type": "Spices & Masalas"},
    11: {"bg": "#CA8A04", "accent": "#854D0E", "light": "#FEF08A", "icon": "🫒", "type": "Oils & Ghee"},
    12: {"bg": "#EA580C", "accent": "#9A3412", "light": "#FFEDD5", "icon": "🍛", "type": "Ready to Eat"},
    13: {"bg": "#3B82F6", "accent": "#1D4ED8", "light": "#DBEAFE", "icon": "🧀", "type": "Dairy & Cheese"},
    14: {"bg": "#06B6D4", "accent": "#0E7490", "light": "#CFFAFE", "icon": "⚡", "type": "Energy Drinks"},
    15: {"bg": "#D97706", "accent": "#92400E", "light": "#FEF3C7", "icon": "🥨", "type": "Namkeen & Snacks"},
    16: {"bg": "#65A30D", "accent": "#3F6212", "light": "#ECFCCB", "icon": "🫙", "type": "Pickles & Chutneys"},
    17: {"bg": "#A16207", "accent": "#713F12", "light": "#FEF3C7", "icon": "🌾", "type": "Atta & Dals"},
    18: {"bg": "#854D0E", "accent": "#581C87", "light": "#EDE9FE", "icon": "🥜", "type": "Dry Fruits & Nuts"},
    19: {"bg": "#4F46E5", "accent": "#3730A3", "light": "#E0E7FF", "icon": "🧁", "type": "Baking & Cocoa"},
    20: {"bg": "#0D9488", "accent": "#115E59", "light": "#CCFBF1", "icon": "🍲", "type": "Canned & Soups"},
    21: {"bg": "#059669", "accent": "#065F46", "light": "#D1FAE5", "icon": "💪", "type": "Protein Bars"},
    22: {"bg": "#D97706", "accent": "#B45309", "light": "#FEF3C7", "icon": "🌾", "type": "Granola Bars"},
    23: {"bg": "#2563EB", "accent": "#1E40AF", "light": "#DBEAFE", "icon": "🥤", "type": "Soda & Mixers"},
    24: {"bg": "#BE185D", "accent": "#831843", "light": "#FCE7F3", "icon": "🍮", "type": "Dessert Mixes"},
    25: {"bg": "#0284C7", "accent": "#0369A1", "light": "#E0F2FE", "icon": "🍦", "type": "Frozen Snacks"}
}


def generate_packshot_svg(brand: str, product_name: str, packaging_size: str, category_id: int = 1, dietary_type: str = "VEG") -> str:
    """Generates an inline SVG data URI representing a studio packshot."""
    theme = CATEGORY_THEMES.get(category_id, {
        "bg": "#3B82F6", "accent": "#1D4ED8", "light": "#EFF6FF", "icon": "📦", "type": "Packaged Food"
    })
    
    brand_esc = html.escape(brand.upper()[:24])
    prod_esc = html.escape(product_name[:36])
    pack_esc = html.escape(packaging_size[:20])
    
    # Veg or Non-Veg symbol
    is_veg = dietary_type.upper() == "VEG"
    dot_color = "#16A34A" if is_veg else "#DC2626"
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#EDF2F7"/>
    </linearGradient>
    <linearGradient id="packGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{theme['bg']}"/>
      <stop offset="100%" stop-color="{theme['accent']}"/>
    </linearGradient>
    <filter id="packShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#0F172A" flood-opacity="0.14"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Studio Background -->
  <rect width="400" height="400" fill="url(#bgGrad)"/>
  
  <!-- Subtle Studio Spotlight -->
  <radialGradient id="spotlight" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.2"/>
  </radialGradient>
  <circle cx="200" cy="180" r="160" fill="url(#spotlight)"/>
  
  <!-- Studio Shadow Oval on Counter -->
  <ellipse cx="200" cy="350" rx="110" ry="16" fill="#000000" fill-opacity="0.08"/>
  <ellipse cx="200" cy="350" rx="75" ry="9" fill="#000000" fill-opacity="0.12"/>

  <!-- Packshot Box -->
  <g filter="url(#packShadow)">
    <rect x="75" y="60" width="250" height="275" rx="20" fill="url(#packGrad)"/>
    
    <!-- Top Foil / Gloss Highlight -->
    <path d="M 85 75 Q 200 65 315 75" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="4" fill="none" stroke-linecap="round"/>
    
    <!-- Packaging Header Ribbon -->
    <rect x="75" y="60" width="250" height="42" rx="20" fill="#000000" fill-opacity="0.18"/>
    <rect x="75" y="82" width="250" height="20" fill="#000000" fill-opacity="0.18"/>
    
    <!-- FSSAI Veg / Non-Veg emblem -->
    <rect x="95" y="72" width="18" height="18" rx="3" fill="#FFFFFF" stroke="{dot_color}" stroke-width="1.8"/>
    <circle cx="104" cy="81" r="5" fill="{dot_color}"/>

    <!-- Category Icon / Tag -->
    <text x="295" y="86" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16">{theme['icon']}</text>

    <!-- Brand Name Banner -->
    <text x="200" y="132" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" letter-spacing="1.5">{brand_esc}</text>

    <!-- Center Product Visual Badge -->
    <rect x="100" y="152" width="200" height="100" rx="14" fill="#FFFFFF" fill-opacity="0.94"/>
    
    <!-- Product Name inside badge -->
    <text x="200" y="192" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" fill="#1E293B">
      {prod_esc[:22]}
    </text>
    {f'<text x="200" y="210" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif" font-weight="600" font-size="11" fill="#475569">{prod_esc[22:44]}</text>' if len(prod_esc) > 22 else ''}
    
    <!-- Packaging Size pill -->
    <rect x="135" y="224" width="130" height="20" rx="10" fill="{theme['light']}"/>
    <text x="200" y="238" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="10.5" fill="{theme['accent']}">NET: {pack_esc}</text>

    <!-- Bottom Authentic Seal -->
    <text x="200" y="295" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" fill-opacity="0.9" letter-spacing="0.8">★ 100% AUTHENTIC PACK ★</text>
    <text x="200" y="315" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="9.5" fill="#FFFFFF" fill-opacity="0.75">{theme['type']}</text>
  </g>
</svg>"""

    # Return as clean SVG Data URI
    encoded = urllib.parse.quote(svg)
    return f"data:image/svg+xml;utf8,{encoded}"
