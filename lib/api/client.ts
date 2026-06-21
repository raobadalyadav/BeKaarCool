/**
 * Typed fetch + GraphQL client for the NestJS backend.
 *
 * - On the server: calls backend directly at API_URL, attaches Authorization
 *   header from HttpOnly cookies, retries once on 401 via refresh token.
 * - On the browser: calls a same-origin `/bff/*` Next.js rewrite that forwards
 *   to the backend. Browser sends bf_access cookie automatically (same-origin),
 *   the rewrite preserves it as a Cookie header, and the backend's JWT strategy
 *   extracts the access token from the cookie.
 */

import { API_URL } from "./config";
import {
  getServerAccessToken,
  getServerRefreshToken,
  setServerTokens,
  clearServerTokens,
  type AuthTokens,
} from "./tokens";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOpts {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Absolute path starting with /. */
  path: string;
  /** Override token; otherwise pulled from cookies on the server. */
  token?: string | null;
  /** For Next.js fetch revalidation. */
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
}

const isServer = typeof window === "undefined";

const restBase = () => (isServer ? API_URL : "/bff");
const gqlUrl = () => (isServer ? `${API_URL}/graphql` : "/bff/graphql");

async function refreshAccessTokenServer(): Promise<AuthTokens | null> {
  const refreshToken = await getServerRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `mutation Refresh($t: String!) {
        refreshTokens(refreshToken: $t) {
          accessToken refreshToken expiresIn
        }
      }`,
      variables: { t: refreshToken },
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { refreshTokens: AuthTokens } };
  if (!json.data?.refreshTokens) return null;
  await setServerTokens(json.data.refreshTokens);
  return json.data.refreshTokens;
}

async function rawRequest<T>(opts: RequestOpts): Promise<T> {
  const url = `${restBase()}${opts.path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    ...opts.headers,
  };
  if (opts.token) {
    headers.authorization = `Bearer ${opts.token}`;
  } else if (isServer && opts.token === undefined) {
    const t = await getServerAccessToken();
    if (t) headers.authorization = `Bearer ${t}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
    next: opts.next,
    credentials: isServer ? undefined : "same-origin",
  });

  if (!res.ok) {
    let errBody: unknown = undefined;
    try {
      errBody = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(
      (errBody as { message?: string } | undefined)?.message ?? res.statusText,
      res.status,
      undefined,
      errBody
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function rest<T>(opts: RequestOpts): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await rawRequest<T>(opts);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        if (isServer) {
          const refreshed = await refreshAccessTokenServer();
          if (refreshed) {
            return await rawRequest<T>({ ...opts, token: refreshed.accessToken });
          }
          await clearServerTokens();
        } else {
          const refreshRes = await fetch("/api/auth/refresh-tokens", { method: "POST" });
          if (refreshRes.ok) {
            return await rawRequest<T>(opts);
          }
        }
        throw e;
      }

      if (
        attempt < 2 &&
        e instanceof ApiError &&
        (e.status === 429 || e.status === 500 || e.status === 503)
      ) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        attempt++;
        continue;
      }

      throw e;
    }
  }
}

interface GqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string }; path?: (string | number)[] }>;
}

export async function gql<T>(args: {
  query: string;
  variables?: Record<string, unknown>;
  token?: string | null;
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
}): Promise<T> {
  const exec = async (token: string | null | undefined): Promise<T> => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    if (token) headers.authorization = `Bearer ${token}`;
    else if (isServer && token === undefined) {
      const t = await getServerAccessToken();
      if (t) headers.authorization = `Bearer ${t}`;
    }

    const res = await fetch(gqlUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({ query: args.query, variables: args.variables }),
      cache: args.cache,
      next: args.next,
      credentials: isServer ? undefined : "same-origin",
    });

    if (!res.ok) {
      throw new ApiError(`GraphQL HTTP ${res.status}`, res.status);
    }
    const json = (await res.json()) as GqlResponse<T>;
    if (json.errors?.length) {
      const first = json.errors[0]!;
      const code = first.extensions?.code;
      const status =
        code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
      throw new ApiError(first.message, status, code, json.errors);
    }
    if (json.data === undefined) {
      throw new ApiError("Empty GraphQL data", 500);
    }
    return json.data;
  };

  const isThrottled = (e: unknown) =>
    e instanceof ApiError &&
    (e.status === 429 ||
      (e.message?.includes("ThrottlerException") ||
        e.message?.includes("Too Many Requests")));

  const isTransient = (e: unknown) =>
    e instanceof ApiError && (e.status === 500 || e.status === 503);

  let attempt = 0;
  while (true) {
    try {
      return await exec(args.token);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        if (isServer) {
          const refreshed = await refreshAccessTokenServer();
          if (refreshed) {
            return await exec(refreshed.accessToken);
          }
          await clearServerTokens();
        } else {
          const refreshRes = await fetch("/api/auth/refresh-tokens", { method: "POST" });
          if (refreshRes.ok) {
            return await exec(args.token);
          }
        }
        throw e;
      }

      // Retry throttled or transient 500 errors (max 2 retries, backoff 1s/2s)
      if (attempt < 2 && (isThrottled(e) || isTransient(e))) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        attempt++;
        continue;
      }

      throw e;
    }
  }
}

/**
 * Browser-side helper: thin wrapper over fetch() that decodes JSON and throws
 * ApiError on non-2xx responses. Pass a backend path (e.g. "/cart") and it
 * goes via the same-origin `/bff/*` rewrite. For absolute URLs (or our own
 * Next.js routes like `/api/auth/...`), passes through unchanged.
 */
export async function clientFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url =
    path.startsWith("http") || path.startsWith("/api/") || path.startsWith("/bff/")
      ? path
      : `/bff${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(
      (errBody as { message?: string } | undefined)?.message ?? res.statusText,
      res.status,
      undefined,
      errBody
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Run a GraphQL query/mutation from the browser via the same-origin BFF.
 * Auth flows automatically via the bf_access HttpOnly cookie that browsers
 * attach to same-origin requests.
 */
export async function gqlClient<T>(args: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const res = await fetch("/bff/graphql", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ query: args.query, variables: args.variables }),
  });
  if (!res.ok) throw new ApiError(`GraphQL HTTP ${res.status}`, res.status);
  const json = (await res.json()) as GqlResponse<T>;
  if (json.errors?.length) {
    const first = json.errors[0]!;
    const code = first.extensions?.code;
    const status =
      code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : 400;
    throw new ApiError(first.message, status, code, json.errors);
  }
  if (json.data === undefined) throw new ApiError("Empty GraphQL data", 500);
  return json.data;
}
