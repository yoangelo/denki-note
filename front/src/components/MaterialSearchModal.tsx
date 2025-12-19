import { useState } from "react";
import { useAdminListMaterials, getAdminListMaterialsQueryKey } from "../api/generated/admin/admin";
import type { Material } from "../api/generated/timesheetAPI.schemas";
import {
  Button,
  Input,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from "./ui";
import { formatCurrency } from "../utils";

interface MaterialSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: Material) => void;
}

export function MaterialSearchModal({ isOpen, onClose, onSelect }: MaterialSearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [page, setPage] = useState(1);

  const materialSearchParams = {
    keyword: keyword || undefined,
    material_type: materialType || undefined,
    page,
    per_page: 10,
  };
  const { data: materialsData } = useAdminListMaterials(materialSearchParams, {
    query: {
      enabled: isOpen,
      queryKey: getAdminListMaterialsQueryKey(materialSearchParams),
    },
  });
  const materials = materialsData?.materials || [];
  const meta = materialsData?.meta;

  const handleClose = () => {
    setKeyword("");
    setMaterialType("");
    setPage(1);
    onClose();
  };

  const handleSelect = (material: Material) => {
    onSelect(material);
    setKeyword("");
    setMaterialType("");
    setPage(1);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleMaterialTypeChange = (value: string) => {
    setMaterialType(value);
    setPage(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="資材選択"
      size="lg"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          キャンセル
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="資材種別"
            value={materialType}
            onChange={(e) => handleMaterialTypeChange(e.target.value)}
            placeholder="種別で絞り込み"
          />
          <Input
            label="検索"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="資材名または型番で検索"
          />
        </div>

        <p className="text-sm text-gray-500">最近登録された資材から表示しています</p>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableHead>種別</TableHead>
              <TableHead>資材名</TableHead>
              <TableHead>型番</TableHead>
              <TableHead>単位</TableHead>
              <TableHead align="right">単価</TableHead>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableEmptyState message="資材が見つかりません" colSpan={5} />
              ) : (
                materials.map((material) => (
                  <TableRow
                    key={material.id}
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => handleSelect(material)}
                  >
                    <TableCell>{material.material_type || "-"}</TableCell>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.model_number || "-"}</TableCell>
                    <TableCell>{material.unit || "-"}</TableCell>
                    <TableCell align="right">{formatCurrency(material.unit_price)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.total_pages && meta.total_pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-600">
              {meta.total_count}件中 {(page - 1) * 10 + 1}-
              {Math.min(page * 10, meta.total_count ?? 0)}件を表示
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                前へ
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                {page} / {meta.total_pages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(meta.total_pages ?? 1, p + 1))}
                disabled={page >= meta.total_pages}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
