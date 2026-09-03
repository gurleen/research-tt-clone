export const MIN_PASSWORD_LENGTH = 8;
export const FORGOT_PASSWORD_PATH = "/admin/forgot-password";
export const UPDATE_PASSWORD_PATH = "/admin/update-password";
export const PASSWORD_RECOVERY_STORAGE_KEY = "admin-password-recovery";

export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

export function readPasswordRecoveryFlag(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "1";
}

export function writePasswordRecoveryFlag(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "1");
  } else {
    sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
  }
}
