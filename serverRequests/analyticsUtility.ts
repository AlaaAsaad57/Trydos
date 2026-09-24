import { LogServerError } from "utils/serverErrorReporter";
// NOT a "use server" module — reach the user-aware market base through the
// "use server" wrapper in ./products so tokenManager's next/headers can never
// enter a client bundle graph via this file.
import { resolveMarketFetchBase } from "./products";
import { RedisGet, RedisSet } from "./radis";

/** How long the colours-and-sizes read gets before it is given up on.
 *
 *  Shorter than the 15 s `fetchServerData` allows, on purpose: this answer only
 *  sharpens a search query, so waiting for it is worth far less than answering
 *  the search. Its caller (the search analyser) has a 6 s ceiling of its own, so
 *  a longer value here would never be reached. */
const COLORS_AND_SIZES_TIMEOUT_MS = 4000;

export async function GetColorAndSizes() {
  try {
    let cachedRes = await RedisGet("colors-sizes");
    if (cachedRes) {
      return cachedRes;
    }
    let res = await fetch(
      // Verified users → the core backend, guests → the gateway (user-based
      // routing)
      (await resolveMarketFetchBase()) + "/web/get-colors-and-sizes",
      {
        next: {
          revalidate: 0,
        },
        // A bare fetch waits for ever. This one sits on the search path, before
        // anything the route logs, so a hung backend here showed up as a search
        // that simply never answered. Every other backend call the route makes
        // goes through fetchServerData, which caps at 15 s; this one does not,
        // so it carries its own ceiling. The catch below already turns a failure
        // into empty colours and sizes, which only costs the query its colour
        // and size hints.
        signal: AbortSignal.timeout(COLORS_AND_SIZES_TIMEOUT_MS),
      },
    );
    let data = await res.json();
    let ReturnedObj = {
      colors: data?.data?.colors?.map((s) => s.code)?.join(", "),
      sizes: data?.data?.sizes?.join(", "),
      redis: false,
    };
    await RedisSet("colors-sizes", { ...ReturnedObj, redis: true });
    return { ...ReturnedObj, redis: false };
  } catch (error) {
    LogServerError({
      error: error,
      scenario: "getting color and sizes for analyzing search",
    });
    return {
      colors: "",
      sizes: "",
      error: error,
    };
  }
}
