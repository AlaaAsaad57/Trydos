import { NextRequest } from "next/server";
import { decide } from "../../device/decide";

// Direction A: this phone denies the browser it scanned.
export async function POST(request: NextRequest) {
  return decide(request, "deny", "web");
}
