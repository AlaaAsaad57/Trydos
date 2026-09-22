// Is staging actually serving?
//
// The target guard (`guard.ts`) answers "is this address staging?". This file
// answers the other question, and they are not the same: an address can be
// perfectly correct and the box behind it still be down.
//
// ---------------------------------------------------------------------------
// Why this exists
//
// A run on 2026-08-18 failed all four journeys on `getByTestId('NavLogo')` — the
// storefront logo, which is in the layout and therefore on every page. It looked
// like a timeout. It was not. The staging Elasticsearch node had restarted
// mid-run, and the server log tells the whole story in three lines:
//
//     authentication_processing_error                     ← booting
//     security_exception: unable to authenticate user     ← booting
//     ConnectionError: connect ECONNREFUSED …:9200        ← gone
//
// The home page renders its sections from Elasticsearch and there is no
// `error.tsx` under `app/(client)/`, so a throw in any of them goes all the way
// to `app/global-error.tsx`, which replaces the entire document — navigation
// bar included. Hence "element(s) not found" rather than a slow page.
//
// So the failure said "the backend is down" and the check said "the code broke".
// That is the specific dishonesty this file fixes.
//
// ---------------------------------------------------------------------------
// Why it is two checks now, not one
//
// The Elasticsearch-only probe was not enough, and CI run 35592830847 is the
// proof. Elasticsearch answered that run perfectly — its aggregation replies are
// in the job log — while the **gateway** did not: the server log repeats
// `Attempt 1 failed due to network error, retrying…` from
// `serverRequests/ServerFetch.tsx`, and the render ends in
// `Error: Currency not found for country: iq`. Thirty of the fifty-four solo
// cases failed, most of them inside the country picker, whose list is a gateway
// call that never answered. The re-check said "up", so the workflow called a
// backend outage a code failure.
//
// So both are asked now:
//
//   * **Elasticsearch** — the backend whose absence blanks the whole document.
//   * **The gateway** — asked with the app's own boot call,
//     `/web/home/startingSettings`. That one answer is what gives the storefront
//     its currency, its shipping settings and its country list. When it does not
//     come, the page renders without a currency and the picker never draws a
//     country to choose.
//
//   * **The core backend** -- asked with the *same* boot call. This used to be
//     left out, on the belief that "every endpoint on it wants a verified
//     shopper's token". That is not true of this one: measured on 2026-09-22,
//     `GET <core>/web/home/startingSettings` answers **200 with no token at
//     all**, exactly as the gateway does.
//
//     Leaving it out cost a run. On 2026-09-22 at 08:02 (run 35702622335) this
//     probe passed, the lane ran, and the core backend answered **520** --
//     Cloudflare for "the origin sent something I could not parse" -- to
//     `/cart/add`. Nine cases went red, and the verdict called it a code
//     failure, because nothing had asked the box that was actually ill. The
//     same shape came back at 13:15 as a **522** on the checklist read.
//
// ---------------------------------------------------------------------------
// The two rules this file will not break
//
// **Unset means skip, never fail.** A machine with nothing configured gets `up`,
// not `down`. That is what lets a fork run `pnpm test:e2e` and get an honest,
// fast "skipped".
//
// **One blip must never skip a whole run.** `preflight` uses this answer to
// decide whether to build and run at all, so a probe that says "down" when the
// backend is fine costs an entire run and reports a green tick for having tested
// nothing. Every check is therefore tried **twice**, two seconds apart, and only
// a second failure counts. That is also why a 4xx from the gateway is not
// "down": a box that refuses a request is a box that is serving.

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { envValue, loadLiveEnv } from "./env";

// Matches the app's own client (`services/elastic/elasticsearch.config.ts`),
// deliberately. A probe that waits longer than the app does would report healthy
// for a node the app has already given up on.
const PROBE_TIMEOUT_MS = 8_000;

/** How long to leave between the first failure and the retry.
 *
 *  Short on purpose. This is here to ride out one dropped packet or one
 *  connection refused during a restart, not to wait out an outage. */
const RETRY_PAUSE_MS = 2_000;

// The cheapest endpoint that needs both a live node and working credentials. Not
// `/`, which some proxies answer without ever reaching Elasticsearch.
const PROBE_PATH = "/_cluster/health";

/** The gateway call the storefront itself makes before it can draw anything.
 *
 *  `services/home.ts` and `components/settings/PersonalInfoCountries.tsx` both
 *  depend on this answer — the first for the currency, the second for the list
 *  of countries the picker offers. */
