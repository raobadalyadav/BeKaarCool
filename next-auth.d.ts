// types/next-auth.d.ts or next.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role?: string
      email?:string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role?: string
    email:string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    email:string
  }
}
