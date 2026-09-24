// @vitest-environment node
//
// The first-party analytics proxy (/ingest/*): forwards to the analytics hosts
// without our cookies, and sends no cookie back.
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, OPTIONS, POST } from "app/ingest/[...path]/route";

const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });

/** A fake upstream that records what it was sent. */
const upstream = (response: () => Response) => {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => response());
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

afterEach(() => vi.unstubAllGlobals());

describe("the analytics proxy", () => {
  it("sends asset requests to the assets host, without our cookies", async () => {
    const fetch = upstream(() => new Response("js", { status: 200, headers: { "content-type": "text/javascript" } }));

    const response = await GET(
      new Request("https://trydos.test/ingest/static/recorder.js?v=1", {
        headers: { cookie: "MARKET-TOKEN=secret", "x-keep": "yes" },
      }),
      ctx(["static", "recorder.js"]),
    );

    const [url, init] = fetch.mock.calls[0];
    expect(url, "an asset request did not go to the assets host").toBe(
      "https://eu-assets.i.posthog.com/static/recorder.js?v=1",
    );
    const sent = init.headers as Headers;
    expect(sent.get("cookie"), "our cookies were forwarded to the analytics host").toBeNull();
    expect(sent.get("x-keep"), "an ordinary header was dropped").toBe("yes");
    expect(init.body, "a GET carried a body").toBeUndefined();
    await expect(response.text(), "the asset was not passed back").resolves.toBe("js");
  });

  it("sends a capture call with its body to the ingestion host, and strips set-cookie from the answer", async () => {
    const fetch = upstream(
      () =>
        new Response("{}", {
          status: 200,
          headers: { "set-cookie": "a=b", "x-upstream": "1" },
        }),
    );

    const response = await POST(
      new Request("https://trydos.test/ingest/e/", { method: "POST", body: "event" }),
      ctx(["e", ""]),
    );

    const [url, init] = fetch.mock.calls[0];
    expect(url, "a capture call did not go to the ingestion host").toBe("https://eu.i.posthog.com/e/");
    expect(new TextDecoder().decode(init.body as ArrayBuffer), "the capture body was not forwarded").toBe("event");
    expect(response.headers.get("set-cookie"), "the analytics host could set a cookie on our domain").toBeNull();
    expect(response.headers.get("x-upstream"), "an ordinary answer header was dropped").toBe("1");
  });

  it("forwards a preflight too", async () => {
    upstream(() => new Response(null, { status: 204 }));

    const response = await OPTIONS(
      new Request("https://trydos.test/ingest/flags", { method: "OPTIONS" }),
      ctx(["flags"]),
    );

    expect(response.status, "the preflight answer was not passed back").toBe(204);
  });

  it("answers 502 instead of throwing when the analytics host cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    const response = await GET(new Request("https://trydos.test/ingest/flags"), ctx(["flags"]));

    expect(response.status, "an unreachable analytics host did not become a quiet 502").toBe(502);
  });
});
