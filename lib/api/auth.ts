/**
 * Auth flows against the NestJS backend's GraphQL API.
 * Server-only — sets cookies via tokens.ts helpers.
 */

import "server-only";
import { gql } from "./client";
import { setServerTokens, clearServerTokens } from "./tokens";

export interface BackendUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  emailVerified: boolean;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: BackendUser;
}

const AUTH_USER_FIELDS = `
  id email firstName lastName role emailVerified
`;

export async function registerWithEmail(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthPayload> {
  const data = await gql<{ registerWithEmail: AuthPayload }>({
    query: `
      mutation Register($input: RegisterInputDto!) {
        registerWithEmail(input: $input) {
          accessToken refreshToken expiresIn
          user { ${AUTH_USER_FIELDS} }
        }
      }
    `,
    variables: { input },
  });
  await setServerTokens(data.registerWithEmail);
  return data.registerWithEmail;
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
  totpCode?: string;
}): Promise<AuthPayload> {
  const data = await gql<{ loginWithEmail: AuthPayload }>({
    query: `
      mutation Login($input: LoginInputDto!) {
        loginWithEmail(input: $input) {
          accessToken refreshToken expiresIn
          user { ${AUTH_USER_FIELDS} }
        }
      }
    `,
    variables: { input },
  });
  await setServerTokens(data.loginWithEmail);
  return data.loginWithEmail;
}

export async function logout(): Promise<void> {
  try {
    await gql({
      query: `mutation { logout }`,
    });
  } catch {
    /* ignore */
  } finally {
    await clearServerTokens();
  }
}

export async function me(): Promise<BackendUser | null> {
  try {
    const data = await gql<{ me: BackendUser }>({
      query: `query { me { ${AUTH_USER_FIELDS} } }`,
      cache: "no-store",
    });
    return data.me;
  } catch {
    return null;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await gql({
    query: `mutation Req($email: String!) { requestPasswordReset(email: $email) }`,
    variables: { email },
  });
}

export async function resetPassword(args: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await gql({
    query: `mutation Reset($input: ResetPasswordInputDto!) { resetPassword(input: $input) }`,
    variables: { input: args },
  });
}

export async function verifyEmail(token: string): Promise<void> {
  await gql({
    query: `mutation Verify($token: String!) { verifyEmail(token: $token) }`,
    variables: { token },
  });
}
