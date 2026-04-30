import { NextResponse } from "next/server";
import * as usersApi from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

export async function GET() {
  try {
    return NextResponse.json(await usersApi.myAddresses());
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Parameters<
      typeof usersApi.createAddress
    >[0];
    return NextResponse.json(await usersApi.createAddress(body));
  } catch (e) {
    return err(e);
  }
}

function err(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
