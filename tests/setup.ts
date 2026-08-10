// What every test file gets before it runs.
//
// vitest.config.mts points `setupFiles` here, so this runs once per test file,
// before the tests in it. Four things happen:
//
//   1. The extra checks for reading the page (`toBeInTheDocument`, `toBeVisible`,
//      and the rest) are added to `expect`.
//   2. The App Router hooks are replaced for the whole test run, because the real
//      ones cannot work outside a running app.
//   3. Anything a test rendered is taken off the page again afterwards, so two
//      tests never see each other's markup.
//   4. The fake network starts, is reset between tests, and stops at the end.
//
// Nothing here is specific to one feature. Keep it that way: a helper that only
// some tests want belongs in tests/mocks/, tests/msw/ or tests/render.tsx, not in
// this file.
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw/server";

// Registered here rather than in each test file, because 86 files under
// components/ read the route and every one of them would otherwise have to ask
// for this by hand. A test file that wants something different can still declare
// its own — the nearer one wins.
//
// The stand-in is pulled in inside the factory on purpose. `vi.mock` is lifted
// above the imports at the top of this file, so a name imported up there is not
// ready yet when the factory runs.
vi.mock("next/navigation", async () => {
  const { makeNavigationMock } = await import("./mocks/nextNavigation");
  return makeNavigationMock();
});

// Stops the client module graph at the "use server" boundary, the same place
// Next stops it. Without this, importing the shared store or utils/functions.tsx
// drags in next/headers and ioredis — and ioredis opens a real connection as
// soon as it loads. See tests/mocks/serverActions.ts for the whole story.
vi.mock("serverActions/sendOtp", async () => {
  const { makeSendOtpActionMock } = await import("./mocks/serverActions");
  return makeSendOtpActionMock();
});

// The same cut, one level deeper and more urgent: ioredis opens a real socket as
// soon as it is loaded, and loading the shared store reaches it. See
// tests/mocks/serverRequests.ts.
vi.mock("serverRequests/radis", async () => {
  const { makeCacheMock } = await import("./mocks/serverRequests");
  return makeCacheMock();
});

beforeAll(() => {
  server.listen({
    // A request nobody wrote a reply for fails the test instead of going out to
    // the real network. A unit test must never touch a real address, and a
    // silent miss is the easiest way for that to happen by accident.
    //
    // If this fires, you either meant to use one of the stand-ins in
    // tests/mocks/ (cheaper — they replace the helper rather than answer it), or
    // you need a handler in tests/msw/handlers.ts.
    onUnhandledRequest: "error",
  });
});

afterEach(async () => {
  cleanup();
  // Throws away anything a test added with `server.use()`, so a reply set up for
  // one test cannot leak into the next one.
  server.resetHandlers();
  // Same idea for the route: back to "/gb-en", and the router spies forget the
  // calls they were told about.
  const { resetRoute } = await import("./mocks/nextNavigation");
  resetRoute();

  const { resetServerActionSpies } = await import("./mocks/serverActions");
  const { resetCacheSpies } = await import("./mocks/serverRequests");
  resetServerActionSpies();
  resetCacheSpies();
});

afterAll(() => {
  server.close();
});
