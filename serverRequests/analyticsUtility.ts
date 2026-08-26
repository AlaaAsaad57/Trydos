import { LogServerError } from "utils/serverErrorReporter";
// NOT a "use server" module — reach the user-aware market base through the
// "use server" wrapper in ./products so tokenManager's next/headers can never
// enter a client bundle graph via this file.
import { resolveMarketFetchBase } from "./products";
import { RedisGet, RedisSet } from "./radis";

export async function GetColorAndSizes() {
  try {
    let cachedRes = await RedisGet("colors-sizes");
    if (cachedRes) {
      return cachedRes;
    }
    let res = await fetch(
      // Verified users → Laravel, guests → Go (user-based routing)
      (await resolveMarketFetchBase()) + "/web/get-colors-and-sizes",
      {
        next: {
          revalidate: 0,
        },
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
