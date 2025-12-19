import type { InvoiceCreateRequestInvoiceItemsItemItemType } from "../api/generated/timesheetAPI.schemas";

type ItemType = InvoiceCreateRequestInvoiceItemsItemItemType;

export type InvoiceItemValidationError = {
  itemId: string;
  field: "name" | "quantity" | "unit" | "unit_price" | "amount";
  message: string;
};

export type InvoiceItemForValidation = {
  id: string;
  item_type: ItemType;
  name: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  amount: number;
};

export function validateInvoiceItem(item: InvoiceItemForValidation): InvoiceItemValidationError[] {
  const errors: InvoiceItemValidationError[] = [];

  switch (item.item_type) {
    case "product":
    case "material":
      if (!item.name || item.name.trim() === "") {
        errors.push({ itemId: item.id, field: "name", message: "品名を入力してください" });
      }
      if (item.quantity === null || item.quantity === undefined) {
        errors.push({ itemId: item.id, field: "quantity", message: "数量を入力してください" });
      }
      if (!item.unit || item.unit.trim() === "") {
        errors.push({ itemId: item.id, field: "unit", message: "単位を入力してください" });
      }
      if (item.unit_price === null || item.unit_price === undefined) {
        errors.push({ itemId: item.id, field: "unit_price", message: "単価を入力してください" });
      } else if (item.unit_price === 0) {
        errors.push({
          itemId: item.id,
          field: "unit_price",
          message: "単価は0円より大きい値を入力してください",
        });
      }
      break;

    case "other":
      if (!item.name || item.name.trim() === "") {
        errors.push({ itemId: item.id, field: "name", message: "品名を入力してください" });
      }
      if (item.quantity === null || item.quantity === undefined) {
        errors.push({ itemId: item.id, field: "quantity", message: "数量を入力してください" });
      }
      if (!item.unit || item.unit.trim() === "") {
        errors.push({ itemId: item.id, field: "unit", message: "単位を入力してください" });
      }
      if (item.unit_price === null || item.unit_price === undefined) {
        errors.push({ itemId: item.id, field: "unit_price", message: "単価を入力してください" });
      }
      break;

    case "header":
      if (!item.name || item.name.trim() === "") {
        errors.push({ itemId: item.id, field: "name", message: "品名を入力してください" });
      }
      break;

    case "labor":
      if (!item.name || item.name.trim() === "") {
        errors.push({ itemId: item.id, field: "name", message: "品名を入力してください" });
      }
      if (item.amount === null || item.amount === undefined) {
        errors.push({ itemId: item.id, field: "amount", message: "金額を入力してください" });
      }
      break;
  }

  return errors;
}

export function validateInvoiceItems(
  items: InvoiceItemForValidation[]
): InvoiceItemValidationError[] {
  return items.flatMap((item) => validateInvoiceItem(item));
}

export function hasFieldError(
  errors: InvoiceItemValidationError[],
  itemId: string,
  field: InvoiceItemValidationError["field"]
): boolean {
  return errors.some((e) => e.itemId === itemId && e.field === field);
}

export function getFieldError(
  errors: InvoiceItemValidationError[],
  itemId: string,
  field: InvoiceItemValidationError["field"]
): string | undefined {
  return errors.find((e) => e.itemId === itemId && e.field === field)?.message;
}

export function clearItemErrors(
  errors: InvoiceItemValidationError[],
  itemId: string
): InvoiceItemValidationError[] {
  return errors.filter((e) => e.itemId !== itemId);
}

export function clearFieldError(
  errors: InvoiceItemValidationError[],
  itemId: string,
  field: InvoiceItemValidationError["field"]
): InvoiceItemValidationError[] {
  return errors.filter((e) => !(e.itemId === itemId && e.field === field));
}

export function isFieldValid(
  item: InvoiceItemForValidation,
  field: InvoiceItemValidationError["field"]
): boolean {
  switch (field) {
    case "name":
      return !!item.name && item.name.trim() !== "";
    case "quantity":
      if (item.item_type === "header" || item.item_type === "labor") return true;
      return item.quantity !== null && item.quantity !== undefined;
    case "unit":
      if (item.item_type === "header" || item.item_type === "labor") return true;
      return !!item.unit && item.unit.trim() !== "";
    case "unit_price":
      if (item.item_type === "header" || item.item_type === "labor") return true;
      if (item.unit_price === null || item.unit_price === undefined) return false;
      if ((item.item_type === "product" || item.item_type === "material") && item.unit_price === 0)
        return false;
      return true;
    case "amount":
      if (item.item_type !== "labor") return true;
      return item.amount !== null && item.amount !== undefined;
    default:
      return true;
  }
}
