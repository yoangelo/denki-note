import { useState, useCallback } from "react";
import type { InvoiceItem, ItemType } from "../types/invoice";

type PendingItemTypeChange = {
  itemId: string;
  newItemType: ItemType;
} | null;

type UseItemTypeChangeProps = {
  items: InvoiceItem[];
  onUpdateItem: (id: string, updates: Partial<InvoiceItem>) => void;
};

type UseItemTypeChangeReturn = {
  showItemTypeChangeModal: boolean;
  handleItemTypeChange: (itemId: string, newItemType: ItemType) => void;
  confirmItemTypeChange: () => void;
  cancelItemTypeChange: () => void;
};

const hasItemData = (item: InvoiceItem): boolean => {
  return !!(
    item.name ||
    item.quantity != null ||
    item.unit ||
    item.unit_price != null ||
    item.amount != null
  );
};

export function useItemTypeChange({
  items,
  onUpdateItem,
}: UseItemTypeChangeProps): UseItemTypeChangeReturn {
  const [showItemTypeChangeModal, setShowItemTypeChangeModal] = useState(false);
  const [pendingItemTypeChange, setPendingItemTypeChange] = useState<PendingItemTypeChange>(null);

  const handleItemTypeChange = useCallback(
    (itemId: string, newItemType: ItemType) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      if (item.item_type === newItemType) return;

      if (hasItemData(item)) {
        setPendingItemTypeChange({ itemId, newItemType });
        setShowItemTypeChangeModal(true);
      } else {
        onUpdateItem(itemId, { item_type: newItemType });
      }
    },
    [items, onUpdateItem]
  );

  const confirmItemTypeChange = useCallback(() => {
    if (!pendingItemTypeChange) return;

    const { itemId, newItemType } = pendingItemTypeChange;
    onUpdateItem(itemId, {
      item_type: newItemType,
      name: "",
      quantity: undefined,
      unit: "",
      unit_price: undefined,
      amount: undefined,
    });

    setShowItemTypeChangeModal(false);
    setPendingItemTypeChange(null);
  }, [pendingItemTypeChange, onUpdateItem]);

  const cancelItemTypeChange = useCallback(() => {
    setShowItemTypeChangeModal(false);
    setPendingItemTypeChange(null);
  }, []);

  return {
    showItemTypeChangeModal,
    handleItemTypeChange,
    confirmItemTypeChange,
    cancelItemTypeChange,
  };
}
