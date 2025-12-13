import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useAdminListBankAccounts,
  useAdminCreateBankAccount,
  useAdminUpdateBankAccount,
  useAdminDeleteBankAccount,
  getAdminListBankAccountsQueryKey,
} from "../../api/generated/admin/admin";
import type {
  BankAccount,
  AdminCreateBankAccountBodyBankAccountAccountType,
} from "../../api/generated/timesheetAPI.schemas";
import {
  Button,
  Input,
  Select,
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
  Badge,
} from "../../components/ui";

type AccountType = AdminCreateBankAccountBodyBankAccountAccountType;

interface FormData {
  bank_name: string;
  branch_name: string;
  account_type: AccountType;
  account_number: string;
  account_holder: string;
  is_default_for_invoice: boolean;
}

const initialFormData: FormData = {
  bank_name: "",
  branch_name: "",
  account_type: "ordinary",
  account_number: "",
  account_holder: "",
  is_default_for_invoice: false,
};

interface FormErrors {
  bank_name?: string;
  branch_name?: string;
  account_number?: string;
  account_holder?: string;
}

const getAccountTypeLabel = (type: string) => {
  switch (type) {
    case "ordinary":
      return "普通";
    case "checking":
      return "当座";
    case "savings":
      return "貯蓄";
    default:
      return type;
  }
};

