import { toServiceToken } from "utils/serviceTokens";

/**
 * The /api/proxy GET address for one backend call.
 *
 * The proxy normally takes its instructions in `x-proxy-*` headers, and a POST
 * carries them fine. A `<link rel="preload">` cannot: it issues a plain GET with
 * no custom header. So the same values travel in the query string instead, and
 * the browser can start the request while it is still parsing the document
 * rather than after hydration.
 *
 * Both the preload hint and the real fetch must build the address HERE. If the
 * two strings differ by one character the browser treats them as two different
 * requests: the page pays for both, and the console warns that the preload was
 * never used.
 *
 * The service value is the opaque wire token, the same one the header contract
 * uses — the browser never names the backend service it is addressing.
 *
 * CLOUDFLARE PROXY WORKER: the Worker has to read these same parameter names.
 * See the block comment on GET in app/api/proxy/route.ts.
 */
export function buildProxyGetUrl({
  server,
  url,
  country,
  language,
  sellerId,
}: {
  server: string;
  url: string;
  country: string;
  language: string;
  sellerId?: string;
}): string {
  const query = new URLSearchParams({
    s: toServiceToken(server),
    u: url,
    c: country,
    l: language,
  });
  if (sellerId) query.set("sid", sellerId);
  return `/api/proxy?${query.toString()}`;
}

// No `d=true` here, and that is deliberate.
//
// The header contract sends the target through encodeURI() and asks the proxy
// to decodeURI() it back. A query string already does that for us:
// URLSearchParams escapes the value on the way out and the proxy's own
// searchParams.get() unescapes it on the way in, so the target arrives exactly
// as it was written. Asking for a second decode would corrupt any target that
// legitimately contains a percent sign.
