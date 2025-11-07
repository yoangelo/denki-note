import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
import { DailyReportEntryPage } from "./features/daily/DailyReportEntryPage";
import { DailyReportListPage } from "./features/daily/DailyReportListPage";
import { DailyReportCustomerMonthPage } from "./features/daily/DailyReportCustomerMonthPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { AdminUserInvitePage } from "./pages/admin/AdminUserInvitePage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
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
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
