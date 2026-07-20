import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-bold">Loading your session…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
