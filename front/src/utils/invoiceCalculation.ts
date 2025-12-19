type ItemType = "header" | "product" | "material" | "labor" | "other";

type InvoiceItem = {
  item_type: ItemType;
  amount: number;
};

export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    if (item.item_type === "header") return sum;
    return sum + item.amount;
  }, 0);
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.floor(subtotal * taxRate);
}

export function calculateTotalAmount(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount;
}

export function calculateItemAmount(quantity: number | null, unitPrice: number | null): number {
  if (quantity === null || unitPrice === null) {
    return 0;
  }
  return quantity * unitPrice;
}

/**
 * フロントエンド用の税率（小数: 0.1）をAPI用の税率（%単位: 10）に変換
 */
export function taxRateToApi(taxRate: string): number {
  return parseFloat(taxRate) * 100;
}

/**
 * API用の税率（%単位: 10）をフロントエンド用の税率（小数: 0.1）に変換
 */
export function taxRateFromApi(taxRate: number | undefined | null): string {
  return String((taxRate ?? 10) / 100);
}
