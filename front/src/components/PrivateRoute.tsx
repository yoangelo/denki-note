import type { ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { LoginPage } from "../pages/LoginPage";

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