export function AdminBankAccountsPage() {
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { data, isLoading } = useAdminListBankAccounts();

  const createMutation = useAdminCreateBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBankAccountsQueryKey() });
        toast.success("口座情報を作成しました");
        setShowCreateModal(false);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("口座情報の作成に失敗しました");
      },
    },
  });

  const updateMutation = useAdminUpdateBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBankAccountsQueryKey() });
        toast.success("口座情報を更新しました");
        setShowEditModal(false);
        setSelectedAccount(null);
        setFormData(initialFormData);
      },
      onError: () => {
        toast.error("口座情報の更新に失敗しました");
      },
    },
  });

  const deleteMutation = useAdminDeleteBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBankAccountsQueryKey() });
        toast.success("口座情報を削除しました");
        setShowDeleteModal(false);
        setSelectedAccount(null);
      },
      onError: () => {
        toast.error("口座情報の削除に失敗しました");
      },
    },
  });

  const bankAccounts = data?.bank_accounts || [];

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.bank_name.trim()) {
      errors.bank_name = "銀行名を入力してください";
    }

    if (!formData.branch_name.trim()) {
      errors.branch_name = "支店名を入力してください";
    }

    if (!formData.account_number.trim()) {
      errors.account_number = "口座番号を入力してください";
    }

    if (!formData.account_holder.trim()) {
      errors.account_holder = "口座名義を入力してください";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      bank_name: account.bank_name,
      branch_name: account.branch_name,
      account_type: account.account_type,
      account_number: "",
      account_holder: account.account_holder,
      is_default_for_invoice: account.is_default_for_invoice || false,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    createMutation.mutate({
      data: {
        bank_account: {
          bank_name: formData.bank_name,
          branch_name: formData.branch_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          account_holder: formData.account_holder,
          is_default_for_invoice: formData.is_default_for_invoice,
        },
      },
    });
  };

  const handleUpdate = () => {
    if (!selectedAccount) return;

    const errors: FormErrors = {};
    if (!formData.bank_name.trim()) {
      errors.bank_name = "銀行名を入力してください";
    }
    if (!formData.branch_name.trim()) {
      errors.branch_name = "支店名を入力してください";
    }
    if (!formData.account_holder.trim()) {
      errors.account_holder = "口座名義を入力してください";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    updateMutation.mutate({
      id: selectedAccount.id,
      data: {
        bank_account: {
          bank_name: formData.bank_name,
          branch_name: formData.branch_name,
          account_type: formData.account_type,
          account_number: formData.account_number || undefined,
          account_holder: formData.account_holder,
          is_default_for_invoice: formData.is_default_for_invoice,
        },
      },
    });
  };

  const handleDelete = () => {
    if (!selectedAccount) return;
    deleteMutation.mutate({ id: selectedAccount.id });
  };

  const handleSetDefault = (accountId: string) => {
    const account = bankAccounts.find((a) => a.id === accountId);
    if (!account) return;

    updateMutation.mutate({
      id: accountId,
      data: {
        bank_account: {
          is_default_for_invoice: true,
        },
      },
    });
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    const errors: FormErrors = { ...formErrors };

    if (field === "bank_name" && !formData.bank_name.trim()) {
      errors.bank_name = "銀行名を入力してください";
    } else if (field === "bank_name") {
      delete errors.bank_name;
    }

    if (field === "branch_name" && !formData.branch_name.trim()) {
      errors.branch_name = "支店名を入力してください";
    } else if (field === "branch_name") {
      delete errors.branch_name;
    }

    if (field === "account_number" && showCreateModal && !formData.account_number.trim()) {
      errors.account_number = "口座番号を入力してください";
    } else if (field === "account_number") {
      delete errors.account_number;
    }

    if (field === "account_holder" && !formData.account_holder.trim()) {
      errors.account_holder = "口座名義を入力してください";
    } else if (field === "account_holder") {
      delete errors.account_holder;
    }

    setFormErrors(errors);
  };

  return (
    <div>
      <PageHeader title="口座情報" action={<Button onClick={openCreateModal}>+ 新規作成</Button>} />

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">読み込み中...</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableHead>銀行名</TableHead>
                <TableHead>支店名</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>口座番号</TableHead>
                <TableHead align="center">デフォルト</TableHead>
                <TableHead align="center" className="w-24">
                  操作
                </TableHead>
              </TableHeader>
              <TableBody>
                {bankAccounts.length === 0 ? (
                  <TableEmptyState message="口座情報が登録されていません" colSpan={6} />
                ) : (
                  bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <span
                          className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                          onClick={() => openEditModal(account)}
                        >
                          {account.bank_name}
                        </span>
                      </TableCell>
                      <TableCell>{account.branch_name}</TableCell>
                      <TableCell>
                        {account.account_type_label || getAccountTypeLabel(account.account_type)}
                      </TableCell>
                      <TableCell>{account.account_number_masked || "-"}</TableCell>
                      <TableCell align="center">
                        {account.is_default_for_invoice ? (
                          <Badge variant="success" size="sm">
                            デフォルト
                          </Badge>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            className="text-gray-500 hover:text-blue-600 text-sm underline"
                            disabled={updateMutation.isPending}
                          >
                            設定する
                          </button>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(account)}
                            className="text-blue-600 hover:text-blue-800"
                            title="編集"
                          >
                            <div className="i-heroicons-pencil-square w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(account)}
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
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">口座情報が登録されていません</div>
            ) : (
              bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="shadow rounded-lg p-4 border bg-white border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="text-lg font-semibold text-blue-600 cursor-pointer"
                      onClick={() => openEditModal(account)}
                    >
                      {account.bank_name}
                    </span>
                    <div className="flex items-center gap-2">
                      {account.is_default_for_invoice && (
                        <Badge variant="success" size="sm">
                          デフォルト
                        </Badge>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(account)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <div className="i-heroicons-pencil-square w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(account)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <div className="i-heroicons-trash w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-semibold w-20">支店名:</span>
                      <span>{account.branch_name}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">種別:</span>
                      <span>
                        {account.account_type_label || getAccountTypeLabel(account.account_type)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">口座番号:</span>
                      <span>{account.account_number_masked || "-"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-20">名義:</span>
                      <span>{account.account_holder}</span>
                    </div>
                  </div>
                  {!account.is_default_for_invoice && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        disabled={updateMutation.isPending}
                      >
                        デフォルトに設定する
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="口座情報の新規作成"
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
            label="銀行名"
            required
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            onBlur={() => handleFieldBlur("bank_name")}
            error={formErrors.bank_name}
            placeholder="例: 〇〇銀行"
          />
          <Input
            label="支店名"
            required
            value={formData.branch_name}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
            onBlur={() => handleFieldBlur("branch_name")}
            error={formErrors.branch_name}
            placeholder="例: △△支店"
          />
          <Select
            label="口座種別"
            required
            value={formData.account_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                account_type: e.target.value as AccountType,
              })
            }
          >
            <option value="ordinary">普通</option>
            <option value="checking">当座</option>
            <option value="savings">貯蓄</option>
          </Select>
          <Input
            label="口座番号"
            required
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            onBlur={() => handleFieldBlur("account_number")}
            error={formErrors.account_number}
            placeholder="例: 1234567"
          />
          <Input
            label="口座名義"
            required
            value={formData.account_holder}
            onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
            onBlur={() => handleFieldBlur("account_holder")}
            error={formErrors.account_holder}
            placeholder="例: カ）デンキコウジ"
          />
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default_for_invoice}
              onChange={(e) =>
                setFormData({ ...formData, is_default_for_invoice: e.target.checked })
              }
              className="mr-2 w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-gray-700">請求書のデフォルトに設定する</span>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAccount(null);
        }}
        title="口座情報の編集"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedAccount(null);
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
            label="銀行名"
            required
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            onBlur={() => handleFieldBlur("bank_name")}
            error={formErrors.bank_name}
            placeholder="例: 〇〇銀行"
          />
          <Input
            label="支店名"
            required
            value={formData.branch_name}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
            onBlur={() => handleFieldBlur("branch_name")}
            error={formErrors.branch_name}
            placeholder="例: △△支店"
          />
          <Select
            label="口座種別"
            required
            value={formData.account_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                account_type: e.target.value as AccountType,
              })
            }
          >
            <option value="ordinary">普通</option>
            <option value="checking">当座</option>
            <option value="savings">貯蓄</option>
          </Select>
          <Input
            label="口座番号"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="変更する場合のみ入力"
            helperText="空欄の場合は変更されません。入力した場合、下4桁以外はマスクされます"
          />
          <Input
            label="口座名義"
            required
            value={formData.account_holder}
            onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
            onBlur={() => handleFieldBlur("account_holder")}
            error={formErrors.account_holder}
            placeholder="例: カ）デンキコウジ"
          />
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default_for_invoice}
              onChange={(e) =>
                setFormData({ ...formData, is_default_for_invoice: e.target.checked })
              }
              className="mr-2 w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-gray-700">請求書のデフォルトに設定する</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAccount(null);
        }}
        onConfirm={handleDelete}
        title="口座情報の削除"
        message={`「${selectedAccount?.bank_name} ${selectedAccount?.branch_name}」の口座情報を削除しますか？\n\n※削除後も請求書データは保持されます。`}
        confirmText="削除する"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
