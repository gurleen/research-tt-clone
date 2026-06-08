import type { ZodType } from "zod";
import { ApiError } from "../lib/http.ts";

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseQueryParam(
  url: URL,
  name: string,
  required = true,
): string | null {
  const value = url.searchParams.get(name);
  if (!value && required) {
    throw new ApiError(400, `Missing query parameter: ${name}`);
  }
  return value;
}
