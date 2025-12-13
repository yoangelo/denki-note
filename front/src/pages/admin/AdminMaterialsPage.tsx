import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useAdminListMaterials,
  useAdminCreateMaterial,
  useAdminUpdateMaterial,
  useAdminDeleteMaterial,
  getAdminListMaterialsQueryKey,
} from "../../api/generated/admin/admin";
import type { Material } from "../../api/generated/timesheetAPI.schemas";
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
  material_type: string;
  model_number: string;
  unit: string;
  unit_price: string;
}

const initialFormData: FormData = {
  name: "",
  material_type: "",
  model_number: "",
  unit: "",
  unit_price: "",
};

interface FormErrors {
  name?: string;
  unit_price?: string;
}

export function AdminMaterialsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { data, isLoading } = useAdminListMaterials({ keyword: searchQuery || undefined });

  const createMutation = useAdminCreateMaterial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListMaterialsQueryKey() });
        toast.success("資材を作成しました");
        setShowCreateModal(false);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("資材の作成に失敗しました");
      },
    },
  });

  const updateMutation = useAdminUpdateMaterial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListMaterialsQueryKey() });
        toast.success("資材を更新しました");
        setShowEditModal(false);
        setSelectedMaterial(null);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("資材の更新に失敗しました");
      },
    },
  });

  const deleteMutation = useAdminDeleteMaterial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListMaterialsQueryKey() });
        toast.success("資材を削除しました");
        setShowDeleteModal(false);
        setSelectedMaterial(null);
      },
      onError: () => {
        toast.error("資材の削除に失敗しました");
      },
    },
  });

  const materials = data?.materials || [];

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "資材名を入力してください";
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

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      material_type: material.material_type || "",
      model_number: material.model_number || "",
      unit: material.unit || "",
      unit_price: String(material.unit_price),
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (material: Material) => {
    setSelectedMaterial(material);
    setShowDeleteModal(true);
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    createMutation.mutate({
      data: {
        material: {
          name: formData.name,
          material_type: formData.material_type || undefined,
          model_number: formData.model_number || undefined,
          unit: formData.unit || undefined,
          unit_price: parseInt(formData.unit_price),
        },
      },
    });
  };

  const handleUpdate = () => {
    if (!validateForm() || !selectedMaterial) return;

    updateMutation.mutate({
      id: selectedMaterial.id,
      data: {
        material: {
          name: formData.name,
          material_type: formData.material_type || undefined,
          model_number: formData.model_number || undefined,
          unit: formData.unit || undefined,
          unit_price: parseInt(formData.unit_price),
        },
      },
    });
  };

  const handleDelete = () => {
    if (!selectedMaterial) return;
    deleteMutation.mutate({ id: selectedMaterial.id });
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    const errors: FormErrors = { ...formErrors };

    if (field === "name" && !formData.name.trim()) {
      errors.name = "資材名を入力してください";
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
        title="資材マスタ"
        action={<Button onClick={openCreateModal}>+ 新規作成</Button>}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="資材名・タイプ・型番で検索..."
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
                <TableHead>資材名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>型番</TableHead>
                <TableHead>単位</TableHead>
                <TableHead align="right">単価</TableHead>
                <TableHead align="center" className="w-24">
                  操作
                </TableHead>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableEmptyState message="資材が登録されていません" colSpan={6} />
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <span
                          className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                          onClick={() => openEditModal(material)}
                        >
                          {material.name}
                        </span>
                      </TableCell>
                      <TableCell>{material.material_type || "-"}</TableCell>
                      <TableCell>{material.model_number || "-"}</TableCell>
                      <TableCell>{material.unit || "-"}</TableCell>
                      <TableCell align="right">{formatCurrency(material.unit_price)}</TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(material)}
                            className="text-blue-600 hover:text-blue-800"
                            title="編集"
                          >
                            <div className="i-heroicons-pencil-square w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(material)}
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
            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">資材が登録されていません</div>
            ) : (
              materials.map((material) => (
                <div
                  key={material.id}
                  className="shadow rounded-lg p-4 border bg-white border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-lg font-semibold text-blue-600 cursor-pointer"
                      onClick={() => openEditModal(material)}
                    >
                      {material.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(material)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <div className="i-heroicons-pencil-square w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(material)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <div className="i-heroicons-trash w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-16">タイプ:</span>
                      <span>{material.material_type || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">型番:</span>
                      <span>{material.model_number || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">単位:</span>
                      <span>{material.unit || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-16">単価:</span>
                      <span className="font-medium">{formatCurrency(material.unit_price)}</span>
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
        title="資材の新規作成"
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
            label="資材名"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => handleFieldBlur("name")}
            error={formErrors.name}
            placeholder="例: VVFケーブル"
          />
          <Input
            label="タイプ"
            value={formData.material_type}
            onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
            placeholder="例: 電線"
          />
          <Input
            label="型番"
            value={formData.model_number}
            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
            placeholder="例: VVF2.0-2C"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="単位"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="例: m"
            />
            <Input
              label="単価"
              required
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              onBlur={() => handleFieldBlur("unit_price")}
              error={formErrors.unit_price}
              placeholder="例: 200"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMaterial(null);
        }}
        title="資材の編集"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedMaterial(null);
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
            label="資材名"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => handleFieldBlur("name")}
            error={formErrors.name}
            placeholder="例: VVFケーブル"
          />
          <Input
            label="タイプ"
            value={formData.material_type}
            onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
            placeholder="例: 電線"
          />
          <Input
            label="型番"
            value={formData.model_number}
            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
            placeholder="例: VVF2.0-2C"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="単位"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="例: m"
            />
            <Input
              label="単価"
              required
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              onBlur={() => handleFieldBlur("unit_price")}
              error={formErrors.unit_price}
              placeholder="例: 200"
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMaterial(null);
        }}
        onConfirm={handleDelete}
        title="資材の削除"
        message={`「${selectedMaterial?.name}」を削除しますか？\n\n※削除後も請求書データは保持されます。`}
        confirmText="削除する"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
