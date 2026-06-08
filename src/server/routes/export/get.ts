import { parseQueryParam } from "../../middleware/parse-json.ts";
import { requireExportAuth } from "../../middleware/require-export-auth.ts";
import { exportFormatSchema } from "../../../shared/api/schemas.ts";
import { ApiError } from "../../lib/http.ts";
import { exportSessionData } from "../../services/export/export-session.ts";

export async function handleExport(req: Request): Promise<Response> {
  requireExportAuth(req);

  const url = new URL(req.url);
  const sessionId = parseQueryParam(url, "session_id");
  const formatRaw = parseQueryParam(url, "format", false) ?? "json";
  const parsedFormat = exportFormatSchema.safeParse(formatRaw);

  if (!parsedFormat.success) {
    throw new ApiError(400, "format must be csv or json");
  }

  return exportSessionData(sessionId!, parsedFormat.data);
}
