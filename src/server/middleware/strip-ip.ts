/** Remove client IP headers before any handler reads the request. */
const IP_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-client-ip",
  "forwarded",
] as const;

export function stripIpHeaders(req: Request): Request {
  const headers = new Headers(req.headers);
  for (const name of IP_HEADERS) {
    headers.delete(name);
  }

  if (headers === req.headers) {
    return req;
  }

  return new Request(req.url, {
    method: req.method,
    headers,
    body: req.body,
    duplex: "half",
  } as RequestInit);
}
