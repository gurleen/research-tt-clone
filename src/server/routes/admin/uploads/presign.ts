import { parseJsonBody } from "../../../middleware/parse-json.ts";
import { requireAdminAuth } from "../../../middleware/require-admin-auth.ts";
import { json } from "../../../lib/http.ts";
import { presignUploadBodySchema } from "../../../../shared/api/admin-schemas.ts";
import { presignUpload } from "../../../services/r2/presign-upload.ts";

export async function handlePresignUpload(req: Request): Promise<Response> {
  await requireAdminAuth(req);
  const body = await parseJsonBody(req, presignUploadBodySchema);
  const result = await presignUpload(body);
  return json(result);
}
