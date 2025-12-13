import { useState } from "react";
import { useAdminListProducts, useAdminListMaterials } from "@/api/generated/admin/admin";
import { formatCurrency } from "@/utils/format";

export type SelectedProduct = {
  product_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
};

export type SelectedMaterial = {
  material_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
};

type ProductMaterialSelectProps = {
  selectedProducts: SelectedProduct[];
  selectedMaterials: SelectedMaterial[];
  onProductsChange: (products: SelectedProduct[]) => void;
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
};

export function ProductMaterialSelect({
  selectedProducts,
  selectedMaterials,
  onProductsChange,
  onMaterialsChange,
}: ProductMaterialSelectProps) {
  const [activeTab, setActiveTab] = useState<"products" | "materials" | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const { data: productsData, isLoading: productsLoading } = useAdminListProducts(
    activeTab === "products" ? { keyword: searchKeyword || undefined } : undefined
  );

  const { data: materialsData, isLoading: materialsLoading } = useAdminListMaterials(
    activeTab === "materials" ? { keyword: searchKeyword || undefined } : undefined
  );

  const products = productsData?.products || [];
  const materials = materialsData?.materials || [];

  const handleAddProduct = (product: {
    id: string;
    name: string;
    unit?: string | null;
    unit_price: number;
  }) => {
    if (selectedProducts.some((p) => p.product_id === product.id)) return;
    onProductsChange([
      ...selectedProducts,
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit || null,
        unit_price: product.unit_price,
      },
    ]);
  };

  const handleAddMaterial = (material: {
    id: string;
    name: string;
    unit?: string | null;
    unit_price: number;
  }) => {
    if (selectedMaterials.some((m) => m.material_id === material.id)) return;
    onMaterialsChange([
      ...selectedMaterials,
      {
        material_id: material.id,
        name: material.name,
        quantity: 1,
        unit: material.unit || null,
        unit_price: material.unit_price,
      },
    ]);
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.product_id !== productId));
  };

  const handleRemoveMaterial = (materialId: string) => {
    onMaterialsChange(selectedMaterials.filter((m) => m.material_id !== materialId));
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    onProductsChange(
      selectedProducts.map((p) => (p.product_id === productId ? { ...p, quantity } : p))
    );
  };

  const handleMaterialQuantityChange = (materialId: string, quantity: number) => {
    onMaterialsChange(
      selectedMaterials.map((m) => (m.material_id === materialId ? { ...m, quantity } : m))
    );
  };

  const totalProductAmount = selectedProducts.reduce(
    (sum, p) => sum + p.quantity * p.unit_price,
    0
  );
  const totalMaterialAmount = selectedMaterials.reduce(
    (sum, m) => sum + m.quantity * m.unit_price,
    0
  );

  return (
    <div className="space-y-4">
      {/* 選択済み製品・資材 */}
      {(selectedProducts.length > 0 || selectedMaterials.length > 0) && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {selectedProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">製品</h4>
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        @{formatCurrency(product.unit_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={product.quantity}
                        onChange={(e) =>
                          handleProductQuantityChange(
                            product.product_id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                      <span className="text-gray-500 text-sm w-8">{product.unit || "個"}</span>
                      <span className="text-gray-700 font-medium w-24 text-right">
                        {formatCurrency(product.quantity * product.unit_price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.product_id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMaterials.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">資材</h4>
              <div className="space-y-2">
                {selectedMaterials.map((material) => (
                  <div
                    key={material.material_id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{material.name}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        @{formatCurrency(material.unit_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={material.quantity}
                        onChange={(e) =>
                          handleMaterialQuantityChange(
                            material.material_id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                      <span className="text-gray-500 text-sm w-8">{material.unit || "個"}</span>
                      <span className="text-gray-700 font-medium w-24 text-right">
                        {formatCurrency(material.quantity * material.unit_price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(material.material_id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 合計 */}
          <div className="pt-2 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <span className="text-sm text-gray-600">製品・資材計: </span>
              <span className="font-bold text-blue-600">
                {formatCurrency(totalProductAmount + totalMaterialAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 追加ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab(activeTab === "products" ? null : "products");
            setSearchKeyword("");
          }}
          className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
            activeTab === "products"
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            製品を追加
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab(activeTab === "materials" ? null : "materials");
            setSearchKeyword("");
          }}
          className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
            activeTab === "materials"
              ? "border-green-500 bg-green-50 text-green-600"
              : "border-gray-300 bg-white text-gray-700 hover:border-green-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            資材を追加
          </span>
        </button>
      </div>

      {/* 選択パネル */}
      {activeTab && (
        <div
          className={`border-2 rounded-lg p-4 ${
            activeTab === "products"
              ? "border-blue-200 bg-blue-50/50"
              : "border-green-200 bg-green-50/50"
          }`}
        >
          {/* 検索 */}
          <div className="mb-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={activeTab === "products" ? "製品名で検索..." : "資材名で検索..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* リスト */}
          {activeTab === "products" ? (
            productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">製品が見つかりません</div>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {products.map((product) => {
                  const isSelected = selectedProducts.some((p) => p.product_id === product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      disabled={isSelected}
                      className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.model_number && (
                            <span className="text-gray-500 text-sm ml-2">
                              ({product.model_number})
                            </span>
                          )}
                        </div>
                        <span className="text-gray-700 font-medium">
                          {formatCurrency(product.unit_price)}/{product.unit || "個"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : materialsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">資材が見つかりません</div>
          ) : (
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {materials.map((material) => {
                const isSelected = selectedMaterials.some((m) => m.material_id === material.id);
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => handleAddMaterial(material)}
                    disabled={isSelected}
                    className={`px-4 py-3 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{material.name}</span>
                        {material.material_type && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({material.material_type})
                          </span>
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">
                        {formatCurrency(material.unit_price)}/{material.unit || "個"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
