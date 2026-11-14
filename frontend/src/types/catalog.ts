export interface NutritionPer100g {
  energy_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  total_sugars_g: number;
  added_sugars_g: number;
  total_fat_g: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  dietary_fiber_g: number;
  sodium_mg: number;
}

export interface NutritionInfo {
  serving_size: string;
  nutri_score: string;
  nova_group: number;
  ingredients_text: string;
  allergens: string[];
  per_100g: NutritionPer100g;
  data_source: 'openfoodfacts' | 'gemini_fssai_estimated' | string;
}

export interface ProductImages {
  front_hd: string;
  front_thumb: string;
  image_source: 'openfoodfacts' | 'serper' | 'ddg' | 'placeholder' | string;
}

export interface Product {
  product_id: string;
  category_id: number;
  category_name: string;
  brand: string;
  product_name: string;
  packaging_size: string;
  query_term: string;
  dietary_type: 'VEG' | 'NON_VEG' | string;
  images: ProductImages;
  nutrition_info: NutritionInfo;
  price: number;
  mrp: number;
  discount_percent: number;
  delivery_time_mins: number;
  rating: number;
  review_count: number;
  in_stock: boolean;
}

export interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
  category_thumbnail: string;
  product_count: number;
  products: Product[];
}

export interface CatalogMetadata {
  total_categories: number;
  total_products: number;
  generated_at: string;
}

export interface CatalogData {
  metadata: CatalogMetadata;
  categories: Category[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
