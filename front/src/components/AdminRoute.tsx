import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user?.is_admin) {
    return <Navigate to="/daily" replace />;
  }

  return <>{children}</>;
}
