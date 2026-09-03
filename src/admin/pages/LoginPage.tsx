import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import {
  FORGOT_PASSWORD_PATH,
  UPDATE_PASSWORD_PATH,
} from "../auth/password.ts";
import { AdminAuthShell } from "../components/AdminAuthShell.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";

export function LoginPage() {
  const {
    signIn,
    session,
    isAdmin,
    isPasswordRecovery,
    loading,
    error: initError,
  } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/admin";

  if (!loading && isPasswordRecovery) {
    return <Navigate to={UPDATE_PASSWORD_PATH} replace />;
  }

  if (!loading && session && isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell>
      <CardHeader>
        <CardTitle>Researcher sign in</CardTitle>
      </CardHeader>
      <CardContent>
        {(initError || error) && (
          <Alert variant="destructive" className="mb-4">
            {error ?? initError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || loading}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-3 text-center text-sm">
          <Link
            to={FORGOT_PASSWORD_PATH}
            className="text-zinc-600 hover:text-zinc-900"
          >
            Forgot password?
          </Link>
        </p>

        <p className="mt-4 text-xs text-zinc-500">
          Access requires Supabase app metadata{" "}
          <code className="rounded bg-zinc-100 px-1">{"{ \"role\": \"admin\" }"}</code>.
        </p>
      </CardContent>
    </AdminAuthShell>
  );
}
