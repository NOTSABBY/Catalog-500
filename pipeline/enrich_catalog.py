"""
Blinkit-Style Virtual Catalog Multi-Tier Data Enrichment Pipeline.
Transforms authentic_packaged_food_catalog_500.xlsx into high-fidelity,
FSSAI-aligned JSON artifacts with checkpointing, asynchronous batching,
and multi-tier fallbacks.
"""

import os
import sys
import json
import asyncio
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

import pandas as pd
import httpx
from dotenv import load_dotenv

from pipeline.image_generator import generate_packshot_svg, CATEGORY_THEMES
from pipeline.gemini_fallback import enrich_batch_with_gemini
from pipeline.fssai_knowledge_base import get_fssai_nutrition_for_product

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("EnrichmentPipeline")

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
EXCEL_PATH = BASE_DIR / "authentic_packaged_food_catalog_500.xlsx"
CHECKPOINT_PATH = Path(__file__).resolve().parent / "checkpoint_cache.json"
OUTPUT_DIR = BASE_DIR / "frontend" / "public" / "data"
CATEGORIES_DIR = OUTPUT_DIR / "categories"

OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl"
OFF_HEADERS = {
    "User-Agent": "BlinkitCatalogEnricher/1.0 (contact@catalogproject.org)",
    "Accept": "application/json"
}

SEMAPHORE_LIMIT = 5


