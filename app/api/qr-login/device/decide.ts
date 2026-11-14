import { NextRequest, NextResponse } from "next/server";
import { QR_LOGIN_ENDPOINTS } from "utils/fetch/Endpoints";
import { callInventory, errorReply, readRequestId } from "utils/server/qrLogin";

/** Direction B: the signed-in web approves or denies the phone that claimed the QR. */
export async function decide(request: NextRequest, answer: "approve" | "deny") {
  const requestId = await readRequestId(request);
  if (!requestId) return errorReply(400);

  const result = await callInventory({
    path:
      answer === "approve"
        ? QR_LOGIN_ENDPOINTS.appApprove(requestId)
        : QR_LOGIN_ENDPOINTS.appDeny(requestId),
    method: "POST",
    request,
  });
  if (result.status !== 200) return errorReply(result.status);
  return NextResponse.json({
    status: result.data?.status || (answer === "approve" ? "approved" : "denied"),
  });
}
