"use server";

import { resolveOtpIdentity } from "utils/server/otpIdentity";
import { getOtpStats, type OtpStats } from "serverRequests/radis";

// DEBUG-only server action backing the "Show OTP Statics" modal. Resolves the
// SAME sid/ip identity the send-OTP flow uses, then returns a read-only Redis
// snapshot so a tester can verify the per-session / per-IP counters live.
export interface OtpStatsResult extends OtpStats {
  identity: {
    rawIp: string;
    normalizedIp: string;
    sid: string;
    ip: string;
    userId: string | null;
    hasUserId: boolean;
    hasMarketToken: boolean;
    hasDeviceToken: boolean;
  };
}

export async function otpStatsAction(): Promise<OtpStatsResult> {
  const id = await resolveOtpIdentity();
  const stats = await getOtpStats(id.sid, id.ip);
  return {
    ...stats,
    identity: {
      rawIp: id.rawIp,
      normalizedIp: id.normalizedIp,
      sid: id.sid,
      ip: id.ip,
      userId: id.userId,
      hasUserId: id.hasUserId,
      hasMarketToken: id.hasMarketToken,
      hasDeviceToken: id.hasDeviceToken,
    },
  };
}
