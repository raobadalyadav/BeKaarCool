/**
 * NextAuth configuration — delegates all credential checks and Google OAuth
 * to the NestJS backend. Mongo + bcrypt no longer live here.
 *
 * Flow:
 *   Credentials → POST loginWithEmail mutation → JWT/refresh stored in cookies
 *                 + NextAuth session populated for SessionProvider
 *   Google      → user clicks "sign in with Google" on the frontend, we redirect
 *                 to BACKEND/auth/google which finishes OAuth and 302's back to
 *                 WEB_URL with tokens in URL hash (handled by /auth/callback page)
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/lib/env";
import { gql, ApiError } from "@/lib/api/client";
import { setServerTokens } from "@/lib/api/tokens";
import type { AuthPayload } from "@/lib/api/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA code", type: "text" },
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        // Google OAuth bridge: token already verified by backend, fetch profile with it
        if (credentials?.accessToken) {
          try {
            const data = await gql<{
              me: {
                id: string;
                email: string;
                firstName?: string;
                lastName?: string;
                role: string;
                emailVerified: boolean;
              };
            }>({
              query: `query { me { id email firstName lastName role emailVerified } }`,
              token: credentials.accessToken,
            });
            const u = data.me;
            return {
              id: u.id,
              email: u.email,
              name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
              role: u.role,
              emailVerified: u.emailVerified,
            };
          } catch {
            return null;
          }
        }

        if (!credentials?.email || !credentials?.password) return null;
        try {
          const data = await gql<{ loginWithEmail: AuthPayload }>({
            query: `
              mutation Login($input: LoginInputDto!) {
                loginWithEmail(input: $input) {
                  accessToken refreshToken expiresIn
                  user { id email firstName lastName role emailVerified }
                }
              }
            `,
            variables: {
              input: {
                email: credentials.email,
                password: credentials.password,
                totpCode: credentials.totpCode || undefined,
              },
            },
            // No bearer token expected — anonymous mutation.
            token: null,
          });

          // Persist backend JWTs in HttpOnly cookies for server-side calls.
          await setServerTokens(data.loginWithEmail);

          const u = data.loginWithEmail.user;
          return {
            id: u.id,
            email: u.email,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
            role: u.role,
            emailVerified: u.emailVerified,
          };
        } catch (err) {
          if (err instanceof ApiError) {
            console.warn("Login failed:", err.message);
          } else {
            console.error("Login error:", err);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          emailVerified?: boolean;
        };
        if (u.id) token.id = u.id;
        if (u.role) token.role = u.role;
        if (u.emailVerified !== undefined) token.emailVerified = u.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { emailVerified?: boolean }).emailVerified =
          token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: env.NEXTAUTH_SECRET,
};
