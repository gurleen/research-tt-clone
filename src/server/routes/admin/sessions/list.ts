import { adminSessionListQuerySchema } from "../../../../shared/api/admin-schemas.ts";
import { ApiError, json } from "../../../lib/http.ts";
import { requireAdminAuth } from "../../../middleware/require-admin-auth.ts";
import { listSessions } from "../../../services/sessions/list-sessions.ts";

export async function handleAdminSessionList(req: Request): Promise<Response> {
  await requireAdminAuth(req);

  const url = new URL(req.url);
  const parsed = adminSessionListQuerySchema.safeParse({
    community: url.searchParams.get("community") || undefined,
    source_type: url.searchParams.get("source_type") || undefined,
    status: url.searchParams.get("status") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    offset: url.searchParams.get("offset") || undefined,
  });

  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten());
  }

  const result = await listSessions(parsed.data);
  return json(result);
}
