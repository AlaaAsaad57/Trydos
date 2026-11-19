import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/*
  The demo's sign-in request: "Get Started" opens the login
  (/sy-en/loginDemo?from=demo). The bug (2026-11-19): the login took 0.5 to
  1.3 s to open after the tap on staging. The route is dynamic (it reads
  `?from=demo` on the server), so nothing was fetched before the tap: the tap
  waited for the server to render the page, then for the login's scripts.

  The fix: the shell asks Next for a FULL prefetch of the login as soon as the
  request is planned (right after the country pick, 4 s before the request
  shows). A plain prefetch is not enough: Next skips a dynamic route's page.

  Its own file: the start runs once per load of the page (a module flag in
  Demo1Shell.tsx), and every test file gets fresh modules.
*/

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/sy-en/demo",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => router,
  useParams: () => ({ lang: "sy-en" }),
}));
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

class ObserverStub {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("ResizeObserver", ObserverStub);
vi.stubGlobal("IntersectionObserver", ObserverStub);

import Demo1Shell from "components/DemoApp1/Demo1Shell";

const LOGIN = "/sy-en/loginDemo?from=demo";

const loginPrefetches = () =>
  router.prefetch.mock.calls.filter(([href]) => href === LOGIN);

describe("Demo sign-in request: the login is fetched before the tap", () => {
  it("asks Next for a full prefetch of the login right after the country pick", async () => {
    const { container } = render(
      <Demo1Shell dictionary={{}} intro>
        {null}
      </Demo1Shell>,
    );

    expect(
      loginPrefetches(),
      "the login was prefetched before any country was picked, when no sign-in request is due yet",
    ).toEqual([]);

    const country = container.querySelector<HTMLElement>("[data-pw^=demo-picker-country-]");
    expect(country, "the country picker shows no country to pick").toBeTruthy();
    fireEvent.click(country!);

    await waitFor(
      () =>
        expect(
          loginPrefetches().length > 0,
          `the shell did not prefetch ${LOGIN} after the pick, so "Get Started" waits for the server`,
        ).toBe(true),
      { timeout: 3000 },
    );
    const [, options] = loginPrefetches()[0];
    expect(
      options?.kind,
      "the login prefetch is not a full one, so Next skips the dynamic page and the tap still waits for the server",
    ).toBe("full");
    expect(
      typeof options?.onInvalidate,
      "the login prefetch gives no onInvalidate, so it is not fetched again when it expires (30 s) while the request is open",
    ).toBe("function");
  });
});
