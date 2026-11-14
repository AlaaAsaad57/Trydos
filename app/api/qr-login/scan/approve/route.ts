import { NextRequest } from "next/server";
import { decide } from "../../device/decide";

// Direction A: this phone approves the browser it scanned.
export async function POST(request: NextRequest) {
  return decide(request, "approve", "web");
}
