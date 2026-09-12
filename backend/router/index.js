export function jsonResponse(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-request-id"
    }
  });
}

export function routeKey(request) {
  const url = new URL(request.url);
  return `${request.method.toUpperCase()} ${url.pathname}`;
}

export function createRouter(routes) {
  return async (request, context) => {
    const handler = routes.get(routeKey(request));
    if (!handler) return null;
    return handler(request, context);
  };
}
