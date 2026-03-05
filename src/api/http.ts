export const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;

export function getApiBase(): string {
  return (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");
}

export async function fetchJson<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: HeadersInit; apiBase?: string },
): Promise<T> {
  const apiBase = init?.apiBase ?? getApiBase();
  const res = await fetch(`${apiBase}${path}`, init);

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      bodyText = "";
    }

    throw new Error(
      `Request failed: ${path} (HTTP ${res.status})${bodyText ? `\n${bodyText.slice(0, 500)}` : ""}`,
    );
  }

  if (!contentType.includes("application/json")) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      bodyText = "";
    }
    throw new Error(
      `Unexpected content-type for ${path}: ${contentType || "<empty>"}${bodyText ? `\n${bodyText.slice(0, 500)}` : ""}`,
    );
  }

  return res.json() as Promise<T>;
}
