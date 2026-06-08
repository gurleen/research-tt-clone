export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function errorToResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return json(
      {
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      error.status,
    );
  }

  console.error(error);
  return json({ error: "Internal server error" }, 500);
}

export function getRequestOrigin(req: Request): string {
  const host = req.headers.get("host");
  if (!host) {
    return "http://localhost";
  }
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
