import { NextRequest, NextResponse } from "next/server";
import {
  getCompatibility,
  getUnityCompatibility,
  type NativePlatform,
} from "@/lib/compatibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const platform = (request.nextUrl.searchParams.get("platform") ?? "ios").toLowerCase();
  if (platform !== "ios" && platform !== "android" && platform !== "unity") {
    return NextResponse.json(
      { error: "platform must be ios, android, or unity" },
      { status: 400 },
    );
  }

  try {
    const requestedSdk = request.nextUrl.searchParams.get("sdk") ?? undefined;
    const network = request.nextUrl.searchParams.get("network") ?? undefined;
    const data =
      platform === "unity"
        ? await getUnityCompatibility(requestedSdk, network)
        : await getCompatibility(platform as NativePlatform, requestedSdk, network);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        error: "Unable to read the AppHarbr compatibility config",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
