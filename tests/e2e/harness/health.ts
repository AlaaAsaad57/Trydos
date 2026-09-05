// Is staging actually serving?
//
// The target guard (`guard.ts`) answers "is this address staging?". This file
// answers the other question, and they are not the same: an address can be
// perfectly correct and the box behind it still be down.
//
// ---------------------------------------------------------------------------
// Why this exists, and why it checks Elasticsearch specifically
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
// That is the specific dishonesty this file fixes, and it is why the probe is
// Elasticsearch and not every backend: it is the one whose absence blanks the
// page rather than emptying a section.
//
// **It checks authenticated service, not reachability.** During the boot window
// above the node answered every TCP connection and every HTTP request — with a
// 401. A "does it accept a connection" probe would have called that healthy and
// let the run go red anyway. Only a request that actually succeeds proves the
// suite has a backend to test against.
//
// **Unset means skip, never fail** — the same rule the rest of the harness
// follows. A machine with no Elasticsearch configured gets `up`, not `down`.

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { envValue, loadLiveEnv } from "./env";

// Matches the app's own client (`services/elastic/elasticsearch.config.ts`),
// deliberately. A probe that waits longer than the app does would report healthy
// for a node the app has already given up on.
const PROBE_TIMEOUT_MS = 8_000;

// The cheapest endpoint that needs both a live node and working credentials. Not
// `/`, which some proxies answer without ever reaching Elasticsearch.
const PROBE_PATH = "/_cluster/health";

export type HealthReport = {
  /** Ready to test against. True when nothing is configured to check. */
  up: boolean;
  /** Why it is not, ready to print. Empty when `up`. */
  reason: string;
  /** Nothing was configured, so nothing was checked. */
  skipped: boolean;
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

/** Turned off by hand on 2026-09-05, and this is the whole switch.
 *
 *  The probe was reporting the staging node down — `no answer in 8s` on
 *  `/_cluster/health` — from GitHub and from a developer machine alike, while a
 *  plain `curl -k` to the same host answered in under a second. Every run
 *  therefore skipped: no build, no browser, no journey, and a green tick for
 *  having tested nothing. The suite was asked to run anyway.
 *
 *  **What is now unguarded.** Read the note at the top of this file before
 *  changing anything here: when Elasticsearch really is down, every journey
 *  fails on a blank document, and with this flag set the workflow's
 *  "Re-check staging" step also answers `up`, so "Decide the verdict" calls a
 *  backend outage a code failure. That is precisely the mistake this file was
 *  written to stop, and it is back for as long as this line stands.
 *
 *  **To restore it:** set this to `false`. Nothing else was removed — the real
 *  probe below is untouched and runs again the moment the flag flips. */
// Typed `boolean`, not left to infer the literal `true`: an inferred `true`
// makes the real probe below unreachable code, which the compiler and the
// linter both complain about and which would tempt someone to delete it.
const PROBE_DISABLED: boolean = true;

/** Ask staging whether it is in a state worth testing against.
 *
 *  Never throws. Every outcome is a report, because a probe that fails in its
 *  own way would be one more thing to tell apart from a real failure. */
export const probeStaging = async (): Promise<HealthReport> => {
  // `skipped` rather than a plain `up`, so the log says "nothing was checked"
  // instead of "the check passed". A disabled probe must never be able to read
  // like a healthy backend.
  if (PROBE_DISABLED) return { up: true, reason: "", skipped: true };

  loadLiveEnv();

  const node = envValue("ELASTICSEARCH_NODE");
  if (!node) return { up: true, reason: "", skipped: true };

  let url: URL;
  try {
    url = new URL(node);
  } catch {
    // The guard reports a malformed address properly, and it runs first. Saying
    // it a second time here in different words would only be confusing.
    return { up: true, reason: "", skipped: true };
  }

  const username = envValue("ELASTICSEARCH_USERNAME");
  const password = envValue("ELASTICSEARCH_PASSWORD");
  const auth = username
    ? `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
    : "";

  try {
    const status = await statusOf(url, auth);

    // Anything but a success is "not serving", and the status is the useful
    // part: 401 is the boot window, 503 is a node that is up with no cluster
    // behind it, 200 is a backend the suite can test against.
    if (status < 200 || status >= 300) {
      return {
        up: false,
        reason: `${url.host} answered HTTP ${status}`,
        skipped: false,
      };
    }

    return { up: true, reason: "", skipped: false };
  } catch (error: unknown) {
    // The code (`ECONNREFUSED`, `ETIMEDOUT`, `EAI_AGAIN`) is what tells a
    // restarting box apart from a firewall, so prefer it over the message.
    const code = (error as NodeJS.ErrnoException)?.code;
    const detail = code ?? (error as Error)?.message ?? "unknown error";
    
    return { up: false, reason: `${url.host} — ${detail}`, skipped: false };
  }
};