// The storefront's own boot call, and the one path both backends answer
// without a credential. Asking each of them the same question is deliberate:
// two different probes would mean two different meanings of "up".
const BOOT_PROBE_PATH = "/web/home/startingSettings?language=en";

export type HealthReport = {
  /** Ready to test against. True when nothing is configured to check. */
  up: boolean;
  /** Why it is not, ready to print. Empty when `up`. */
  reason: string;
  /** Nothing was configured, so nothing was checked. */
  skipped: boolean;
  /** How long each check took, ready to print: `gateway 341ms, core backend
   *  402ms`. Empty when nothing was asked.
   *
   *  **This is the number a green health line was missing.** On 2026-09-22 at
   *  19:23 (run 35772140821) staging started answering, but slowly: 23 live
   *  cases failed on `page.goto: Timeout 45000ms` because the storefront could
   *  not render, and this probe said "passed" both before and after, because
   *  every box did answer. "Up" and "fast enough to serve a page" are not the
   *  same question, and a run that prints only the first cannot tell anyone
   *  which one it lost. */
  timings: string;
};

/** What one check decided. `detail` is always printable — a host and a status,
 *  never a token and never a response body. */
type CheckResult = {
  ok: boolean;
  detail: string;
  /** What to call this box in the timing line. */
  label: string;
  /** Milliseconds the check took, round trip. */
  ms: number;
};

/** One GET, resolving to the status code, rejecting on a transport failure. */
const statusOf = (url: URL, auth: string): Promise<number> =>
  new Promise((resolvePromise, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;

    const req = send(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: PROBE_PATH,
        method: "GET",
        headers: auth ? { authorization: auth } : {},
        // The staging node serves a self-signed certificate. The app's client
        // sets `rejectUnauthorized: false` for the same reason, and a probe that
        // is stricter than the app would report a node down that the app talks
        // to happily. Ignored for plain http.
        rejectUnauthorized: false,
        timeout: PROBE_TIMEOUT_MS,
      },
      (res) => {
        // Drained rather than read: the status is the whole answer, and an
        // undrained response holds the socket open.
        res.resume();
        resolvePromise(res.statusCode ?? 0);
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error(`no answer in ${PROBE_TIMEOUT_MS / 1000}s`));
    });
    req.on("error", reject);
    req.end();
  });

/** The code (`ECONNREFUSED`, `ETIMEDOUT`, `EAI_AGAIN`) is what tells a
 *  restarting box apart from a firewall, so prefer it over the message.
 *
 *  `fetch` hides it one level down: its own message is the useless
 *  `fetch failed` and the code sits on `error.cause`. Read that first, or every
 *  gateway outage reports the same three words whatever caused it. */
const failureDetail = (error: unknown): string => {
  const cause = (error as { cause?: NodeJS.ErrnoException })?.cause;
  return (
    cause?.code ??
    (error as NodeJS.ErrnoException)?.code ??
    (error as Error)?.message ??
    "unknown error"
  );
};

/** Is the search backend serving, with credentials that work?
 *
 *  Not configured → `null`, which means "nothing to check here", never "healthy".
 *
 *  **It checks authenticated service, not reachability.** During the 2026-08-18
 *  boot window the node answered every TCP connection and every HTTP request —
 *  with a 401. A "does it accept a connection" probe would have called that
 *  healthy and let the run go red anyway. */
