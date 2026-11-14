import { NextRequest, NextResponse } from "next/server";

// TEMPORARY. Delete this route after the check.
//
// Cloudflare sits in front of the site. When "Add visitor location headers" is
// on, Cloudflare adds the visitor's city and region to every request it sends
// to the server. This route shows the caller their own values, so we can see
// whether the city arrives. QR login needs it for the approve screen.
//
// The route returns only the caller's own data, and nothing is stored.
export async function GET(request: NextRequest) {
  const h = request.headers;
  return NextResponse.json(
    {
      cf: {
        ip: h.get("cf-connecting-ip"),
        country: h.get("cf-ipcountry"),
        city: h.get("cf-ipcity"),
        region: h.get("cf-region"),
        continent: h.get("cf-ipcontinent"),
      },
      // For comparison only. Behind Cloudflare these describe a Cloudflare
      // server, not the visitor.
      vercel: {
        country: h.get("x-vercel-ip-country"),
        city: h.get("x-vercel-ip-city"),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
