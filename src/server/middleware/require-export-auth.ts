import { env } from "../config/env.ts";
import { ApiError } from "../lib/http.ts";

export function requireExportAuth(req: Request): void {
  if (!env.exportApiKey) {
    throw new ApiError(503, "Export is not configured");
  }

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid authorization");
  }

  const token = header.slice("Bearer ".length);
  if (token !== env.exportApiKey) {
    throw new ApiError(401, "Missing or invalid authorization");
  }
}
