import { LogServerError } from "utils/serverErrorReporter";
import { RedisGet, RedisSet } from "./radis";

export const runtime = "nodejs";

export async function GetColorAndSizes() {
  try {
    let cachedRes = await RedisGet("colors-sizes");
    if (cachedRes) {
      return cachedRes;
    }
    let res = await fetch(
      process.env.NEXT_PUBLIC_GO_BACKEND_URL + "/web/get-colors-and-sizes",
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
