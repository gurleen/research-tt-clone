import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import type { ReactNode } from "react";

const authState = {
  client: null,
  session: null as { user: { email?: string; app_metadata?: Record<string, unknown> } } | null,
  isAdmin: false,
  isPasswordRecovery: false,
  loading: false,
  error: null as string | null,
  signIn: async () => {},
  signOut: async () => {},
  requestPasswordReset: async () => {},
  updatePassword: async () => {},
  changePassword: async () => {},
};

mock.module("../auth/AdminAuthProvider.tsx", () => ({
  useAdminAuth: () => authState,
  AdminAuthProvider: ({ children }: { children: ReactNode }) => children,
}));

const { LoginPage } = await import("./LoginPage.tsx");
const { ForgotPasswordPage } = await import("./ForgotPasswordPage.tsx");
const { UpdatePasswordPage } = await import("./UpdatePasswordPage.tsx");

function renderAt(path: string, page: ReactNode): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>,
  );
}

function resetAuth() {
  authState.client = null;
  authState.session = null;
  authState.isAdmin = false;
  authState.isPasswordRecovery = false;
  authState.loading = false;
  authState.error = null;
}

describe("admin auth pages", () => {
  test("login shows a forgot-password link", () => {
    resetAuth();
    const html = renderAt("/admin/login", <LoginPage />);
    expect(html).toContain("Researcher sign in");
    expect(html).toContain("Forgot password?");
    expect(html).toContain("/admin/forgot-password");
    expect(html).toContain("Sign in");
  });

  test("forgot-password shows the email form", () => {
    resetAuth();
    const html = renderAt("/admin/forgot-password", <ForgotPasswordPage />);
    expect(html).toContain("Reset password");
    expect(html).toContain("Send reset link");
    expect(html).toContain("Back to sign in");
    expect(html).toContain('type="email"');
  });

  test("update-password shows an expired-link state without a session", () => {
    resetAuth();
    const html = renderAt("/admin/update-password", <UpdatePasswordPage />);
    expect(html).toContain("Reset link expired");
    expect(html).toContain("Request a new reset link");
    expect(html).toContain("/admin/forgot-password");
    expect(html).not.toContain("Save password");
  });

  test("update-password recovery form omits the current-password field", () => {
    resetAuth();
    authState.session = { user: { email: "researcher@example.com" } };
    authState.isPasswordRecovery = true;
    const html = renderAt("/admin/update-password", <UpdatePasswordPage />);
    expect(html).toContain("Choose a new password");
    expect(html).toContain("New password");
    expect(html).toContain("Confirm new password");
    expect(html).toContain("Save password");
    expect(html).not.toContain("Current password");
  });

  test("signed-in change form asks for the current password", () => {
    resetAuth();
    authState.session = { user: { email: "researcher@example.com" } };
    authState.isAdmin = true;
    const html = renderAt("/admin/update-password", <UpdatePasswordPage />);
    expect(html).toContain("Change password");
    expect(html).toContain("Current password");
    expect(html).toContain("New password");
    expect(html).toContain("Back to admin");
  });
});
