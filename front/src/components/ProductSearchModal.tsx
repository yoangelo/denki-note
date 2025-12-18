import { useState } from "react";
import {
  useAdminListProducts,
  useAdminListManufacturers,
  getAdminListProductsQueryKey,
  getAdminListManufacturersQueryKey,
} from "../api/generated/admin/admin";
import type { Product } from "../api/generated/timesheetAPI.schemas";
import {
  Button,
  Input,
  Select,
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

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductSearchModal({ isOpen, onClose, onSelect }: ProductSearchModalProps) {
  const [keyword, setKeyword] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [page, setPage] = useState(1);

  const productSearchParams = {
    keyword: keyword || undefined,
    manufacturer_id: manufacturerId || undefined,
    page,
    per_page: 10,
  };
  const { data: productsData } = useAdminListProducts(productSearchParams, {
    query: {
      enabled: isOpen,
      queryKey: getAdminListProductsQueryKey(productSearchParams),
    },
  });
  const products = productsData?.products || [];
  const meta = productsData?.meta;

  const manufacturerParams = { keyword: "" };
  const { data: manufacturersData } = useAdminListManufacturers(manufacturerParams, {
    query: {
      enabled: isOpen,
      queryKey: getAdminListManufacturersQueryKey(manufacturerParams),
    },
  });
  const manufacturers = manufacturersData?.manufacturers || [];

  const handleClose = () => {
    setKeyword("");
    setManufacturerId("");
    setPage(1);
    onClose();
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setKeyword("");
    setManufacturerId("");
    setPage(1);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleManufacturerChange = (value: string) => {
    setManufacturerId(value);
    setPage(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="製品選択"
      size="lg"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          キャンセル
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="メーカー"
            value={manufacturerId}
            onChange={(e) => handleManufacturerChange(e.target.value)}
          >
            <option value="">全て</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <Input
            label="検索"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="製品名または型番で検索"
          />
        </div>

        <p className="text-sm text-gray-500">最近登録された製品から表示しています</p>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableHead>メーカー</TableHead>
              <TableHead>製品名</TableHead>
              <TableHead>型番</TableHead>
              <TableHead>単位</TableHead>
              <TableHead align="right">単価</TableHead>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableEmptyState message="製品が見つかりません" colSpan={5} />
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => handleSelect(product)}
                  >
                    <TableCell>{product.manufacturer_name || "-"}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.model_number || "-"}</TableCell>
                    <TableCell>{product.unit || "-"}</TableCell>
                    <TableCell align="right">{formatCurrency(product.unit_price)}</TableCell>
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
