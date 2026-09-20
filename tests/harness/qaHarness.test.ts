// @vitest-environment node
//
// The parts of the QA safety lock that can be proved without a browser.
//
// **Why this file is outside `tests/e2e/`.** The unit project excludes only
// `tests/e2e/**`, so a file here runs in `pnpm test:run` — which gates every
// pull request. The browser suite never does. So these four criteria are the
// ones that actually stop a regression reaching the branch, and the rest of the
// lock is proved by the live suite, which runs on a schedule.
//
// **What this file must never import.**
//
//   * `tests/e2e/cli.ts` — it calls `main()` at module scope with the command
//     defaulting to `"run"`. Importing it here would run preflight, a full
//     `next build`, and the whole Playwright suite against staging, inside the
//     unit run, on every pull request. The lane tables were moved into
//     `laneConfig.ts` for exactly this reason.
//   * `tests/e2e/harness/qaSeed.ts` — it imports Playwright, which this project
//     cannot load, and it writes to a real environment.
//
// **Why every value is passed in as an argument.** `loadLiveEnv()` copies
// `.env.development` into `process.env`, and a Vitest worker is shared by many
// test files. Calling it here would put the admin password and both test phones
// into the environment of every other unit file in the same worker. So the
// functions under test take what they need, and this file hands them values it
// made up.

import { describe, expect, it } from "vitest";

import { isAllowedHost, ALLOWED_HOSTS } from "../e2e/harness/guard";
import { PROD_SAFE_TAG, qaGrepFor } from "../e2e/laneConfig";
import { failQaProduct } from "../e2e/harness/qaMessages";
import { redact } from "../e2e/harness/redact";

// ---------------------------------------------------------------- AC-21

describe("an unusable QA product is named, not skipped", () => {
  // The rule this proves: a seed that finds its product missing must fail the
  // run, loudly, naming which of the three things is wrong. A seed that
  // *skipped* would report a green run in which nothing was checked — the
  // silent pass the whole suite exists to prevent.

  it("throws for a missing product", () => {
    expect(
      () => failQaProduct("missing", "trydos-qa-shop"),
      "the seed reported a missing QA product without throwing, so the run would go green having tested nothing",
    ).toThrow();
  });

  it("throws for an inactive product", () => {
    expect(
      () => failQaProduct("inactive", "trydos-qa-shop"),
      "the seed reported an inactive QA product without throwing",
    ).toThrow();
  });

  it("throws for a product with no stock", () => {
    expect(
      () => failQaProduct("out-of-stock", "trydos-qa-shop"),
      "the seed reported a QA product with no stock without throwing",
    ).toThrow();
  });

  it("says something different for each of the three faults", () => {
    // One shared message would tell a reader that the seed failed and nothing
    // about which of three very different repairs is needed.
    const messages = (["missing", "inactive", "out-of-stock"] as const).map(
      (fault) => {
        try {
          failQaProduct(fault, "trydos-qa-shop");
          return "";
        } catch (error) {
          return (error as Error).message;
        }
      },
    );

    expect(
      new Set(messages).size,
      "two of the three QA product faults produce the same message, so the failure cannot say which one happened",
    ).toBe(3);
  });

  it("names the shop by its slug, so a reader can see it is test data", () => {
    let message = "";
    try {
      failQaProduct("missing", "trydos-qa-my-shop");
    } catch (error) {
      message = (error as Error).message;
    }

    expect(
      message.includes("trydos-qa-my-shop"),
      "the QA failure message does not name the shop, so a reader of a public CI log cannot tell whether the failing row is test data or a real seller's",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------- AC-22

describe("the guard refuses an unknown host", () => {
  it("recognises a host that is on the allow-list", () => {
    // Taken from the list itself rather than written out, so this case cannot
    // go stale when a staging address changes.
    const known = ALLOWED_HOSTS[0];

    expect(
      isAllowedHost(known),
      `the target guard no longer recognises "${known}", which is on its own allow-list — the whole live suite would refuse to start`,
    ).toBe(true);
  });

  it("refuses a host that is not on the allow-list", () => {
    expect(
      isAllowedHost("shop.example.com"),
      "the target guard accepted a host that is on no allow-list, so the live suite could be pointed at any address including production",
    ).toBe(false);
  });

  it("refuses an empty host", () => {
    expect(
      isAllowedHost(""),
      "the target guard accepted an empty host",
    ).toBe(false);
  });

  it("ignores letter case and surrounding spaces", () => {
    const known = ALLOWED_HOSTS[0];

    expect(
      isAllowedHost(`  ${known.toUpperCase()}  `),
      "the target guard refused a known staging host because of its letter case or a space, which would stop the suite for the wrong reason",
    ).toBe(true);
  });
});

// ---------------------------------------------------------------- AC-23

describe("the grep follows the target", () => {
  // `qaGrepFor` takes the allow-list check as an argument, so both directions
  // can be driven here without touching the environment.
  const known = (host: string) => host === "staging.example.com";

  it("runs the whole suite against a known staging address", () => {
    expect(
      qaGrepFor("https://staging.example.com", known),
      "the suite was narrowed to the prod-safe cases even though the target is a known staging address, so most of the suite would silently stop running",
    ).toBeUndefined();
  });

  it("narrows to the prod-safe cases against an unknown host", () => {
    expect(
      qaGrepFor("https://shop.example.com", known),
      "an unknown target did not narrow the run to the prod-safe cases, so cases that write to real data would run against it",
    ).toBe(PROD_SAFE_TAG);
  });

  it("narrows when the target cannot be parsed", () => {
    expect(
      qaGrepFor("not a url at all ((", known),
      "an unparseable target did not narrow the run, so a typo in an address opens the whole suite",
    ).toBe(PROD_SAFE_TAG);
  });

  it("narrows when the target is empty", () => {
    expect(
      qaGrepFor("", known),
      "an unset target did not narrow the run, which is the fail-open direction: a missing value must never be read as permission",
    ).toBe(PROD_SAFE_TAG);
  });

  it("reads the host, not the rest of the address", () => {
    // A path or a query that happens to mention a staging name must not make an
    // unknown host look known.
    expect(
      qaGrepFor("https://shop.example.com/staging.example.com", known),
      "the grep read a staging name out of the path instead of the host",
    ).toBe(PROD_SAFE_TAG);
  });
});

// ---------------------------------------------------------------- AC-24

describe("the QA secret is masked", () => {
  it("never prints the QA secret in output", () => {
    // Set as an argument to this process only. The repository is public, so
    // every CI log is world-readable, and this secret is the one value that
    // unfilters the catalogue for whoever holds it.
    const secret = "qa-secret-value-long-enough-to-be-real-0123456789";
    const previous = process.env.QA_VIEW_SECRET;
    process.env.QA_VIEW_SECRET = secret;

    try {
      const masked = redact(`the request sent x-qa-view: ${secret}`);

      expect(
        masked.includes(secret),
        "the QA-mode secret reached the output unmasked, and every CI log in this public repository is readable by anybody",
      ).toBe(false);

      expect(
        masked.includes("QA_VIEW_SECRET"),
        "the QA secret was masked but the replacement does not name the variable, so a reader cannot tell what was removed",
      ).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.QA_VIEW_SECRET;
      else process.env.QA_VIEW_SECRET = previous;
    }
  });
});
