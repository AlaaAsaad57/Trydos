// Shared /api/auth/me fetch with in-flight dedupe. On first load both
// HomeService.CheckLogin (Init) and useUserData (navbar) need this data at the
// same moment; without dedupe the same POST fires twice. No TTL cache on
// purpose — concurrent callers share one response, later callers (e.g. after
// logout clears the store) always refetch.
export type AuthMeResponse = {
  user: any;
  chatUser: any;
  storiesUser: any;
  walletUser: any;
  hasDeviceToken: boolean;
  hasMarketToken: boolean;
} | null;

let inflight: Promise<AuthMeResponse> | null = null;

export function fetchAuthMe(): Promise<AuthMeResponse> {
  if (inflight) return inflight;
  inflight = fetch("/api/auth/me", { credentials: "include", method: "POST" })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
