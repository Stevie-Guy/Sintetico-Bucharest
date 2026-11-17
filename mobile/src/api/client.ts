/**
 * Client HTTP minimal pentru API-ul Sintetico.
 * Erorile din backend au forma { error: { code, message, fields? } } și devin `ApiError`.
 */

import { resolveApiUrl } from "./api-url";

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Token-ul de sesiune; se trimite ca `Authorization: Bearer <token>`. */
  token?: string | null;
}

export async function apiRequest<T>(path: string, { method = "GET", body, token }: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "CONFIG_ERROR", "Nu se poate afla adresa serverului. Setează EXPO_PUBLIC_API_URL în mobile/.env.");
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Nu ne-am putut conecta la server. Verifică conexiunea la internet.");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "A apărut o eroare neașteptată.",
      error?.fields ?? {},
    );
  }

  return data as T;
}
