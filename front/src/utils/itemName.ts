import type { Product, Material } from "../api/generated/timesheetAPI.schemas";

export function formatProductName(product: Product): string {
  return product.model_number ? `${product.name} (${product.model_number})` : product.name;
}

export function formatMaterialName(material: Material): string {
  return material.model_number ? `${material.name} (${material.model_number})` : material.name;
}
