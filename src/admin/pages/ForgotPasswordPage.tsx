import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { UPDATE_PASSWORD_PATH } from "../auth/password.ts";
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

export function ForgotPasswordPage() {
  const {
    requestPasswordReset,
    session,
    isAdmin,
    isPasswordRecovery,
    loading,
    error: initError,
  } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isPasswordRecovery) {
    return <Navigate to={UPDATE_PASSWORD_PATH} replace />;
  }

  if (!loading && session && isAdmin) {
    return <Navigate to={UPDATE_PASSWORD_PATH} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Enter the email for your researcher account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(initError || error) && (
          <Alert variant="destructive" className="mb-4">
            {error ?? initError}
          </Alert>
        )}

        {submitted ? (
          <Alert className="mb-4">
            If that email is registered, we sent a reset link.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link
            to="/admin/login"
            className="text-zinc-600 hover:text-zinc-900"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </AdminAuthShell>
  );
}
