export class ApiClient {
  constructor({ baseUrl = "", fetchImpl = fetch, defaultHeaders = {} } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.defaultHeaders = defaultHeaders;
  }

  async request(path, options = {}) {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.defaultHeaders, ...(options.headers || {}) }
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof body === "object" && body?.error ? body.error : `HTTP ${response.status}`;
      throw new Error(message);
    }
    return body;
  }

  status() { return this.request("/api/status"); }
  command(command, metadata = {}) {
    return this.request("/api/command", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command, metadata })
    });
  }
}
