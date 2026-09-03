import { Navigate, useLocation } from "react-router";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { UPDATE_PASSWORD_PATH } from "../auth/password.ts";
import { shouldRedirectToUpdatePassword } from "../auth/recovery-gate.ts";

export function PasswordRecoveryGate() {
  const { loading, isPasswordRecovery } = useAdminAuth();
  const location = useLocation();

  if (loading) return null;

  if (shouldRedirectToUpdatePassword(isPasswordRecovery, location.pathname)) {
    return <Navigate to={UPDATE_PASSWORD_PATH} replace />;
  }

  return null;
}
