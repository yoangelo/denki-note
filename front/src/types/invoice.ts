import type { InvoiceCreateRequestInvoiceItemsItemItemType } from "../api/generated/timesheetAPI.schemas";

export type ItemType = InvoiceCreateRequestInvoiceItemsItemItemType;

export type InvoiceItem = {
  id: string;
  item_type: ItemType;
  name: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  amount: number;
  sort_order: number;
  source_product_id?: string;
  source_material_id?: string;
  isNew?: boolean;
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  header: "見出し",
  product: "製品",
  material: "資材",
  labor: "作業",
  other: "その他",
};
