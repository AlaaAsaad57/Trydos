"use server";

import { getAiRateLimits, type AiRateLimitsSnapshot } from "serverRequests/radis";

// DEBUG-only server action backing the "Show AI Rate Limits" modal. Returns the
// last Cerebras rate-limit snapshot (org-level) so a tester can SEE the live
// quota and tell a legitimate rate-limit from a bug. Read-only.
export interface AiRateLimitsResult {
  redis: boolean;
  snapshot: AiRateLimitsSnapshot | null;
}

export async function aiRateLimitsAction(): Promise<AiRateLimitsResult> {
  return getAiRateLimits();
}
