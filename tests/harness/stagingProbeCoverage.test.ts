// @vitest-environment node
//
// Which backends the health probe actually asks about.
//
// The probe's answer decides two things no other check can: whether a lane
// runs at all, and whether a red lane is forgiven as an outage. So a probe
// that asks about less than it should is worse than no probe — it reports the
// same green line either way, and nothing in a passing run can tell you it
// looked at half the estate.
//
// That is not hypothetical here. The **core backend** was left out on the
// belief that "every endpoint on it wants a verified shopper's token". It does
// not: measured on 2026-09-22, `GET <core>/web/home/startingSettings` answers
// 200 with no token, exactly as the gateway does.
//
// Leaving it out cost run 35702622335 (2026-09-22 08:02). The probe passed,
// the account lane ran, and the core backend answered **520** to `/cart/add` —
// Cloudflare for "the origin sent something I could not parse". Nine cases
// went red and the verdict called it a code failure, because nothing had asked
// the box that was ill. The same shape came back at 13:15 as a **522** on the
// checklist read.
//
// This file asks only what the probe covers. Whether a given host is serving
// today is the live suite's business, and it needs a network.
import { describe, expect, it } from "vitest";

import { BACKEND_PROBES } from "../e2e/harness/health";

describe("the staging health probe — what it asks about", () => {
  it("asks the gateway, which serves every guest", () => {
    expect(
      BACKEND_PROBES.some((probe) => probe.addressKey === "GO_BACKEND_URL"),
      "the gateway is not probed, so a lane would run with an empty country picker and blame the code",
    ).toBe(true);
  });

  it("asks the core backend, which every signed-in write goes through", () => {
    expect(
      BACKEND_PROBES.some((probe) => probe.addressKey === "BACKEND_URL"),
      "the core backend is not probed. That is what let run 35702622335 report 9 real-looking failures for a backend answering 520 — do not remove it",
    ).toBe(true);
  });

  it("names each backend by its role in the product, never by its stack", () => {
    for (const probe of BACKEND_PROBES) {
      expect(
        ["gateway", "core backend"],
        `the probe calls a backend "${probe.role}"; a health failure is read by a human, and the name must say the backend's role, not the technology behind it`,
      ).toContain(probe.role);
    }
  });

  it("asks each backend exactly once", () => {
    const keys = BACKEND_PROBES.map((probe) => probe.addressKey);
    expect(
      new Set(keys).size,
      `the probe list holds ${keys.length} entries for ${new Set(keys).size} distinct backends, so one is asked twice and pays a timeout twice before a lane may start`,
    ).toBe(keys.length);
  });
});
