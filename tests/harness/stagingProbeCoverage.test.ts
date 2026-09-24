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
// This file asks what the probe covers, and how long it keeps asking before it
// believes a backend is down. Whether a given host is serving today is the live
// suite's business, and it needs a network: here `fetch` and the env file are
// stand-ins, and the clock is fake.
import { afterEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ values: {} as Record<string, string> }));

vi.mock("../e2e/harness/env", () => ({
  loadLiveEnv: () => {},
  envValue: (key: string) => env.values[key] ?? "",
}));

import { BACKEND_PROBES, probeStaging } from "../e2e/harness/health";

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

// Runs 35968694510, 35965400734, 35869919139 and 35840383129 each skipped a
// lane with a green tick on "the gateway … — 23 (asked twice, 2s apart)". The
// 23 is a timeout; the backends were serving, and the other lane's runner
// reached them seconds earlier in about 600 ms. Two tries 2 s apart gave up
// after about 18 s — shorter than the slow patches these runners meet.
describe("the staging health probe — how long it asks before it says down", () => {
  /** A timeout, the way `fetch` throws one when AbortSignal.timeout fires. */
  const timeout = () => new DOMException("The operation was aborted due to timeout", "TimeoutError");

  /** Only the gateway is configured, so it is the one box asked. */
  const onlyGateway = () => {
    env.values = { GO_BACKEND_URL: "https://gateway.test" };
  };

  /** Run the probe to its end on the fake clock, noting when each try went out. */
  async function probeWith(answers: Array<"timeout" | "ok">) {
    const sentAt: number[] = [];
    const start = Date.now();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        sentAt.push(Date.now() - start);
        const answer = answers[Math.min(sentAt.length, answers.length) - 1];
        if (answer === "timeout") throw timeout();
        return new Response("{}", { status: 200 });
      }),
    );
    const report = probeStaging();
    await vi.runAllTimersAsync();
    return { report: await report, sentAt };
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    env.values = {};
  });

  it("calls a backend up when it answers on a later try", async () => {
    vi.useFakeTimers();
    onlyGateway();
    const { report } = await probeWith(["timeout", "timeout", "timeout", "ok"]);
    expect(report.up, `a gateway that answered on its fourth try was called down: ${report.reason}`).toBe(true);
  });

  it("stops asking at the first answer", async () => {
    vi.useFakeTimers();
    onlyGateway();
    const { sentAt } = await probeWith(["ok"]);
    expect(sentAt, "a gateway that answered at once was asked again").toEqual([0]);
  });

  it("calls a backend down only after five tries over about a minute", async () => {
    vi.useFakeTimers();
    onlyGateway();
    const { report, sentAt } = await probeWith(["timeout"]);
    expect(report.up, "a gateway that never answered was called up").toBe(false);
    // Pauses of 2, 4, 6 and 8 s. With every try using its full 8 s, that is
    // 5 × 8 s + 20 s = 60 s before a real outage skips the lane.
    expect(sentAt, "the tries did not go out at 0, 2, 6, 12 and 20 s").toEqual([0, 2_000, 6_000, 12_000, 20_000]);
    expect(report.reason, "the reason does not say how often the gateway was asked").toContain("asked 5 times");
  });
});
