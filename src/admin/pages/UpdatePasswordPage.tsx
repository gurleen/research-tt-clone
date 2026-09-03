import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import {
  FORGOT_PASSWORD_PATH,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "../auth/password.ts";
import { AdminAuthShell } from "../components/AdminAuthShell.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";
import { adminShellClassName, useAdminAppearance } from "../lib/appearance.ts";

export function UpdatePasswordPage() {
  const {
    session,
    isAdmin,
    isPasswordRecovery,
    loading,
    error: initError,
    updatePassword,
    changePassword,
  } = useAdminAuth();
  const { isDark } = useAdminAppearance();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div
        className={adminShellClassName(
          isDark,
          "admin-shell flex h-full items-center justify-center text-zinc-600",
        )}
      >
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <AdminAuthShell>
        <CardHeader>
          <CardTitle>Reset link expired</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm">
            <Link
              to={FORGOT_PASSWORD_PATH}
              className="text-zinc-600 hover:text-zinc-900"
            >
              Request a new reset link
            </Link>
          </p>
        </CardContent>
      </AdminAuthShell>
    );
  }

  const isSignedInChange = !isPasswordRecovery && isAdmin;
  const canSetPassword = isPasswordRecovery || isSignedInChange;

  if (!canSetPassword) {
    return (
      <AdminAuthShell>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            Sign in with an admin account to change your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm">
            <Link to="/admin/login" className="text-zinc-600 hover:text-zinc-900">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </AdminAuthShell>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (isPasswordRecovery) {
        await updatePassword(password);
      } else {
        await changePassword(currentPassword, password);
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell>
      <CardHeader>
        <CardTitle>
          {isPasswordRecovery ? "Choose a new password" : "Change password"}
        </CardTitle>
        <CardDescription>
          {isPasswordRecovery
            ? "Set a new password for your researcher account."
            : "Enter your current password, then choose a new one."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(initError || error) && (
          <Alert variant="destructive" className="mb-4">
            {error ?? initError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignedInChange && (
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save password"}
          </Button>
        </form>

        {!isPasswordRecovery && (
          <p className="mt-4 text-center text-sm">
            <Link to="/admin" className="text-zinc-600 hover:text-zinc-900">
              Back to admin
            </Link>
          </p>
        )}
      </CardContent>
    </AdminAuthShell>
  );
}
