import { stripIpHeaders } from "./middleware/strip-ip.ts";
import { ApiError, errorToResponse } from "./lib/http.ts";
import { handleCreateSession } from "./routes/sessions/create.ts";
import { handleGetSession } from "./routes/sessions/get.ts";
import { handlePatchPosition } from "./routes/sessions/patch-position.ts";
import { handleGetStub } from "./routes/sessions/stub.ts";
import { handleSurveyCompleteRoute } from "./routes/sessions/survey-complete.ts";
import { handleIngestEvent } from "./routes/events/ingest.ts";
import { handleGetDebrief } from "./routes/debrief/get.ts";
import { handleExport } from "./routes/export/get.ts";
import { handleAdminConfig } from "./routes/admin/config.ts";
import { handlePresignUpload } from "./routes/admin/uploads/presign.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleApiRequest(req: Request): Promise<Response> {
  const sanitized = stripIpHeaders(req);

  try {
    return await routeRequest(sanitized);
  } catch (error) {
    return errorToResponse(error);
  }
}

async function routeRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method.toUpperCase();

  if (method === "POST" && pathname === "/api/sessions") {
    return handleCreateSession(req);
  }

  if (method === "POST" && pathname === "/api/events") {
    return handleIngestEvent(req);
  }

  if (method === "GET" && pathname === "/api/debrief") {
    return handleGetDebrief(req);
  }

  if (method === "GET" && pathname === "/api/export") {
    return handleExport(req);
  }

  if (method === "GET" && pathname === "/api/admin/config") {
    return handleAdminConfig();
  }

  if (method === "POST" && pathname === "/api/admin/uploads/presign") {
    return handlePresignUpload(req);
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)(\/.*)?$/);
  if (sessionMatch) {
    const sessionId = sessionMatch[1]!;
    const suffix = sessionMatch[2] ?? "";

    if (!UUID_PATTERN.test(sessionId)) {
      throw new ApiError(400, "Invalid session_id");
    }

    if (method === "GET" && suffix === "") {
      return handleGetSession(sessionId);
    }

    if (method === "PATCH" && suffix === "/position") {
      return handlePatchPosition(sessionId, req);
    }

    if (method === "POST" && suffix === "/survey-complete") {
      return handleSurveyCompleteRoute(sessionId, req);
    }

    const stubMatch = suffix.match(/^\/videos\/([^/]+)\/stub$/);
    if (method === "GET" && stubMatch) {
      return handleGetStub(sessionId, stubMatch[1]!);
    }
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
