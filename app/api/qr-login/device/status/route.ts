import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { callInventory, errorReply, isRequestId } from "utils/server/qrLogin";

// Direction B: the signed-in web asks every 2 seconds whether a phone claimed
// the QR. The backend checks that this user created the session.
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("id");
  if (!isRequestId(requestId)) return errorReply(400);

  const result = await callInventory({
    path: QR_LOGIN_ENDPOINTS.appStatus(requestId),
    method: "GET",
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  const data = result.data;
  if (typeof data?.status !== "string") return errorReply(502);
  return NextResponse.json({
    status: data.status,
    deviceName: typeof data.device_name === "string" ? data.device_name : null,
    platform: typeof data.platform === "string" ? data.platform : null,
  });
}
