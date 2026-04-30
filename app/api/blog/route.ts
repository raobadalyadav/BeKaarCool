import { NextResponse } from "next/server";
import * as contentApi from "@/lib/api/content";

export async function GET() {
  try {
    return NextResponse.json(await contentApi.blogPosts());
  } catch {
    return NextResponse.json([]);
  }
}
