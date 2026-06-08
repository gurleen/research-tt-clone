export function isAdminAppMetadata(
  appMetadata: Record<string, unknown> | undefined,
): boolean {
  return appMetadata?.role === "admin";
}
