"""
Gemini 2.5 Flash Structured Outputs for FSSAI Nutritional Table & Ingredients.
Uses google-genai SDK with Pydantic response_schema and batched execution (20 products per batch).
Falls back gracefully to the FSSAI Knowledge Base when GEMINI_API_KEY is not configured or network calls fail.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from pipeline.fssai_knowledge_base import get_fssai_nutrition_for_product

logger = logging.getLogger("EnrichmentPipeline.Gemini")

class NutritionPer100gModel(BaseModel):
    energy_kcal: float = Field(..., description="Energy in kcal per 100g")
    protein_g: float = Field(..., description="Protein in grams per 100g")
    carbohydrates_g: float = Field(..., description="Carbohydrates in grams per 100g")
    total_sugars_g: float = Field(..., description="Total sugars in grams per 100g")
    added_sugars_g: float = Field(..., description="Added sugars in grams per 100g")
    total_fat_g: float = Field(..., description="Total fat in grams per 100g")
    saturated_fat_g: float = Field(..., description="Saturated fat in grams per 100g")
    trans_fat_g: float = Field(0.0, description="Trans fat in grams per 100g (must be 0.0 per FSSAI regulations)")
    dietary_fiber_g: float = Field(..., description="Dietary fiber in grams per 100g")
    sodium_mg: float = Field(..., description="Sodium in milligrams per 100g")

class ProductEnrichmentItem(BaseModel):
    product_id: str = Field(..., description="Unique product ID, e.g. PKG_PRD_0001")
    dietary_type: str = Field("VEG", description="VEG or NON_VEG")
    serving_size: str = Field("30 g", description="Typical serving size, e.g. 30 g or 200 ml")
    nutri_score: str = Field("C", description="Nutri-Score grade: A, B, C, D, or E")
    nova_group: int = Field(4, description="NOVA processing group: 1, 2, 3, or 4")
    ingredients_text: str = Field(..., description="Realistic ingredients sorted by predominance in percentage")
    allergens: List[str] = Field(default_factory=list, description="Common allergens: Gluten, Milk, Soy, Tree Nuts, etc.")
    per_100g: NutritionPer100gModel

class BatchEnrichmentResponse(BaseModel):
    products: List[ProductEnrichmentItem]


def enrich_batch_with_gemini(batch_products: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Enriches a batch of up to 20 products using Gemini 2.5 Flash structured outputs.
    Returns mapping of product_id -> nutrition_info dict.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    enriched_results: Dict[str, Dict[str, Any]] = {}
    
    if not gemini_key:
        logger.info("GEMINI_API_KEY not found in environment. Using FSSAI Food Science Knowledge Engine.")
        for p in batch_products:
            p_id = p["product_id"]
            nutri = get_fssai_nutrition_for_product(
                category_id=p["category_id"],
                brand=p["brand"],
                product_name=p["product_name"],
                packaging_size=p["packaging_size"]
            )
            enriched_results[p_id] = nutri
        return enriched_results

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=gemini_key)
        
        products_prompt = json.dumps([
            {
                "product_id": p["product_id"],
                "category_name": p["category_name"],
                "brand": p["brand"],
                "product_name": p["product_name"],
                "packaging_size": p["packaging_size"]
            } for p in batch_products
        ], indent=2)
        
        system_instruction = (
            "You are an expert Indian Food Technologist and FSSAI (Food Safety and Standards Authority of India) "
            "Labelling Specialist. For each of the packaged food products listed, generate realistic, accurate nutritional "
            "facts per 100g, typical serving size, allergen warnings, veg/non-veg status (dietary_type), nutri-score, "
            "NOVA group, and a realistic ingredient list sorted by predominance for that exact Indian brand and SKU."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Enrich these Indian packaged food products according to FSSAI guidelines:\n\n{products_prompt}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=BatchEnrichmentResponse,
                temperature=0.2
            )
        )
        
        parsed = json.loads(response.text)
        for item in parsed.get("products", []):
            p_id = item["product_id"]
            enriched_results[p_id] = {
                "serving_size": item.get("serving_size", "30 g"),
                "nutri_score": item.get("nutri_score", "C"),
                "nova_group": item.get("nova_group", 4),
                "ingredients_text": item.get("ingredients_text", ""),
                "allergens": item.get("allergens", []),
                "per_100g": item.get("per_100g", {}),
                "dietary_type": item.get("dietary_type", "VEG"),
                "data_source": "gemini_fssai_estimated"
            }
            
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}. Falling back to FSSAI Knowledge Engine.")
        for p in batch_products:
            p_id = p["product_id"]
            if p_id not in enriched_results:
                nutri = get_fssai_nutrition_for_product(
                    category_id=p["category_id"],
                    brand=p["brand"],
                    product_name=p["product_name"],
                    packaging_size=p["packaging_size"]
                )
                enriched_results[p_id] = nutri

    return enriched_results
