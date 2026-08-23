// Proves the promises tests/setup.ts makes, so the six component phases that
// depend on this harness do not have to find out the hard way. The fake
// network's own promises are proved in tests/msw/msw.test.ts.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { RedisGet, otpRateLimit } from "serverRequests/radis";
import { cacheSpies } from "./mocks/serverRequests";

function Greeting() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p data-testid="greeting">Hello</p>
      <button onClick={() => setOpen(true)}>Show more</button>
      {open ? <p>More</p> : null}
    </div>
  );
}

describe("the render setup", () => {
  it("adds the page checks to expect", () => {
    render(<Greeting />);

    // toBeInTheDocument comes from @testing-library/jest-dom. Without the setup
    // file it is not a function, and this line fails.
    expect(screen.getByTestId("greeting")).toBeInTheDocument();
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello");
  });

  it("takes the last test's markup off the page first", () => {
    // The test above rendered a Greeting and never cleaned up by hand. If the
    // setup file did not do it, there would be two of them here and getByText
    // would fail for being ambiguous.
    render(<Greeting />);

    expect(screen.getAllByTestId("greeting")).toHaveLength(1);
  });

  it("drives a click through user-event", async () => {
    const user = userEvent.setup();
    render(<Greeting />);

    expect(screen.queryByText("More")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show more" }));

    expect(screen.getByText("More")).toBeInTheDocument();
  });
});

describe("the server boundary", () => {
  // This is the one that does damage quietly. The real serverRequests/radis
  // loads ioredis, and ioredis opens a socket the moment it is loaded — no call
  // needed. Nothing would fail; the tests would just be talking to the network.
  // If someone drops the stand-in from tests/setup.ts, this test says so.
  it("never loads the real cache layer", async () => {
    expect(vi.isMockFunction(RedisGet)).toBe(true);
    expect(RedisGet).toBe(cacheSpies.RedisGet);

    await expect(RedisGet("anything")).resolves.toBeNull();
  });

  // The stand-in's default reply has to be a reply the real limiter could
  // actually give, or a test can pass on a value that cannot happen. It used to
  // say `{ blocked: false }`, which the real one never returns.
  it("hands back a limiter that allows the send", async () => {
    await expect(otpRateLimit({} as any)).resolves.toEqual({
      allowed: true,
      reason: "ok",
      lockSeconds: 60,
    });
    expect(cacheSpies.otpRateLimit).toHaveBeenCalled();
  });
});
