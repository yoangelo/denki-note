import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useAdminListProducts,
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useAdminDeleteProduct,
  getAdminListProductsQueryKey,
} from "../../api/generated/admin/admin";
import type { Product } from "../../api/generated/timesheetAPI.schemas";
import {
  Button,
  Input,
  Modal,
  ConfirmModal,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "../../components/ui";
import { formatCurrency } from "../../utils";

interface FormData {
  name: string;
  manufacturer_name: string;
  model_number: string;
  unit: string;
  unit_price: string;
}

const initialFormData: FormData = {
  name: "",
  manufacturer_name: "",
  model_number: "",
  unit: "",
  unit_price: "",
};

interface FormErrors {
  name?: string;
  unit_price?: string;
}

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { data, isLoading } = useAdminListProducts({ keyword: searchQuery || undefined });

  const createMutation = useAdminCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
        toast.success("製品を作成しました");
        setShowCreateModal(false);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("製品の作成に失敗しました");
      },
    },
  });

  const updateMutation = useAdminUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
        toast.success("製品を更新しました");
        setShowEditModal(false);
        setSelectedProduct(null);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("製品の更新に失敗しました");
      },
    },
  });

  const deleteMutation = useAdminDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
        toast.success("製品を削除しました");
        setShowDeleteModal(false);
        setSelectedProduct(null);
      },
      onError: () => {
        toast.error("製品の削除に失敗しました");
      },
    },
  });

  const products = data?.products || [];

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "製品名を入力してください";
    }

    if (!formData.unit_price) {
      errors.unit_price = "単価を入力してください";
    } else if (parseInt(formData.unit_price) < 0) {
      errors.unit_price = "単価は0以上の値を入力してください";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      manufacturer_name: product.manufacturer_name || "",
      model_number: product.model_number || "",
      unit: product.unit || "",
      unit_price: String(product.unit_price),
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    createMutation.mutate({
      data: {
        product: {
          name: formData.name,
          manufacturer_name: formData.manufacturer_name || undefined,
          model_number: formData.model_number || undefined,
          unit: formData.unit || undefined,
          unit_price: parseInt(formData.unit_price),
        },
      },
    });
  };

  const handleUpdate = () => {
    if (!validateForm() || !selectedProduct) return;

    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        product: {
          name: formData.name,
          manufacturer_name: formData.manufacturer_name || undefined,
          model_number: formData.model_number || undefined,
          unit: formData.unit || undefined,
          unit_price: parseInt(formData.unit_price),
        },
      },
    });
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    deleteMutation.mutate({ id: selectedProduct.id });
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    const errors: FormErrors = { ...formErrors };

    if (field === "name" && !formData.name.trim()) {
      errors.name = "製品名を入力してください";
    } else if (field === "name") {
      delete errors.name;
    }

    if (field === "unit_price") {
      if (!formData.unit_price) {
        errors.unit_price = "単価を入力してください";
      } else if (parseInt(formData.unit_price) < 0) {
        errors.unit_price = "単価は0以上の値を入力してください";
      } else {
        delete errors.unit_price;
      }
    }

    setFormErrors(errors);
  };

  return (
    <div>
      <PageHeader
        title="製品マスタ"
        action={<Button onClick={openCreateModal}>+ 新規作成</Button>}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="製品名・メーカー・型番で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => setSearchQuery("")}>
            クリア
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableHead>製品名</TableHead>
                <TableHead>メーカー</TableHead>
                <TableHead>型番</TableHead>
                <TableHead>単位</TableHead>
                <TableHead align="right">単価</TableHead>
                <TableHead align="center" className="w-24">
                  操作
                </TableHead>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableEmptyState message="製品が登録されていません" colSpan={6} />
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <span
                          className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                          onClick={() => openEditModal(product)}
                        >
                          {product.name}
                        </span>
                      </TableCell>
                      <TableCell>{product.manufacturer_name || "-"}</TableCell>
                      <TableCell>{product.model_number || "-"}</TableCell>
                      <TableCell>{product.unit || "-"}</TableCell>
                      <TableCell align="right">{formatCurrency(product.unit_price)}</TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800"
                            title="編集"
                          >
                            <div className="i-heroicons-pencil-square w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="text-red-600 hover:text-red-800"
                            title="削除"
                          >
                            <div className="i-heroicons-trash w-5 h-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">製品が登録されていません</div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="shadow rounded-lg p-4 border bg-white border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-lg font-semibold text-blue-600 cursor-pointer"
                      onClick={() => openEditModal(product)}
                    >
                      {product.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <div className="i-heroicons-pencil-square w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <div className="i-heroicons-trash w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-20">メーカー:</span>
                      <span>{product.manufacturer_name || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">型番:</span>
                      <span>{product.model_number || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">単位:</span>
                      <span>{product.unit || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">単価:</span>
                      <span className="font-medium">{formatCurrency(product.unit_price)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="製品の新規作成"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "作成中..." : "作成"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="製品名"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => handleFieldBlur("name")}
            error={formErrors.name}
            placeholder="例: エアコン室内機"
          />
          <Input
            label="メーカー"
            value={formData.manufacturer_name}
            onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
            placeholder="例: パナソニック"
            helperText="入力したメーカーが存在しない場合は自動で登録されます"
          />
          <Input
            label="型番"
            value={formData.model_number}
            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
            placeholder="例: CS-X401D2"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="単位"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="例: 台"
            />
            <Input
              label="単価"
              required
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              onBlur={() => handleFieldBlur("unit_price")}
              error={formErrors.unit_price}
              placeholder="例: 80000"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        title="製品の編集"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProduct(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="製品名"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => handleFieldBlur("name")}
            error={formErrors.name}
            placeholder="例: エアコン室内機"
          />
          <Input
            label="メーカー"
            value={formData.manufacturer_name}
            onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
            placeholder="例: パナソニック"
            helperText="入力したメーカーが存在しない場合は自動で登録されます"
          />
          <Input
            label="型番"
            value={formData.model_number}
            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
            placeholder="例: CS-X401D2"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="単位"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="例: 台"
            />
            <Input
              label="単価"
              required
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              onBlur={() => handleFieldBlur("unit_price")}
              error={formErrors.unit_price}
              placeholder="例: 80000"
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        title="製品の削除"
        message={`「${selectedProduct?.name}」を削除しますか？\n\n※削除後も請求書データは保持されます。`}
        confirmText="削除する"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
