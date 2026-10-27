import { NextRequest, NextResponse } from "next/server";
import { getCompatibility, type Platform } from "@/lib/compatibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const platform = (request.nextUrl.searchParams.get("platform") ?? "ios").toLowerCase();
  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json(
      { error: "platform must be ios or android" },
      { status: 400 },
    );
  }

  try {
    const data = await getCompatibility(
      platform as Platform,
      request.nextUrl.searchParams.get("sdk") ?? undefined,
      request.nextUrl.searchParams.get("network") ?? undefined,
    );
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to read the AppHarbr compatibility config",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
