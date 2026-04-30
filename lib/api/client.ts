/**
 * Typed fetch + GraphQL client for the NestJS backend.
 *
 * Server components / route handlers: pass tokens explicitly (or rely on cookies()).
 * Client components: tokens are read from cookie via the /api/session bridge.
 *
 * On 401, attempts a single refresh-then-retry.
 */

import { API_URL, GRAPHQL_URL } from "./config";
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

async function refreshAccessTokenServer(): Promise<AuthTokens | null> {
  const refreshToken = await getServerRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(GRAPHQL_URL, {
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
  const url = `${API_URL}${opts.path}`;
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
  return (await res.json()) as T;
}

export async function rest<T>(opts: RequestOpts): Promise<T> {
  try {
    return await rawRequest<T>(opts);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && isServer) {
      const refreshed = await refreshAccessTokenServer();
      if (refreshed) {
        return await rawRequest<T>({ ...opts, token: refreshed.accessToken });
      }
      await clearServerTokens();
    }
    throw e;
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

    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: args.query, variables: args.variables }),
      cache: args.cache,
      next: args.next,
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

  try {
    return await exec(args.token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && isServer) {
      const refreshed = await refreshAccessTokenServer();
      if (refreshed) {
        return await exec(refreshed.accessToken);
      }
      await clearServerTokens();
    }
    throw e;
  }
}

/** Helper for client components to talk to the backend via the /api proxy. */
export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
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
  return (await res.json()) as T;
}