def slugify(text: str) -> str:
    """Converts a title into a clean URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def load_checkpoint() -> Dict[str, Dict[str, Any]]:
    """Loads checkpoint cache if present."""
    if CHECKPOINT_PATH.exists():
        try:
            with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data)} cached products from {CHECKPOINT_PATH.name}")
                return data
        except Exception as e:
            logger.warning(f"Failed to read checkpoint cache: {e}. Starting fresh.")
    return {}


def save_checkpoint(cache: Dict[str, Dict[str, Any]]):
    """Saves checkpoint cache to disk."""
    try:
        with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to save checkpoint: {e}")


async def query_open_food_facts(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    query_term: str
) -> Optional[Dict[str, Any]]:
    """
    Tier 1: Queries Open Food Facts with concurrency limit and exponential backoff.
    """
    params = {
        "search_terms": query_term,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 3,
        "fields": "product_name,brands,image_front_url,image_front_small_url,nutriments,ingredients_text,serving_size,nutrition_grades,nova_group,allergens_tags"
    }
    
    backoff = 1.0
    for attempt in range(3):
        async with semaphore:
            try:
                response = await client.get(OFF_URL, params=params, headers=OFF_HEADERS, timeout=8.0)
                if response.status_code == 200:
                    try:
                        data = response.json()
                        products = data.get("products", [])
                        if products and len(products) > 0:
                            return products[0]
                    except json.JSONDecodeError:
                        pass
                elif response.status_code in (429, 503):
                    await asyncio.sleep(backoff)
                    backoff *= 2.0
                    continue
            except (httpx.TimeoutException, httpx.RequestError):
                await asyncio.sleep(backoff)
                backoff *= 1.5
    return None


def validate_off_hit(prod_data: Optional[Dict[str, Any]]) -> tuple[bool, bool, Dict[str, Any], Dict[str, Any]]:
    """
    Validates Open Food Facts hit against strict criteria:
    1. image_front_url is non-empty and valid
    2. nutriments contains numeric values > 0 for energy-kcal_100g AND >= 2 of (protein, carb, fat)
    Returns: (has_valid_image, has_valid_nutrition, extracted_image_data, extracted_nutrition_data)
    """
    if not prod_data:
        return False, False, {}, {}
        
    # 1. Image validation
    img_url = prod_data.get("image_front_url") or ""
    img_thumb = prod_data.get("image_front_small_url") or img_url
    has_valid_image = bool(img_url and img_url.startswith("http"))
    img_data = {
        "front_hd": img_url,
        "front_thumb": img_thumb,
        "image_source": "openfoodfacts"
    } if has_valid_image else {}
    
    # 2. Nutrition validation
    nutriments = prod_data.get("nutriments", {})
    energy_kcal = nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal") or 0.0
    try:
        energy_kcal = float(energy_kcal)
    except (ValueError, TypeError):
        energy_kcal = 0.0
        
    proteins = nutriments.get("proteins_100g") or nutriments.get("proteins") or 0.0
    carbs = nutriments.get("carbohydrates_100g") or nutriments.get("carbohydrates") or 0.0
    fat = nutriments.get("fat_100g") or nutriments.get("fat") or 0.0
    
    count_valid_macros = sum([
        float(proteins or 0) > 0,
        float(carbs or 0) > 0,
        float(fat or 0) > 0
    ])
    
    has_valid_nutrition = (energy_kcal > 0 and count_valid_macros >= 2)
    
    nutrition_data = {}
    if has_valid_nutrition:
        nutrition_data = {
            "serving_size": prod_data.get("serving_size") or "30 g",
            "nutri_score": (prod_data.get("nutrition_grades") or "C").upper()[:1],
            "nova_group": int(prod_data.get("nova_group") or 4),
            "ingredients_text": prod_data.get("ingredients_text") or "",
            "allergens": [tag.replace("en:", "").title() for tag in prod_data.get("allergens_tags", []) if tag],
            "per_100g": {
                "energy_kcal": round(float(energy_kcal), 1),
                "protein_g": round(float(proteins or 0), 1),
                "carbohydrates_g": round(float(carbs or 0), 1),
                "total_sugars_g": round(float(nutriments.get("sugars_100g") or 0), 1),
                "added_sugars_g": round(float(nutriments.get("added-sugars_100g") or 0), 1),
                "total_fat_g": round(float(fat or 0), 1),
                "saturated_fat_g": round(float(nutriments.get("saturated-fat_100g") or 0), 1),
                "trans_fat_g": round(float(nutriments.get("trans-fat_100g") or 0), 1),
                "dietary_fiber_g": round(float(nutriments.get("fiber_100g") or 0), 1),
                "sodium_mg": round(float(nutriments.get("sodium_100g") or 0) * 1000.0 if nutriments.get("sodium_100g") else 120.0, 1)
            },
            "data_source": "openfoodfacts"
        }
        
    return has_valid_image, has_valid_nutrition, img_data, nutrition_data


async def resolve_fallback_image(
    client: httpx.AsyncClient,
    brand: str,
    product_name: str,
    packaging_size: str,
    category_id: int,
    dietary_type: str
) -> Dict[str, str]:
    """
    Tier 2A: Resolves Front-of-Pack Studio Image Fallback.
    1. Serper.dev Google Images API (if SERPER_API_KEY is present)
    2. DuckDuckGo Image Search
    3. High-resolution Studio SVG Packshot Data-URI
    """
    serper_key = os.environ.get("SERPER_API_KEY")
    query_str = f"{brand} {product_name} front packshot white background blinkit OR bigbasket OR amazon"
    
    # 1. Serper.dev
    if serper_key:
        try:
            serper_resp = await client.post(
                "https://google.serper.dev/images",
                headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
                json={"q": query_str, "gl": "in", "num": 5},
                timeout=5.0
            )
            if serper_resp.status_code == 200:
                s_data = serper_resp.json()
                for img in s_data.get("images", []):
                    img_url = img.get("imageUrl")
                    if img_url and not any(ext in img_url.lower() for ext in [".svg", ".webp", ".gif"]):
                        return {
                            "front_hd": img_url,
                            "front_thumb": img.get("thumbnailUrl") or img_url,
                            "image_source": "serper"
                        }
        except Exception as e:
            logger.debug(f"Serper call failed: {e}")

    # 2. DuckDuckGo Search (zero-key fallback)
    try:
        from duckduckgo_search import DDGS
        # Run in thread executor to not block asyncio loop
        def search_ddg():
            with DDGS() as ddgs:
                results = list(ddgs.images(query_str, max_results=3))
                return results
                
        results = await asyncio.to_thread(search_ddg)
        if results and len(results) > 0:
            best_img = results[0].get("image")
            thumb_img = results[0].get("thumbnail") or best_img
            if best_img:
                return {
                    "front_hd": best_img,
                    "front_thumb": thumb_img,
                    "image_source": "ddg"
                }
    except Exception as e:
        logger.debug(f"DDG image search unavailable: {e}")

    # 3. Clean Studio Packshot SVG data-URI
    svg_uri = generate_packshot_svg(
        brand=brand,
        product_name=product_name,
        packaging_size=packaging_size,
        category_id=category_id,
        dietary_type=dietary_type
    )
    return {
        "front_hd": svg_uri,
        "front_thumb": svg_uri,
        "image_source": "placeholder"
    }


def estimate_pricing_and_delivery(category_id: int, product_name: str) -> Dict[str, Any]:
    """Generates realistic Indian e-commerce pricing, discount, and quick-delivery time."""
    # Deterministic price based on category and hash
    base_prices = {
        1: 40, 2: 180, 3: 50, 4: 95, 5: 60, 6: 110, 7: 160, 8: 30,
        9: 240, 10: 75, 11: 195, 12: 125, 13: 140, 14: 280, 15: 65,
        16: 95, 17: 260, 18: 399, 19: 135, 20: 85, 21: 120, 22: 150,
        23: 45, 24: 65, 25: 145
    }
    base = base_prices.get(category_id, 80)
    variation = (hash(product_name) % 40) - 15  # -15 to +25
    mrp = max(20, round((base + variation) / 5.0) * 5)
    discount_pct = 5 + (hash(product_name) % 20)  # 5% to 24% discount
    price = max(15, round(mrp * (100 - discount_pct) / 100.0))
    
    delivery_mins = 8 + (hash(product_name) % 5)  # 8 to 12 mins
    rating = round(4.1 + (hash(product_name) % 9) / 10.0, 1)  # 4.1 to 4.9
    reviews = 120 + (hash(product_name) % 2400)
    
    return {
        "mrp": mrp,
        "price": price,
        "discount_percent": discount_pct,
        "delivery_time_mins": delivery_mins,
        "rating": min(5.0, rating),
        "review_count": reviews,
        "in_stock": True
    }


async def main():
    logger.info("=" * 65)
    logger.info("Starting Multi-Tier Data Enrichment Pipeline for 500 Products")
    logger.info("=" * 65)

    if not EXCEL_PATH.exists():
        logger.error(f"Catalog file {EXCEL_PATH} not found!")
        sys.exit(1)

    # Read Excel catalog
    df = pd.read_excel(EXCEL_PATH, sheet_name="Products Catalog")
    logger.info(f"Loaded Excel dataset with {len(df)} rows and columns: {list(df.columns)}")

    # Load checkpoint cache
    cache = load_checkpoint()

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CATEGORIES_DIR.mkdir(parents=True, exist_ok=True)

    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)
    products_to_query: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        p_id = str(row["Product ID"])
        if p_id not in cache:
            products_to_query.append({
                "product_id": p_id,
                "category_id": int(row["Category ID"]),
                "category_name": str(row["Category Name"]),
                "brand": str(row["Brand"]),
                "product_name": str(row["Product Name"]),
                "packaging_size": str(row["Packaging Size"]),
                "query_term": str(row["Open Food Facts Query Term"]),
            })

    logger.info(f"Products already cached: {len(cache)} / {len(df)}. Remaining to process: {len(products_to_query)}")

    # Tier 1 Processing: Open Food Facts Lookups
    tier1_results: Dict[str, Any] = {}
    needs_image_fallback: List[Dict[str, Any]] = []
    needs_nutrition_fallback: List[Dict[str, Any]] = []

    if products_to_query:
        logger.info(f"Executing Tier 1 (Open Food Facts Async Lookup) for {len(products_to_query)} products...")
        async with httpx.AsyncClient() as client:
            tasks = [
                query_open_food_facts(client, semaphore, p["query_term"])
                for p in products_to_query
            ]
            raw_off_results = await asyncio.gather(*tasks)

        for p, raw_res in zip(products_to_query, raw_off_results):
            p_id = p["product_id"]
            has_img, has_nutri, img_data, nutri_data = validate_off_hit(raw_res)
            tier1_results[p_id] = {
                "has_img": has_img,
                "has_nutri": has_nutri,
                "img_data": img_data,
                "nutri_data": nutri_data
            }
            if not has_img:
                needs_image_fallback.append(p)
            if not has_nutri:
                needs_nutrition_fallback.append(p)

        logger.info(f"Tier 1 Results: Valid Images={len(products_to_query) - len(needs_image_fallback)}, "
                    f"Valid Nutrition={len(products_to_query) - len(needs_nutrition_fallback)}")

        # Tier 2A: Image Fallbacks
        logger.info(f"Executing Tier 2A (Image Fallbacks) for {len(needs_image_fallback)} items...")
        async with httpx.AsyncClient() as client:
            img_fallback_tasks = [
                resolve_fallback_image(
                    client,
                    p["brand"],
                    p["product_name"],
                    p["packaging_size"],
                    p["category_id"],
                    "VEG"  # default initial dietary classification
                )
                for p in needs_image_fallback
            ]
            resolved_images = await asyncio.gather(*img_fallback_tasks)

        for p, img_res in zip(needs_image_fallback, resolved_images):
            p_id = p["product_id"]
            tier1_results[p_id]["img_data"] = img_res

        # Tier 2B: Nutrition & Ingredients Fallbacks (Batched in groups of 20)
        logger.info(f"Executing Tier 2B (Nutrition Fallback) for {len(needs_nutrition_fallback)} items in batches of 20...")
        batch_size = 20
        for i in range(0, len(needs_nutrition_fallback), batch_size):
            batch = needs_nutrition_fallback[i:i + batch_size]
            logger.info(f"Processing Nutrition Fallback batch {i // batch_size + 1} / {(len(needs_nutrition_fallback) + batch_size - 1) // batch_size} ({len(batch)} items)...")
            batch_nutri = enrich_batch_with_gemini(batch)
            for p_id, n_data in batch_nutri.items():
                tier1_results[p_id]["nutri_data"] = n_data

        # Assemble and Cache items
        for p in products_to_query:
            p_id = p["product_id"]
            t1 = tier1_results[p_id]
            nutri_info = t1["nutri_data"]
            dietary_type = nutri_info.get("dietary_type", "VEG")
            
            # Re-generate image if placeholder to include exact dietary veg/non-veg status
            images = t1["img_data"]
            if images.get("image_source") == "placeholder":
                svg_uri = generate_packshot_svg(
                    brand=p["brand"],
                    product_name=p["product_name"],
                    packaging_size=p["packaging_size"],
                    category_id=p["category_id"],
                    dietary_type=dietary_type
                )
                images["front_hd"] = svg_uri
                images["front_thumb"] = svg_uri

            pricing = estimate_pricing_and_delivery(p["category_id"], p["product_name"])

            final_product = {
                "product_id": p_id,
                "category_id": p["category_id"],
                "category_name": p["category_name"],
                "brand": p["brand"],
                "product_name": p["product_name"],
                "packaging_size": p["packaging_size"],
                "query_term": p["query_term"],
                "dietary_type": dietary_type,
                "images": images,
                "nutrition_info": nutri_info,
                **pricing
            }
            cache[p_id] = final_product

        # Save checkpoint cache
        save_checkpoint(cache)
        logger.info(f"Checkpoint successfully saved with {len(cache)} total items.")

    # Structure into target JSON format
    logger.info("Structuring master catalog and split category JSON files...")
    
    # Group products by category
    categories_dict: Dict[int, Dict[str, Any]] = {}
    
    for _, row in df.iterrows():
        p_id = str(row["Product ID"])
        cat_id = int(row["Category ID"])
        cat_name = str(row["Category Name"])
        
        if cat_id not in categories_dict:
            cat_slug = slugify(cat_name)
            theme = CATEGORY_THEMES.get(cat_id, {})
            categories_dict[cat_id] = {
                "category_id": cat_id,
                "category_name": cat_name,
                "category_slug": cat_slug,
                "category_thumbnail": "",
                "product_count": 0,
                "products": []
            }
            
        prod = cache[p_id]
        categories_dict[cat_id]["products"].append(prod)

    # Set product_count and category_thumbnail
    sorted_categories = []
    for cat_id in sorted(categories_dict.keys()):
        cat_obj = categories_dict[cat_id]
        cat_obj["product_count"] = len(cat_obj["products"])
        # Set category thumbnail to the first product's front_hd
        if cat_obj["products"]:
            cat_obj["category_thumbnail"] = cat_obj["products"][0]["images"]["front_hd"]
        sorted_categories.append(cat_obj)

    # Master Catalog
    master_catalog = {
        "metadata": {
            "total_categories": len(sorted_categories),
            "total_products": sum(c["product_count"] for c in sorted_categories),
            "generated_at": datetime.now(timezone.utc).isoformat()
        },
        "categories": sorted_categories
    }

    # Write master JSON: /frontend/public/data/enriched_catalog_500.json
    master_json_path = OUTPUT_DIR / "enriched_catalog_500.json"
    with open(master_json_path, "w", encoding="utf-8") as f:
        json.dump(master_catalog, f, indent=2, ensure_ascii=False)
    logger.info(f"Successfully generated master catalog: {master_json_path} ({master_json_path.stat().st_size / 1024:.1f} KB)")

    # Write 25 split category files: /frontend/public/data/categories/cat_{id}.json
    for cat in sorted_categories:
        cat_id = cat["category_id"]
        cat_file = CATEGORIES_DIR / f"cat_{cat_id}.json"
        with open(cat_file, "w", encoding="utf-8") as f:
            json.dump(cat, f, indent=2, ensure_ascii=False)
    logger.info(f"Successfully generated 25 split category files in {CATEGORIES_DIR}")

    # Summary report
    img_sources: Dict[str, int] = {}
    nutri_sources: Dict[str, int] = {}
    for cat in sorted_categories:
        for p in cat["products"]:
            isrc = p["images"].get("image_source", "unknown")
            nsrc = p["nutrition_info"].get("data_source", "unknown")
            img_sources[isrc] = img_sources.get(isrc, 0) + 1
            nutri_sources[nsrc] = nutri_sources.get(nsrc, 0) + 1

    logger.info("=" * 65)
    logger.info("PIPELINE EXECUTION SUMMARY REPORT:")
    logger.info(f"Total categories: {len(sorted_categories)}")
    logger.info(f"Total products:   {sum(c['product_count'] for c in sorted_categories)}")
    logger.info(f"Image Sources:    {img_sources}")
    logger.info(f"Nutrition Sources:{nutri_sources}")
    logger.info("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
