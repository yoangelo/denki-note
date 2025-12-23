import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useAdminGetInvoice,
  useAdminUpdateInvoice,
  useAdminIssueInvoice,
  getAdminListInvoicesQueryKey,
  getAdminGetInvoiceQueryKey,
  useAdminGetDailyReportsForInvoice,
} from "../../api/generated/admin/admin";
import { useListCustomers } from "../../api/generated/customers/customers";
import { useListSites } from "../../api/generated/sites/sites";
import type {
  DailyReportForInvoice,
  InvoiceUpdateRequestInvoiceItemsItem,
  Product,
  Material,
  InvoiceProduct,
  InvoiceMaterial,
} from "../../api/generated/timesheetAPI.schemas";
import { InvoiceStatusBadge } from "../../components/InvoiceStatusBadge";
import { ProductSearchModal } from "../../components/ProductSearchModal";
import { MaterialSearchModal } from "../../components/MaterialSearchModal";
import { InvoiceItemRow } from "../../components/InvoiceItemRow";
import {
  Button,
  Input,
  Select,
  Modal,
  ConfirmModal,
  FullScreenModal,
  Table,
  TableHeader,
  TableBody,
  TableHead,
} from "../../components/ui";
import {
  formatCurrency,
  formatDate,
  formatProductName,
  formatMaterialName,
  validateInvoiceItems,
  clearItemErrors,
  clearFieldError,
  isFieldValid,
  taxRateToApi,
  taxRateFromApi,
  type InvoiceItemValidationError,
} from "../../utils";
import type { InvoiceItem, ItemType } from "../../types/invoice";
import { useItemTypeChange } from "../../hooks/useItemTypeChange";

const TAX_RATE_OPTIONS = [
  { value: "0.1", label: "10%" },
  { value: "0.08", label: "8%" },
];

interface OriginalFormData {
  customerId: string;
  siteId: string;
  billingDate: string;
  customerName: string;
  title: string;
  taxRate: string;
  deliveryDate: string;
  deliveryPlace: string;
  transactionMethod: string;
  validUntil: string;
  note: string;
  itemsJson: string;
  dailyReportIds: string[];
  productIds: string[];
  materialIds: string[];
}