const checkSearchBackend = async (): Promise<CheckResult | null> => {
  const node = envValue("ELASTICSEARCH_NODE");
  if (!node) return null;

  let url: URL;
  try {
    url = new URL(node);
  } catch {
    // The guard reports a malformed address properly, and it runs first. Saying
    // it a second time here in different words would only be confusing.
    return null;
  }

  const username = envValue("ELASTICSEARCH_USERNAME");
  const password = envValue("ELASTICSEARCH_PASSWORD");
  const auth = username
    ? `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
    : "";

  const startedAt = Date.now();

  try {
    const status = await statusOf(url, auth);
    const ms = Date.now() - startedAt;

    // Anything but a success is "not serving", and the status is the useful
    // part: 401 is the boot window, 503 is a node that is up with no cluster
    // behind it, 200 is a backend the suite can test against.
    return status >= 200 && status < 300
      ? { ok: true, detail: "", label: "search", ms }
      : {
          ok: false,
          detail: `the search backend ${url.host} answered HTTP ${status}`,
          label: "search",
          ms,
        };
  } catch (error: unknown) {
    return {
      ok: false,
      detail: `the search backend ${url.host} — ${failureDetail(error)}`,
      label: "search",
      ms: Date.now() - startedAt,
    };
  }
};

/** Is this backend serving the storefront's own boot call?
 *
 *  Not configured -> `null`.
 *
 *  **A 4xx is not "down".** A box that refuses a request is a box that is
 *  answering, and calling that an outage would skip whole runs for a changed
 *  route. Only a transport failure, a timeout or a 5xx count -- and a 5xx is
 *  exactly the shape that has cost this suite runs: Cloudflare's 520 and 522
 *  both land here.
 *
 *  `role` is the word the reader sees, so it must be the backend's role in the
 *  product and never the technology behind it. */
const checkBackend = async (
  role: "gateway" | "core backend",
  addressKey: "GO_BACKEND_URL" | "BACKEND_URL",
): Promise<CheckResult | null> => {
  const base = envValue(addressKey);
  if (!base) return null;

  let url: URL;
  try {
    url = new URL(`${base.replace(/\/$/, "")}${BOOT_PROBE_PATH}`);
  } catch {
    return null;
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json", country: "iq", language: "en" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const ms = Date.now() - startedAt;

    return response.status < 500
      ? { ok: true, detail: "", label: role, ms }
      : {
          ok: false,
          detail: `the ${role} ${url.host} answered HTTP ${response.status} to the storefront's own boot call`,
          label: role,
          ms,
        };
  } catch (error: unknown) {
    return {
      ok: false,
      detail: `the ${role} ${url.host} — ${failureDetail(error)}`,
      label: role,
      ms: Date.now() - startedAt,
    };
  }
};

/** Which backends get asked, as data rather than as a list of calls.
 *
 *  A list is what lets `tests/harness/stagingProbeCoverage.test.ts` prove the
 *  core backend is on it. That check is worth having on its own: the core
 *  backend was silently missing here for months, and nothing in a passing run
 *  could say so -- a probe that checks less than it should reports exactly the
 *  same green line as one that checks everything.
 *
 *  `role` is the backend's role in the product, never the technology behind
 *  it. Both words appear in a failure a human reads. */
export const BACKEND_PROBES: readonly {
  role: "gateway" | "core backend";
  addressKey: "GO_BACKEND_URL" | "BACKEND_URL";
}[] = [
  // Guests and allow-listed traffic. Its absence empties the country picker.
  { role: "gateway", addressKey: "GO_BACKEND_URL" },
  // Every signed-in shopper's read and write -- the bag, the order, the
  // checklist. See the note at the top for the run this one would have saved.
  { role: "core backend", addressKey: "BACKEND_URL" },
];

/** Run a check, and give it a second chance before believing the bad news.
 *
 *  See the note at the top of this file: a false "down" costs a whole run and
 *  reports a green tick for having tested nothing, so one dropped packet must
 *  not be able to produce one. */
const twice = async (
  check: () => Promise<CheckResult | null>,
): Promise<CheckResult | null> => {
  const first = await check();
  if (first === null || first.ok) return first;

  await new Promise((resolve) => setTimeout(resolve, RETRY_PAUSE_MS));
  const second = await check();
  if (second === null) return null;

  return second.ok
    ? second
    : {
        ...second,
        ok: false,
        detail: `${second.detail} (asked twice, ${RETRY_PAUSE_MS / 1000}s apart)`,
      };
};

/** Ask staging whether it is in a state worth testing against.
 *
 *  Never throws. Every outcome is a report, because a probe that fails in its
 *  own way would be one more thing to tell apart from a real failure.
 *
 *  `skipped` rather than a plain `up` when nothing is configured, so the log says
 *  "nothing was checked" instead of "the check passed". A probe that checked
 *  nothing must never read like a healthy backend. */
export const probeStaging = async (): Promise<HealthReport> => {
  loadLiveEnv();

  const results = await Promise.all([
    twice(checkSearchBackend),
    ...BACKEND_PROBES.map((probe) =>
      twice(async () => await checkBackend(probe.role, probe.addressKey)),
    ),
  ]);
  const asked = results.filter((result): result is CheckResult => result !== null);

  if (asked.length === 0) {
    return { up: true, reason: "", skipped: true, timings: "" };
  }

  // Printed whatever the answer is. A slow box that answered is the case this
  // line exists for -- see `HealthReport.timings`.
  const timings = asked
    .map((result) => `${result.label} ${result.ms}ms`)
    .join(", ");

  const failed = asked.filter((result) => !result.ok);
  if (failed.length > 0) {
    return {
      up: false,
      reason: failed.map((result) => result.detail).join("; "),
      skipped: false,
      timings,
    };
  }

  return { up: true, reason: "", skipped: false, timings };
};
