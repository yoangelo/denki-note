import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LoginPage } from "./pages/LoginPage";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
import { DailyReportEntryPage } from "./features/daily/DailyReportEntryPage";
import { DailyReportListPage } from "./features/daily/DailyReportListPage";
import { DailyReportEditPage } from "./features/daily/DailyReportEditPage";
import { DailyReportCustomerMonthPage } from "./features/daily/DailyReportCustomerMonthPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { AdminUserInvitePage } from "./pages/admin/AdminUserInvitePage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminCustomerCreatePage } from "./pages/admin/AdminCustomerCreatePage";
import { AdminCustomerDetailPage } from "./pages/admin/AdminCustomerDetailPage";
import { AdminCustomerEditPage } from "./pages/admin/AdminCustomerEditPage";
import { AdminTenantSettingsPage } from "./pages/admin/AdminTenantSettingsPage";
import { AdminTenantSettingsEditPage } from "./pages/admin/AdminTenantSettingsEditPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminMaterialsPage } from "./pages/admin/AdminMaterialsPage";
import { AdminBankAccountsPage } from "./pages/admin/AdminBankAccountsPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 1分
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/daily" replace />} />
            <Route path="daily" element={<DailyReportEntryPage />} />
            <Route path="list" element={<DailyReportListPage />} />
            <Route
              path="list/:id"
              element={
                <AdminRoute>
                  <DailyReportEditPage />
                </AdminRoute>
              }
            />
            <Route path="summary" element={<DailyReportCustomerMonthPage />} />

            {/* 管理者専用ルート */}
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users/invite"
              element={
                <AdminRoute>
                  <AdminUserInvitePage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users/:id"
              element={
                <AdminRoute>
                  <AdminUserDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/customers"
              element={
                <AdminRoute>
                  <AdminCustomersPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/customers/new"
              element={
                <AdminRoute>
                  <AdminCustomerCreatePage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/customers/:id"
              element={
                <AdminRoute>
                  <AdminCustomerDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/customers/:id/edit"
              element={
                <AdminRoute>
                  <AdminCustomerEditPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/settings"
              element={
                <AdminRoute>
                  <AdminTenantSettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/settings/edit"
              element={
                <AdminRoute>
                  <AdminTenantSettingsEditPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/products"
              element={
                <AdminRoute>
                  <AdminProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/materials"
              element={
                <AdminRoute>
                  <AdminMaterialsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/bank-accounts"
              element={
                <AdminRoute>
                  <AdminBankAccountsPage />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
