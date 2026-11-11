// The data job. Vercel Cron visits /api/refresh on a schedule; this fetches
// every feed and, only if all of them succeed, replaces market.json.

import { revalidateTag } from "next/cache";
import { buildMarket } from "@/lib/feeds";
import { MARKET_TAG, readMarket, writeMarket } from "@/lib/market";

// Give the feeds up to a minute before Vercel cuts the job off.
export const maxDuration = 60;

/**
 * Vercel Cron sends "Authorization: Bearer <CRON_SECRET>", so strangers can't
 * trigger the job. On your own laptop (dev mode, no secret) it is left open.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const market = await buildMarket();
    await writeMarket(market);
    revalidateTag(MARKET_TAG, "max");
    return Response.json({
      ok: true,
      asOf: market.asOf,
      frontDays: market.front.length,
      curveMonths: market.curve.length,
      wtiSpotDays: market.wtiSpot.length,
      ovxDays: market.ovx.length,
      tbill3m: market.tbill3m,
    });
  } catch (err) {
    // A feed failed: write nothing, so the previous file stays in place.
    console.error("Refresh failed, keeping previous market.json:", err);
    const previous = await readMarket().catch(() => null);
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        keptAsOf: previous?.asOf ?? null,
      },
      { status: 502 },
    );
  }
}
