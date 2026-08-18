// The live harness, in one import.
//
// A live test file should need nothing from inside this folder directly:
//
//   import { CookieJar, hasBackends, proxyJson, registerGuest } from "./harness";
//
// What is here, and which phase owns it:
//
//   phase 1 (this ticket) — the server, the jar, the browser shim, the target
//   guard, redaction, and the guest session.
//   phase 3 — `withSession()` and the forced-expiry helper join this barrel.
//   phase 4 — the run marker and the teardown registry join it too.

export {
  BACKEND_ADDRESS_KEYS,
  LIVE_HOST,
  LIVE_ORIGIN,
  LIVE_PORT,
  envValue,
  hasAdmin,
  hasBackends,
  hasFleet,
  hasShopperA,
  hasShopperB,
  loadLiveEnv,
} from "./env";

export { ALLOWED_HOSTS, assertStagingTarget, type TargetReport } from "./guard";

export { containsSecret, redact } from "./redact";

export { CookieJar, jarFetch, useJarFetch } from "./cookieJar";

export {
  DEFAULT_LOCALE_PATH,
  installBrowserShim,
  type BrowserShim,
} from "./browser";

export {
  proxyJson,
  proxyRequest,
  type ProxyCall,
  type ProxyService,
} from "./proxy";

export { registerGuest, type GuestRegistration } from "./guest";
