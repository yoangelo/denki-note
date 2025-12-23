import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableRow, TableCell } from "./ui";
import { formatCurrency, hasFieldError, type InvoiceItemValidationError } from "../utils";
import type { InvoiceItem, ItemType } from "../types/invoice";
import { ITEM_TYPE_LABELS } from "../types/invoice";

type InvoiceItemRowProps = {
  item: InvoiceItem;
  onUpdate: (id: string, updates: Partial<InvoiceItem>) => void;
  onDelete: (id: string) => void;
  onOpenProductSearch: (itemId: string) => void;
  onOpenMaterialSearch: (itemId: string) => void;
  onItemTypeChange: (itemId: string, newItemType: ItemType) => void;
  validationErrors: InvoiceItemValidationError[];
};

export function InvoiceItemRow({
  item,
  onUpdate,
  onDelete,
  onOpenProductSearch,
  onOpenMaterialSearch,
  onItemTypeChange,
  validationErrors,
}: InvoiceItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isHeader = item.item_type === "header";
  const isLabor = item.item_type === "labor";
  const isProduct = item.item_type === "product";
  const isMaterial = item.item_type === "material";

  const hasNameError = hasFieldError(validationErrors, item.id, "name");
  const hasQuantityError = hasFieldError(validationErrors, item.id, "quantity");
  const hasUnitError = hasFieldError(validationErrors, item.id, "unit");
  const hasUnitPriceError = hasFieldError(validationErrors, item.id, "unit_price");
  const hasAmountError = hasFieldError(validationErrors, item.id, "amount");

  const baseInputClass = "w-full px-2 py-1 border rounded text-sm";
  const normalBorder = "border-gray-300";
  const errorBorder = "border-red-500 bg-red-50";

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none"
          {...attributes}
          {...listeners}
        >
          <div className="i-heroicons-bars-3 w-4 h-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <select
            value={item.item_type}
            onChange={(e) => onItemTypeChange(item.id, e.target.value as ItemType)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
          >
            {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {isProduct && (
            <button
              type="button"
              onClick={() => onOpenProductSearch(item.id)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
            >
              検索
            </button>
          )}
          {isMaterial && (
            <button
              type="button"
              onClick={() => onOpenMaterialSearch(item.id)}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
            >
              検索
            </button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          className={`${baseInputClass} ${hasNameError ? errorBorder : normalBorder}`}
          placeholder="品名"
        />
      </TableCell>
      <TableCell align="right">
        {isHeader ? (
          "-"
        ) : isLabor ? (
          "1"
        ) : (
          <input
            type="number"
            value={item.quantity ?? ""}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              const value = isNaN(parsed) ? null : Math.max(0, parsed);
              onUpdate(item.id, { quantity: value });
            }}
            className={`${baseInputClass} text-right ${hasQuantityError ? errorBorder : normalBorder}`}
            min="0"
            step="1"
          />
        )}
      </TableCell>
      <TableCell>
        {isHeader ? (
          "-"
        ) : isLabor ? (
          "式"
        ) : (
          <input
            type="text"
            value={item.unit}
            onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
            className={`${baseInputClass} ${hasUnitError ? errorBorder : normalBorder}`}
            placeholder="単位"
          />
        )}
      </TableCell>
      <TableCell align="right">
        {isHeader || isLabor ? (
          "-"
        ) : (
          <input
            type="number"
            value={item.unit_price ?? ""}
            onChange={(e) => {
              const parsed = parseInt(e.target.value);
              onUpdate(item.id, { unit_price: Number.isNaN(parsed) ? null : parsed });
            }}
            className={`${baseInputClass} text-right ${hasUnitPriceError ? errorBorder : normalBorder}`}
            min="0"
          />
        )}
      </TableCell>
      <TableCell align="right">
        {isHeader ? (
          "-"
        ) : isLabor ? (
          <input
            type="number"
            value={item.amount}
            onChange={(e) => {
              const parsed = parseInt(e.target.value);
              onUpdate(item.id, { amount: Number.isNaN(parsed) ? 0 : parsed });
            }}
            className={`${baseInputClass} text-right ${hasAmountError ? errorBorder : normalBorder}`}
            min="0"
          />
        ) : (
          formatCurrency(item.amount)
        )}
      </TableCell>
      <TableCell align="center">
        <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700">
          <div className="i-heroicons-trash w-4 h-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}
