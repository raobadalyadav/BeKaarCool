import { NextResponse } from "next/server";

/**
 * Support ticketing isn't in the new backend yet. Stubbed as a no-op until
 * a dedicated SupportModule lands. Existing UI keeps working.
 */
export async function GET() {
  return NextResponse.json({ tickets: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    ticket: {
      id: "stub",
      status: "received",
      message: "We have received your request and will be in touch soon.",
    },
  });
}
