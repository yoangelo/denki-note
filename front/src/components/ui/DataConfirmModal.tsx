import { Modal } from "./Modal";
import { Button } from "./Button";
import { useMemo } from "react";

export type DataRecord = {
  fieldName: string;
  value: string;
};

interface DataConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  newDatas: DataRecord[];
  oldDatas?: DataRecord[];
  confirmText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submittingText?: string;
}

export function DataConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "確認",
  description = "以下の内容で実行します。よろしいですか？",
  newDatas,
  oldDatas,
  confirmText = "実行する",
  cancelText = "戻る",
  isSubmitting = false,
  submittingText = "実行中...",
}: DataConfirmModalProps) {
  const isCreateMode = !oldDatas;

  const changes = useMemo(() => {
    if (isCreateMode) return [];

    const changeList: { field: string; oldValue: string; newValue: string }[] = [];

    newDatas.forEach((newData) => {
      const oldData = oldDatas.find((old) => old.fieldName === newData.fieldName);

      if (oldData && oldData.value !== newData.value) {
        changeList.push({
          field: newData.fieldName,
          oldValue: oldData.value,
          newValue: newData.value,
        });
      }
    });

    return changeList;
  }, [newDatas, oldDatas, isCreateMode]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? submittingText : confirmText}
          </Button>
        </>
      }
    >
      <div>
        <p className="mb-4 text-gray-700">{description}</p>

        {isCreateMode ? (
          <div>
            <h4 className="font-bold mb-2 text-gray-900">【登録内容】</h4>
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-2">
                {newDatas.map((data, index) => (
                  <p key={index} className="text-gray-700">
                    <span className="font-semibold">{data.fieldName}:</span>{" "}
                    <span className="text-blue-600 font-medium">{data.value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-bold mb-2 text-gray-900">【変更内容】</h4>
            <div className="bg-gray-50 p-4 rounded">
              {changes.length === 0 ? (
                <p className="text-gray-500">変更はありません</p>
              ) : (
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <p key={index} className="text-gray-700">
                      <span className="font-semibold">{change.field}:</span>{" "}
                      <span className="text-gray-600">{change.oldValue}</span>
                      <span className="mx-2">→</span>
                      <span className="text-blue-600 font-medium">{change.newValue}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