export function AdminInvoiceEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Load existing invoice
  const { data, isLoading, error } = useAdminGetInvoice(id || "");

  // Customer/Site selection
  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Basic info
  const [billingDate, setBillingDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState("0.1");
  const [showOtherInfo, setShowOtherInfo] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [transactionMethod, setTransactionMethod] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [note, setNote] = useState("");

  // Daily reports
  const [selectedDailyReportIds, setSelectedDailyReportIds] = useState<string[]>([]);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [generatePattern, setGeneratePattern] = useState<"per_report" | "aggregated">("per_report");

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemValidationErrors, setItemValidationErrors] = useState<InvoiceItemValidationError[]>(
    []
  );

  // Item selection for integration
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showIntegrateConfirmModal, setShowIntegrateConfirmModal] = useState(false);

  // Modals
  const [showIssueConfirmModal, setShowIssueConfirmModal] = useState(false);

  // Product/Material search modals
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);
  const [searchTargetItemId, setSearchTargetItemId] = useState<string | null>(null);

  // Selected products/materials for invoice
  const [selectedProducts, setSelectedProducts] = useState<
    Pick<InvoiceProduct, "product_id" | "product_name" | "model_number" | "unit_price">[]
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    Pick<InvoiceMaterial, "material_id" | "material_name" | "model_number" | "unit_price">[]
  >([]);
  const [showProductSelectModal, setShowProductSelectModal] = useState(false);
  const [showMaterialSelectModal, setShowMaterialSelectModal] = useState(false);

  // Initialized flag to prevent re-initialization
  const [initialized, setInitialized] = useState(false);

  // Leave confirmation modal
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const originalDataRef = useRef<OriginalFormData | null>(null);

  // API
  const { data: customers = [] } = useListCustomers();
  const { data: sites = [] } = useListSites(
    customerId ? { customer_id: customerId } : { customer_id: "" }
  );

  const { data: dailyReportsData } = useAdminGetDailyReportsForInvoice(
    customerId
      ? {
          customer_id: customerId,
          site_id: siteId || undefined,
        }
      : { customer_id: "" }
  );
  const dailyReports = useMemo(
    () => dailyReportsData?.daily_reports || [],
    [dailyReportsData?.daily_reports]
  );

  // Initialize form with existing data
  useEffect(() => {
    if (data && !initialized) {
      const { invoice, invoice_items, daily_reports, invoice_products, invoice_materials } = data;

      const initialCustomerId = invoice.customer_id || "";
      const initialSiteId = invoice.site_id || "";
      const initialBillingDate = invoice.billing_date || "";
      const initialCustomerName = invoice.customer_name || "";
      const initialTitle = invoice.title || "";
      const initialTaxRate = taxRateFromApi(invoice.tax_rate);
      const initialDeliveryDate = invoice.delivery_date || "";
      const initialDeliveryPlace = invoice.delivery_place || "";
      const initialTransactionMethod = invoice.transaction_method || "";
      const initialValidUntil = invoice.valid_until || "";
      const initialNote = invoice.note || "";

      setCustomerId(initialCustomerId);
      setSiteId(initialSiteId);
      setBillingDate(initialBillingDate);
      setCustomerName(initialCustomerName);
      setTitle(initialTitle);
      setTaxRate(initialTaxRate);
      setDeliveryDate(initialDeliveryDate);
      setDeliveryPlace(initialDeliveryPlace);
      setTransactionMethod(initialTransactionMethod);
      setValidUntil(initialValidUntil);
      setNote(initialNote);

      // Set invoice items
      const initialItems = invoice_items
        ? invoice_items.map((item) => ({
            id: item.id,
            item_type: item.item_type as ItemType,
            name: item.name,
            quantity: item.quantity ?? null,
            unit: item.unit || "",
            unit_price: item.unit_price ?? null,
            amount: item.amount || 0,
            sort_order: item.sort_order,
          }))
        : [];
      setItems(initialItems);

      // Set selected daily report IDs
      const initialDailyReportIds = daily_reports ? daily_reports.map((r) => r.id) : [];
      setSelectedDailyReportIds(initialDailyReportIds);

      // Set selected products and materials
      const initialProducts = invoice_products
        ? invoice_products.map((p) => ({
            product_id: p.product_id,
            product_name: p.product_name,
            model_number: p.model_number,
            unit_price: p.unit_price,
          }))
        : [];
      const initialMaterials = invoice_materials
        ? invoice_materials.map((m) => ({
            material_id: m.material_id,
            material_name: m.material_name,
            model_number: m.model_number,
            unit_price: m.unit_price,
          }))
        : [];
      setSelectedProducts(initialProducts);
      setSelectedMaterials(initialMaterials);

      const initialProductIds = initialProducts.map((p) => p.product_id);
      const initialMaterialIds = initialMaterials.map((m) => m.material_id);

      // Store original data for dirty check
      originalDataRef.current = {
        customerId: initialCustomerId,
        siteId: initialSiteId,
        billingDate: initialBillingDate,
        customerName: initialCustomerName,
        title: initialTitle,
        taxRate: initialTaxRate,
        deliveryDate: initialDeliveryDate,
        deliveryPlace: initialDeliveryPlace,
        transactionMethod: initialTransactionMethod,
        validUntil: initialValidUntil,
        note: initialNote,
        itemsJson: JSON.stringify(initialItems),
        dailyReportIds: initialDailyReportIds,
        productIds: initialProductIds,
        materialIds: initialMaterialIds,
      };

      // Show other info if any optional field is filled
      if (
        invoice.delivery_date ||
        invoice.delivery_place ||
        invoice.transaction_method ||
        invoice.valid_until
      ) {
        setShowOtherInfo(true);
      }

      setInitialized(true);
    }
  }, [data, initialized]);

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!originalDataRef.current || !initialized) return false;
    const original = originalDataRef.current;
    const currentItemsJson = JSON.stringify(items);
    const dailyReportIdsSorted = [...selectedDailyReportIds].sort();
    const originalDailyReportIdsSorted = [...original.dailyReportIds].sort();
    const currentProductIdsSorted = [...selectedProducts.map((p) => p.product_id)].sort();
    const originalProductIdsSorted = [...original.productIds].sort();
    const currentMaterialIdsSorted = [...selectedMaterials.map((m) => m.material_id)].sort();
    const originalMaterialIdsSorted = [...original.materialIds].sort();

    return (
      customerId !== original.customerId ||
      siteId !== original.siteId ||
      billingDate !== original.billingDate ||
      customerName !== original.customerName ||
      title !== original.title ||
      taxRate !== original.taxRate ||
      deliveryDate !== original.deliveryDate ||
      deliveryPlace !== original.deliveryPlace ||
      transactionMethod !== original.transactionMethod ||
      validUntil !== original.validUntil ||
      note !== original.note ||
      currentItemsJson !== original.itemsJson ||
      JSON.stringify(dailyReportIdsSorted) !== JSON.stringify(originalDailyReportIdsSorted) ||
      JSON.stringify(currentProductIdsSorted) !== JSON.stringify(originalProductIdsSorted) ||
      JSON.stringify(currentMaterialIdsSorted) !== JSON.stringify(originalMaterialIdsSorted)
    );
  }, [
    initialized,
    customerId,
    siteId,
    billingDate,
    customerName,
    title,
    taxRate,
    deliveryDate,
    deliveryPlace,
    transactionMethod,
    validUntil,
    note,
    items,
    selectedDailyReportIds,
    selectedProducts,
    selectedMaterials,
  ]);

  // Warn before browser tab close/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateMutation = useAdminUpdateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetInvoiceQueryKey(id || "") });
        toast.success("請求書を保存しました");
        navigate(`/admin/invoices/${id}`);
      },
      onError: () => {
        toast.error("請求書の保存に失敗しました");
      },
    },
  });

  const issueMutation = useAdminIssueInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetInvoiceQueryKey(id || "") });
        toast.success("請求書を発行しました");
        navigate(`/admin/invoices/${id}`);
      },
      onError: () => {
        toast.error("請求書の発行に失敗しました");
      },
    },
  });

  // Calculate amounts
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.item_type === "header") return sum;
      return sum + item.amount;
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.floor(subtotal * parseFloat(taxRate));
  }, [subtotal, taxRate]);

  const totalAmount = subtotal + taxAmount;

  // Handlers
  const handleCustomerSelect = (cId: string) => {
    const customer = customers.find((c) => c.id === cId);
    setCustomerId(cId);
    setSiteId("");
    setSelectedDailyReportIds([]);
    if (customer) {
      setCustomerName(customer.name);
    }
    setShowCustomerModal(false);
  };

  const handleSiteSelect = (sId: string) => {
    setSiteId(sId);
    setSelectedDailyReportIds([]);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      item_type: "other",
      name: "",
      quantity: 1,
      unit: "",
      unit_price: 0,
      amount: 0,
      sort_order: items.length,
      isNew: true,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    // If item_type is being changed, clear all errors for this item
    if ("item_type" in updates) {
      setItemValidationErrors((prev) => clearItemErrors(prev, itemId));
    }

    setItems((prevItems) => {
      const newItems = prevItems.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, ...updates };
        // Recalculate amount if quantity or unit_price changed
        if (
          updated.item_type !== "header" &&
          updated.item_type !== "labor" &&
          updated.quantity !== null &&
          updated.unit_price !== null
        ) {
          updated.amount = updated.quantity * updated.unit_price;
        }
        return updated;
      });

      // Clear field errors if the field is now valid (except for item_type changes which are handled above)
      if (!("item_type" in updates)) {
        const updatedItem = newItems.find((item) => item.id === itemId);
        if (updatedItem) {
          const fieldsToCheck: Array<"name" | "quantity" | "unit" | "unit_price" | "amount"> = [];
          if ("name" in updates) fieldsToCheck.push("name");
          if ("quantity" in updates) fieldsToCheck.push("quantity");
          if ("unit" in updates) fieldsToCheck.push("unit");
          if ("unit_price" in updates) fieldsToCheck.push("unit_price");
          if ("amount" in updates) fieldsToCheck.push("amount");

          fieldsToCheck.forEach((field) => {
            if (isFieldValid(updatedItem, field)) {
              setItemValidationErrors((prev) => clearFieldError(prev, itemId, field));
            }
          });
        }
      }

      return newItems;
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
    setItemValidationErrors((prev) => clearItemErrors(prev, itemId));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // Item selection for integration
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleIntegrateItems = () => {
    if (selectedItemIds.size < 2) {
      toast.error("2つ以上の項目を選択してください");
      return;
    }
    setShowIntegrateConfirmModal(true);
  };

  const handleConfirmIntegrate = () => {
    const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
    const totalAmount = selectedItems.reduce((sum, item) => {
      if (item.item_type === "header") return sum;
      return sum + item.amount;
    }, 0);

    // Create new integrated item
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      item_type: "integrated",
      name: "",
      quantity: 1,
      unit: "式",
      unit_price: null,
      amount: totalAmount,
      sort_order: items.length,
      isNew: true,
    };

    // Remove selected items and add new integrated item
    const remainingItems = items.filter((item) => !selectedItemIds.has(item.id));
    setItems([...remainingItems, newItem]);
    setSelectedItemIds(new Set());
    setShowIntegrateConfirmModal(false);
    toast.success("選択した項目をまとめました");
  };

  const handleOpenProductSearch = (targetItemId: string) => {
    setSearchTargetItemId(targetItemId);
    setShowProductSearchModal(true);
  };

  const handleOpenMaterialSearch = (targetItemId: string) => {
    setSearchTargetItemId(targetItemId);
    setShowMaterialSearchModal(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (!searchTargetItemId) return;
    handleUpdateItem(searchTargetItemId, {
      name: formatProductName(product),
      unit: product.unit || "",
      unit_price: product.unit_price,
      quantity: 1,
      amount: product.unit_price,
    });
    setShowProductSearchModal(false);
    setSearchTargetItemId(null);
  };

  const handleSelectMaterial = (material: Material) => {
    if (!searchTargetItemId) return;
    handleUpdateItem(searchTargetItemId, {
      name: formatMaterialName(material),
      unit: material.unit || "",
      unit_price: material.unit_price,
      quantity: 1,
      amount: material.unit_price,
    });
    setShowMaterialSearchModal(false);
    setSearchTargetItemId(null);
  };

  // Invoice products/materials handlers
  const handleAddInvoiceProduct = (product: Product) => {
    if (selectedProducts.some((p) => p.product_id === product.id)) {
      toast.error("この製品は既に追加されています");
      return;
    }
    setSelectedProducts((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        model_number: product.model_number || null,
        unit_price: product.unit_price,
      },
    ]);
    setShowProductSelectModal(false);
  };

  const handleRemoveInvoiceProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.product_id !== productId));
  };

  const handleAddInvoiceMaterial = (material: Material) => {
    if (selectedMaterials.some((m) => m.material_id === material.id)) {
      toast.error("この資材は既に追加されています");
      return;
    }
    setSelectedMaterials((prev) => [
      ...prev,
      {
        material_id: material.id,
        material_name: material.name,
        model_number: material.model_number || null,
        unit_price: material.unit_price,
      },
    ]);
    setShowMaterialSelectModal(false);
  };

  const handleRemoveInvoiceMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.material_id !== materialId));
  };

  // Item type change with confirmation
  const {
    showItemTypeChangeModal,
    handleItemTypeChange,
    confirmItemTypeChange,
    cancelItemTypeChange,
  } = useItemTypeChange({ items, onUpdateItem: handleUpdateItem });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);

        // Update sort_order for all items
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: index,
        }));

        setItems(updatedItems);
      }
    },
    [items]
  );

  const handleDailyReportToggle = (reportId: string) => {
    setSelectedDailyReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((rid) => rid !== reportId) : [...prev, reportId]
    );
  };

  const handleGenerateFromDailyReports = useCallback(() => {
    const selectedReports = dailyReports.filter((r) => selectedDailyReportIds.includes(r.id));
    if (selectedReports.length === 0) {
      toast.error("日報を選択してください");
      return;
    }

    const newItems: InvoiceItem[] = [];
    let sortOrder = items.length;

    // Collect products and materials to add to invoice
    const productsToAdd: Pick<
      InvoiceProduct,
      "product_id" | "product_name" | "model_number" | "unit_price"
    >[] = [];
    const materialsToAdd: Pick<
      InvoiceMaterial,
      "material_id" | "material_name" | "model_number" | "unit_price"
    >[] = [];

    if (generatePattern === "per_report") {
      // Per-report pattern: Create items grouped by daily report
      selectedReports.forEach((report) => {
        // Add labor item for this report
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "labor",
          name: `${formatDate(report.report_date)} ${report.summary || "作業"}`,
          quantity: 1,
          unit: "式",
          unit_price: null,
          amount: report.labor_cost,
          sort_order: sortOrder++,
          isNew: true,
        });

        // Add products
        report.products?.forEach((product) => {
          newItems.push({
            id: crypto.randomUUID(),
            item_type: "product",
            name: product.name || "",
            quantity: product.quantity || 1,
            unit: product.unit || "個",
            unit_price: product.unit_price || 0,
            amount: (product.quantity || 1) * (product.unit_price || 0),
            sort_order: sortOrder++,
            isNew: true,
          });
          // Add to invoice products if not already added
          if (
            product.id &&
            !selectedProducts.some((p) => p.product_id === product.id) &&
            !productsToAdd.some((p) => p.product_id === product.id)
          ) {
            productsToAdd.push({
              product_id: product.id,
              product_name: product.name || "",
              model_number: null,
              unit_price: product.unit_price || 0,
            });
          }
        });

        // Add materials
        report.materials?.forEach((material) => {
          newItems.push({
            id: crypto.randomUUID(),
            item_type: "material",
            name: material.name || "",
            quantity: material.quantity || 1,
            unit: material.unit || "個",
            unit_price: material.unit_price || 0,
            amount: (material.quantity || 1) * (material.unit_price || 0),
            sort_order: sortOrder++,
            isNew: true,
          });
          // Add to invoice materials if not already added
          if (
            material.id &&
            !selectedMaterials.some((m) => m.material_id === material.id) &&
            !materialsToAdd.some((m) => m.material_id === material.id)
          ) {
            materialsToAdd.push({
              material_id: material.id,
              material_name: material.name || "",
              model_number: null,
              unit_price: material.unit_price || 0,
            });
          }
        });
      });
    } else {
      // Aggregated pattern: Combine all items
      const totalLaborCost = selectedReports.reduce((sum, r) => sum + r.labor_cost, 0);

      // Add combined labor item
      newItems.push({
        id: crypto.randomUUID(),
        item_type: "labor",
        name: "作業",
        quantity: 1,
        unit: "式",
        unit_price: null,
        amount: totalLaborCost,
        sort_order: sortOrder++,
        isNew: true,
      });

      // Aggregate products by product_id
      const productMap = new Map<
        string,
        {
          name: string;
          quantity: number;
          unit: string;
          unit_price: number;
          id?: string;
          model_number?: string | null;
        }
      >();
      selectedReports.forEach((report) => {
        report.products?.forEach((product) => {
          const key = product.id || product.name || "";
          const existing = productMap.get(key);
          if (existing) {
            existing.quantity += product.quantity || 1;
          } else {
            productMap.set(key, {
              name: product.name || "",
              quantity: product.quantity || 1,
              unit: product.unit || "個",
              unit_price: product.unit_price || 0,
              id: product.id,
              model_number: null,
            });
          }
        });
      });

      productMap.forEach((product) => {
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "product",
          name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          unit_price: product.unit_price,
          amount: product.quantity * product.unit_price,
          sort_order: sortOrder++,
          isNew: true,
        });
        // Add to invoice products if not already added
        if (
          product.id &&
          !selectedProducts.some((p) => p.product_id === product.id) &&
          !productsToAdd.some((p) => p.product_id === product.id)
        ) {
          productsToAdd.push({
            product_id: product.id,
            product_name: product.name,
            model_number: product.model_number || null,
            unit_price: product.unit_price,
          });
        }
      });

      // Aggregate materials by material_id
      const materialMap = new Map<
        string,
        {
          name: string;
          quantity: number;
          unit: string;
          unit_price: number;
          id?: string;
          model_number?: string | null;
        }
      >();
      selectedReports.forEach((report) => {
        report.materials?.forEach((material) => {
          const key = material.id || material.name || "";
          const existing = materialMap.get(key);
          if (existing) {
            existing.quantity += material.quantity || 1;
          } else {
            materialMap.set(key, {
              name: material.name || "",
              quantity: material.quantity || 1,
              unit: material.unit || "個",
              unit_price: material.unit_price || 0,
              id: material.id,
              model_number: null,
            });
          }
        });
      });

      materialMap.forEach((material) => {
        newItems.push({
          id: crypto.randomUUID(),
          item_type: "material",
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
          unit_price: material.unit_price,
          amount: material.quantity * material.unit_price,
          sort_order: sortOrder++,
          isNew: true,
        });
        // Add to invoice materials if not already added
        if (
          material.id &&
          !selectedMaterials.some((m) => m.material_id === material.id) &&
          !materialsToAdd.some((m) => m.material_id === material.id)
        ) {
          materialsToAdd.push({
            material_id: material.id,
            material_name: material.name,
            model_number: material.model_number || null,
            unit_price: material.unit_price,
          });
        }
      });
    }

    setItems([...items, ...newItems]);
    if (productsToAdd.length > 0) {
      setSelectedProducts((prev) => [...prev, ...productsToAdd]);
    }
    if (materialsToAdd.length > 0) {
      setSelectedMaterials((prev) => [...prev, ...materialsToAdd]);
    }
    setShowAutoGenerateModal(false);
    toast.success(`${newItems.length}件の請求項目を追加しました`);
  }, [
    dailyReports,
    selectedDailyReportIds,
    generatePattern,
    items,
    selectedProducts,
    selectedMaterials,
  ]);

  const handleSave = () => {
    if (!customerId) {
      toast.error("顧客を選択してください");
      return;
    }
    if (!billingDate) {
      toast.error("請求日を入力してください");
      return;
    }

    // Validate invoice items
    const errors = validateInvoiceItems(items);
    setItemValidationErrors(errors);
    if (errors.length > 0) {
      toast.error("請求項目に入力エラーがあります");
      return;
    }

    const invoiceItems: InvoiceUpdateRequestInvoiceItemsItem[] = items.map((item, index) => ({
      id: item.isNew ? undefined : item.id,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit || undefined,
      unit_price: item.unit_price ?? undefined,
      amount: item.amount,
      sort_order: index,
    }));

    updateMutation.mutate({
      id: id || "",
      data: {
        invoice: {
          customer_id: customerId,
          site_id: siteId || undefined,
          billing_date: billingDate,
          customer_name: customerName || undefined,
          title: title || undefined,
          tax_rate: taxRateToApi(taxRate),
          delivery_date: deliveryDate || undefined,
          delivery_place: deliveryPlace || undefined,
          transaction_method: transactionMethod || undefined,
          valid_until: validUntil || undefined,
          note: note || undefined,
        },
        invoice_items: invoiceItems,
        daily_report_ids: selectedDailyReportIds.length > 0 ? selectedDailyReportIds : undefined,
        product_ids:
          selectedProducts.length > 0 ? selectedProducts.map((p) => p.product_id) : undefined,
        material_ids:
          selectedMaterials.length > 0 ? selectedMaterials.map((m) => m.material_id) : undefined,
      },
    });
  };

  const handleIssue = () => {
    if (!customerId) {
      toast.error("顧客を選択してください");
      return;
    }
    if (!billingDate) {
      toast.error("請求日を入力してください");
      return;
    }

    // Validate invoice items
    const errors = validateInvoiceItems(items);
    setItemValidationErrors(errors);
    if (errors.length > 0) {
      toast.error("請求項目に入力エラーがあります");
      return;
    }

    setShowIssueConfirmModal(true);
  };

  const handleConfirmIssue = async () => {
    const invoiceItems: InvoiceUpdateRequestInvoiceItemsItem[] = items.map((item, index) => ({
      id: item.isNew ? undefined : item.id,
      item_type: item.item_type,
      name: item.name,
      quantity: item.quantity ?? undefined,
      unit: item.unit || undefined,
      unit_price: item.unit_price ?? undefined,
      amount: item.amount,
      sort_order: index,
    }));

    try {
      await updateMutation.mutateAsync({
        id: id || "",
        data: {
          invoice: {
            customer_id: customerId,
            site_id: siteId || undefined,
            billing_date: billingDate,
            customer_name: customerName || undefined,
            title: title || undefined,
            tax_rate: taxRateToApi(taxRate),
            delivery_date: deliveryDate || undefined,
            delivery_place: deliveryPlace || undefined,
            transaction_method: transactionMethod || undefined,
            valid_until: validUntil || undefined,
            note: note || undefined,
          },
          invoice_items: invoiceItems,
          daily_report_ids: selectedDailyReportIds.length > 0 ? selectedDailyReportIds : undefined,
          product_ids:
            selectedProducts.length > 0 ? selectedProducts.map((p) => p.product_id) : undefined,
          material_ids:
            selectedMaterials.length > 0 ? selectedMaterials.map((m) => m.material_id) : undefined,
        },
      });

      await issueMutation.mutateAsync({ id: id || "" });
    } catch {
      // Error handled by mutation callbacks
    }
    setShowIssueConfirmModal(false);
  };

  // Handle close button click
  const handleCloseRequest = () => {
    if (isDirty) {
      setShowLeaveConfirmModal(true);
    } else {
      navigate(`/admin/invoices/${id}`);
    }
  };

  // Handle discard and leave
  const handleDiscardAndLeave = () => {
    setShowLeaveConfirmModal(false);
    navigate(`/admin/invoices/${id}`);
  };

  // Handle save and leave
  const handleSaveAndLeave = () => {
    setShowLeaveConfirmModal(false);
    handleSave();
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSite = sites.find((s) => s.id === siteId);

  const selectedDailyReportsTotal = useMemo(() => {
    return dailyReports
      .filter((r) => selectedDailyReportIds.includes(r.id))
      .reduce((sum, r) => sum + r.total_amount, 0);
  }, [dailyReports, selectedDailyReportIds]);

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">請求書の取得に失敗しました</p>
        <Button className="mt-4" onClick={() => navigate("/admin/invoices")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const invoice = data.invoice;
  const canEdit = invoice.status === "draft" || invoice.status === "issued";
  const isDraft = invoice.status === "draft";

  // Check if invoice can be edited
  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">この請求書は編集できません</p>
        <Button className="mt-4" onClick={() => navigate(`/admin/invoices/${id}`)}>
          詳細に戻る
        </Button>
      </div>
    );
  }

  return (
    <FullScreenModal
      title="請求書の編集"
      onCloseRequest={handleCloseRequest}
      rightHeaderContent={<InvoiceStatusBadge status={invoice.status} />}
    >
      <div className="max-w-6xl mx-auto">
        {/* Customer/Site Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">顧客・現場</h2>
            <Button onClick={() => setShowCustomerModal(true)}>変更</Button>
          </div>
          {customerId ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{selectedCustomer?.name}</span>
                {selectedCustomer?.customer_type === "corporate" && (
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                    法人
                  </span>
                )}
              </div>
              {siteId && <div className="text-sm text-gray-600">現場: {selectedSite?.name}</div>}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">顧客を選択してください</div>
          )}
        </div>

        {/* Main Form - Only show when customer is selected */}
        {customerId && (
          <>
            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">基本情報</h2>
                <div className="space-y-4">
                  <Input
                    label="日付（請求日）"
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    required
                  />
                  <Input
                    label="顧客表示名"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  <Input
                    label="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: 1月分工事代金"
                  />

                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setShowOtherInfo(!showOtherInfo)}
                  >
                    <span>{showOtherInfo ? "▼" : "▶"}</span>
                    <span>その他情報</span>
                  </button>

                  {showOtherInfo && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <Input
                        label="受渡期日"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                      <Input
                        label="受渡場所"
                        value={deliveryPlace}
                        onChange={(e) => setDeliveryPlace(e.target.value)}
                        placeholder="例: ○○工場"
                      />
                      <Input
                        label="取引方法"
                        value={transactionMethod}
                        onChange={(e) => setTransactionMethod(e.target.value)}
                        placeholder="例: 銀行振込"
                      />
                      <Input
                        label="有効期限"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>
                  )}

                  <Select
                    label="税率"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    required
                  >
                    {TAX_RATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">備考</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Daily Reports */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">関連する日報の設定</h2>
                  <Button variant="secondary" onClick={() => setShowDailyReportModal(true)}>
                    日報を選択
                  </Button>
                </div>

                {selectedDailyReportIds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    日報を選択すると、請求項目を自動生成できます
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyReports
                      .filter((r) => selectedDailyReportIds.includes(r.id))
                      .map((report) => (
                        <DailyReportCard
                          key={report.id}
                          report={report}
                          onRemove={() => handleDailyReportToggle(report.id)}
                        />
                      ))}
                    <div className="pt-2 border-t border-gray-200 flex justify-end">
                      <span className="text-sm text-gray-600">
                        合計金額(税込):{" "}
                        <span className="font-bold text-blue-600">
                          {formatCurrency(selectedDailyReportsTotal)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Products/Materials Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Products */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">納入製品設定</h2>
                  <Button variant="secondary" onClick={() => setShowProductSelectModal(true)}>
                    製品を追加
                  </Button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">製品が登録されていません</div>
                ) : (
                  <div className="space-y-2">
                    {selectedProducts.map((product) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.product_name}</div>
                          {product.model_number && (
                            <div className="text-sm text-gray-500 truncate">
                              型番: {product.model_number}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            単価: {formatCurrency(product.unit_price)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInvoiceProduct(product.product_id)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">使用資材設定</h2>
                  <Button variant="secondary" onClick={() => setShowMaterialSelectModal(true)}>
                    資材を追加
                  </Button>
                </div>

                {selectedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">資材が登録されていません</div>
                ) : (
                  <div className="space-y-2">
                    {selectedMaterials.map((material) => (
                      <div
                        key={material.material_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{material.material_name}</div>
                          {material.model_number && (
                            <div className="text-sm text-gray-500 truncate">
                              型番: {material.model_number}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            単価: {formatCurrency(material.unit_price)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInvoiceMaterial(material.material_id)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium">請求項目</h2>
                  {items.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={handleIntegrateItems}
                      disabled={selectedItemIds.size < 2}
                    >
                      選択した項目をまとめる
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedDailyReportIds.length > 0 && (
                    <Button variant="secondary" onClick={() => setShowAutoGenerateModal(true)}>
                      日報から自動生成
                    </Button>
                  )}
                  <Button onClick={handleAddItem}>+ 項目追加</Button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  請求項目がありません。「+ 項目追加」で追加するか、日報から自動生成してください。
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableHead className="w-10">選択</TableHead>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-24">種別</TableHead>
                        <TableHead>品名</TableHead>
                        <TableHead className="w-20" align="right">
                          数量
                        </TableHead>
                        <TableHead className="w-16">単位</TableHead>
                        <TableHead className="w-28" align="right">
                          単価
                        </TableHead>
                        <TableHead className="w-28" align="right">
                          金額
                        </TableHead>
                        <TableHead className="w-12" align="center">
                          削除
                        </TableHead>
                      </TableHeader>
                      <SortableContext
                        items={items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <TableBody>
                          {items.map((item) => (
                            <InvoiceItemRow
                              key={item.id}
                              item={item}
                              onUpdate={handleUpdateItem}
                              onDelete={handleDeleteItem}
                              onOpenProductSearch={handleOpenProductSearch}
                              onOpenMaterialSearch={handleOpenMaterialSearch}
                              onItemTypeChange={handleItemTypeChange}
                              validationErrors={itemValidationErrors}
                              showCheckbox
                              isSelected={selectedItemIds.has(item.id)}
                              onToggleSelect={handleToggleSelectItem}
                            />
                          ))}
                        </TableBody>
                      </SortableContext>
                    </Table>
                  </DndContext>
                </div>
              )}

              {/* Validation Errors */}
              {itemValidationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">入力エラーがあります:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {itemValidationErrors.map((error, index) => {
                      const item = items.find((i) => i.id === error.itemId);
                      const itemIndex = items.findIndex((i) => i.id === error.itemId) + 1;
                      return (
                        <li key={index}>
                          {itemIndex}行目 ({item?.name || "未入力"}): {error.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Totals */}
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">小計</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        消費税({Math.round(parseFloat(taxRate) * 100)}%)
                      </span>
                      <span className="font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">合計</span>
                      <span className="font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-end gap-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "保存中..." : "保存"}
                </Button>
                {isDraft && (
                  <Button
                    onClick={handleIssue}
                    disabled={updateMutation.isPending || issueMutation.isPending}
                  >
                    発行
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Customer Selection Modal */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title="顧客・現場選択"
          size="lg"
        >
          <div className="space-y-4">
            <Select
              label="顧客"
              value={customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
            >
              <option value="">選択してください</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>

            {customerId && (
              <Select
                label="現場（任意）"
                value={siteId}
                onChange={(e) => handleSiteSelect(e.target.value)}
              >
                <option value="">選択しない</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Modal>

        {/* Daily Report Selection Modal */}
        <Modal
          isOpen={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          title="日報選択"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDailyReportModal(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setShowDailyReportModal(false)}>選択</Button>
            </>
          }
        >
          {dailyReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">該当する日報がありません</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dailyReports.map((report) => (
                <label
                  key={report.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                    selectedDailyReportIds.includes(report.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDailyReportIds.includes(report.id)}
                    onChange={() => handleDailyReportToggle(report.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatDate(report.report_date)}</span>
                      <span className="text-blue-600 font-medium">
                        {formatCurrency(report.total_amount)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{report.summary || "作業"}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t flex justify-end">
            <span className="text-sm text-gray-600">
              合計金額(税込):{" "}
              <span className="font-bold text-blue-600">
                {formatCurrency(selectedDailyReportsTotal)}
              </span>
            </span>
          </div>
        </Modal>

        {/* Auto Generate Modal */}
        <Modal
          isOpen={showAutoGenerateModal}
          onClose={() => setShowAutoGenerateModal(false)}
          title="日報から自動生成"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowAutoGenerateModal(false)}>
                キャンセル
              </Button>
              <Button onClick={handleGenerateFromDailyReports}>生成する</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              選択中の日報: {selectedDailyReportIds.length}件
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生成パターン</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="generatePattern"
                    value="per_report"
                    checked={generatePattern === "per_report"}
                    onChange={() => setGeneratePattern("per_report")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>日報単位</span>
                  <span className="text-sm text-gray-500">- 日報ごとに項目を分けて生成</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="generatePattern"
                    value="aggregated"
                    checked={generatePattern === "aggregated"}
                    onChange={() => setGeneratePattern("aggregated")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>集約</span>
                  <span className="text-sm text-gray-500">- 同じ製品・資材は合算して生成</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>

        {/* Issue Confirmation Modal */}
        <ConfirmModal
          isOpen={showIssueConfirmModal}
          onClose={() => setShowIssueConfirmModal(false)}
          onConfirm={handleConfirmIssue}
          title="請求書の発行確認"
          message={`この請求書を発行しますか？\n\n顧客: ${customerName}\n合計金額: ${formatCurrency(totalAmount)}`}
          confirmText="発行する"
          loading={updateMutation.isPending || issueMutation.isPending}
        />

        {/* Item Type Change Confirmation Modal */}
        <ConfirmModal
          isOpen={showItemTypeChangeModal}
          onClose={cancelItemTypeChange}
          onConfirm={confirmItemTypeChange}
          title="種別の変更"
          message="種別を変更すると、この行のデータがクリアされます。変更しますか？"
          confirmText="変更する"
          cancelText="キャンセル"
          variant="danger"
        />

        {/* Integrate Items Confirmation Modal */}
        <ConfirmModal
          isOpen={showIntegrateConfirmModal}
          onClose={() => setShowIntegrateConfirmModal(false)}
          onConfirm={handleConfirmIntegrate}
          title="請求項目のまとめ"
          message={`選択した項目を一行にまとめますか？\n\n選択した項目は削除され、金額が合算された新しい請求項目が作成されます。`}
          confirmText="はい"
          cancelText="いいえ"
        />

        {/* Product Search Modal */}
        <ProductSearchModal
          isOpen={showProductSearchModal}
          onClose={() => {
            setShowProductSearchModal(false);
            setSearchTargetItemId(null);
          }}
          onSelect={handleSelectProduct}
        />

        {/* Material Search Modal */}
        <MaterialSearchModal
          isOpen={showMaterialSearchModal}
          onClose={() => {
            setShowMaterialSearchModal(false);
            setSearchTargetItemId(null);
          }}
          onSelect={handleSelectMaterial}
        />

        {/* Product Select Modal (for invoice products) */}
        <ProductSearchModal
          isOpen={showProductSelectModal}
          onClose={() => setShowProductSelectModal(false)}
          onSelect={handleAddInvoiceProduct}
        />

        {/* Material Select Modal (for invoice materials) */}
        <MaterialSearchModal
          isOpen={showMaterialSelectModal}
          onClose={() => setShowMaterialSelectModal(false)}
          onSelect={handleAddInvoiceMaterial}
        />

        {/* Leave Confirmation Modal */}
        <Modal
          isOpen={showLeaveConfirmModal}
          onClose={() => setShowLeaveConfirmModal(false)}
          title="編集中のデータがあります"
          size="sm"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="danger" onClick={handleDiscardAndLeave}>
                保存せずに戻る
              </Button>
              <Button onClick={handleSaveAndLeave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存して戻る"}
              </Button>
            </div>
          }
        >
          <p className="text-gray-600">変更内容を保存しますか？</p>
        </Modal>
      </div>
    </FullScreenModal>
  );
}

// Sub-components
function DailyReportCard({
  report,
  onRemove,
}: {
  report: DailyReportForInvoice;
  onRemove: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="font-medium shrink-0">{formatDate(report.report_date)}</span>
          <span className="text-gray-700 truncate">{report.summary || "作業"}</span>
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
          ×
        </button>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        {report.workers && report.workers.length > 0 && (
          <div className="truncate">作業者: {report.workers.join("、")}</div>
        )}
        {report.products && report.products.length > 0 && (
          <div className="truncate">
            使用製品: {report.products.map((p) => `${p.name}×${p.quantity}`).join(", ")}
          </div>
        )}
        {report.materials && report.materials.length > 0 && (
          <div className="truncate">
            使用資材: {report.materials.map((m) => `${m.name}×${m.quantity}`).join(", ")}
          </div>
        )}
        <div className="flex justify-end gap-4 font-medium text-gray-700">
          <span>工賃: {formatCurrency(report.labor_cost)}</span>
          <span>合計金額: {formatCurrency(report.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}
