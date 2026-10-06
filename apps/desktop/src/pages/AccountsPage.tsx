import { Plus, Users } from "lucide-react";
/**
 * @fileoverview AccountsPage - account management page with CRUD UI
 */
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { AccountFormModal } from "@/components/organisms/AccountFormModal";
import { AccountList } from "@/components/organisms/AccountList";
import { MainLayout } from "@/components/templates/MainLayout";
import { useAccounts } from "@/hooks/useAccounts";
import type { AccountFormData } from "@/lib/schemas/account";

/**
 * AccountsPage component
 *
 * Provides full account management UI:
 * - Account list with filter/search
 * - Create account button
 * - Edit account modal
 * - Delete confirmation
 *
 * Route: /accounts
 *
 * @example
 * ```tsx
 * // In router
 * <Route path="/accounts" element={<AccountsPage />} />
 * ```
 */
export default function AccountsPage(): React.ReactElement {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const editingAccount = editingAccountId
    ? (accounts.find((a) => a.id === editingAccountId) ?? null)
    : null;

  const handleAddClick = () => {
    setEditingAccountId(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditingAccountId(id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    await deleteAccount(id);
  };

  const handleModalSubmit = async (data: AccountFormData) => {
    if (editingAccountId) {
      await updateAccount(editingAccountId, data);
    } else {
      await createAccount(data);
    }
    setIsModalOpen(false);
    setEditingAccountId(null);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingAccountId(null);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full" data-testid="page-accounts">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
            <p className="text-sm text-muted mt-1">Manage your social media accounts</p>
          </div>

          <Button onClick={handleAddClick} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Account list */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No accounts yet"
              description="Add your first social media account to get started"
              action={{
                label: "Add Account",
                onClick: handleAddClick,
              }}
            />
          ) : (
            <AccountList
              accounts={accounts}
              loading={loading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onAdd={handleAddClick}
            />
          )}
        </div>

        {/* Form modal */}
        <AccountFormModal
          isOpen={isModalOpen}
          mode={editingAccountId ? "edit" : "create"}
          account={editingAccount}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
        />
      </div>
    </MainLayout>
  );
}
