import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
      email?: string;
      emailVerified?: boolean;
      // Legacy fields kept for back-compat — populated separately if needed.
      avatar?: string;
      phone?: string;
      gender?: string;
      dob?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    email: string;
    emailVerified?: boolean;
    avatar?: string;
    phone?: string;
    gender?: string;
    dob?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    email?: string;
    emailVerified?: boolean;
  }
}
