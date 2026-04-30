import { NextResponse } from "next/server";
import { registerWithEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      name?: string;
    };
    // Backwards-compat: allow `name` to map to firstName.
    const firstName =
      body.firstName ?? (body.name ? body.name.split(" ")[0] : undefined);
    const lastName =
      body.lastName ??
      (body.name ? body.name.split(" ").slice(1).join(" ") || undefined : undefined);

    const r = await registerWithEmail({
      email: body.email,
      password: body.password,
      firstName,
      lastName,
    });
    return NextResponse.json({ user: r.user, success: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
