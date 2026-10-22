import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The chat list is mounted through the shell, as Demo1Shell.test.tsx does.
const url = vi.hoisted(() => ({ pathname: "/sy-en/demo", search: "chat" }));
const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => url.pathname,
  useSearchParams: () => new URLSearchParams(url.search),
  useRouter: () => router,
  useParams: () => ({ lang: "sy-en" }),
}));
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

import Demo1Shell from "components/DemoApp1/Demo1Shell";
import MessageRow, { REPLY_PULL } from "components/DemoApp1/chat/MessageRow";
import { OPEN_LEFT } from "components/DemoApp1/screens/ChatListScreen";

/*
  The swipe on a chat row and on a message, on the iPhone.

  Safari reads the first pixels of a touch to decide whether it is a scroll,
  and `touch-action: pan-y` lets it take any touch it reads as up-down. A
  thumb's sideways swipe begins with a small up-down arc, so Safari scrolled
  (or bounced) the page under the finger — "the screen plays up and down" —
  and the row never swiped. The guard (useHorizontalSwipe) reads the touch
  itself, sideways winning a tie, and stops the scroll for a sideways touch.

  jsdom does not scroll, so what a browser would do is read off the event: a
  `touchmove` the guard prevented is one Safari cannot scroll on.
*/

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/** A touch event the way jsdom can build one: a plain event with `touches`. */
const touch = (type: string, x: number, y: number) => {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, "touches", { value: [{ clientX: x, clientY: y }] });
  return e;
};

/** Sends a touch that starts at (x, y) and moves to (toX, toY); says whether the move was prevented. */
const touchMove = (el: Element, x: number, y: number, toX: number, toY: number) => {
  el.dispatchEvent(touch("touchstart", x, y));
  const move = touch("touchmove", toX, toY);
  el.dispatchEvent(move);
  el.dispatchEvent(touch("touchend", toX, toY));
  return move.defaultPrevented;
};

const pointer = (x: number, y: number) => ({
  clientX: x,
  clientY: y,
  pageX: x,
  pageY: y,
  pointerId: 1,
  pointerType: "touch",
  isPrimary: true,
  button: 0,
  buttons: 1,
});

/** Lets framer's frame loop run `n` frames. */
const frames = async (n: number) => {
  for (let i = 0; i < n; i += 1)
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
};

/**
 * A finger swipe of `dx` px, the way a thumb pulls a row: it begins sideways
 * and, with `drift`, then drifts down past framer's own 10 px up-down lock.
 * On the element until the drag starts, then on the window, where framer
 * listens. The guard starts the drag at the second move (8 px in), so the
 * pull framer measures is `dx - 8`.
 */
const thumbSwipe = async (el: Element, dx: number, drift = true) => {
  const sign = Math.sign(dx);
  const down = (y: number) => (drift ? y : 105);
  fireEvent.pointerDown(el, pointer(200, 100));
  fireEvent.pointerMove(el, pointer(200 + sign * 5, 103));
  fireEvent.pointerMove(el, pointer(200 + sign * 8, 105));
  await frames(2);
  fireEvent.pointerMove(window, pointer(200 + sign * 12, down(112)));
  await frames(2);
  fireEvent.pointerMove(window, pointer(200 + dx / 2, down(114)));
  await frames(2);
  fireEvent.pointerMove(window, pointer(200 + dx, down(115)));
  await frames(2);
  fireEvent.pointerUp(window, pointer(200 + dx, down(115)));
  await frames(3);
};

/** The message follows a pull to the right at 3/4 (MessageRow's `dragElastic`). */
const REPLY_ELASTIC = 0.75;

beforeEach(() => {
  url.pathname = "/sy-en/demo";
  url.search = "chat";
});

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});

describe("a message's swipe to reply", () => {
  const mount = (props: Partial<React.ComponentProps<typeof MessageRow>> = {}) => {
    const onReply = vi.fn();
    const { container } = render(
      <MessageRow id="m1" side="in" gap={4} onReply={onReply} {...props}>
        <div>hello</div>
      </MessageRow>,
    );
    const swipe = container.querySelector<HTMLElement>('[data-pw="demo-chat-swipe"]');
    expect(swipe, "the message row has no swipe box").not.toBeNull();
    return { swipe: swipe!, onReply };
  };

  it("keeps a sideways touch from scrolling the chat", () => {
    const { swipe } = mount();
    expect(
      touchMove(swipe, 100, 100, 112, 103),
      "a touch moving 12 px sideways and 3 px down was left to Safari, which scrolls on it",
    ).toBe(true);
  });

  it("leaves an up-down touch to the chat", () => {
    const { swipe } = mount();
    expect(
      touchMove(swipe, 100, 100, 103, 112),
      "a touch moving 12 px down and 3 px sideways was taken from the scroll",
    ).toBe(false);
  });

  it("leaves every touch to the chat on a message that cannot be answered", () => {
    const { swipe } = mount({ canReply: false });
    expect(
      touchMove(swipe, 100, 100, 112, 103),
      "a sideways touch on a message with no reply was taken from the scroll",
    ).toBe(false);
  });

  it("answers the message on a swipe that begins sideways and drifts down", async () => {
    const { swipe, onReply } = mount();
    // 8 px to the drag start, then 90 px of pull: the message moves 67 px.
    await thumbSwipe(swipe, 98);
    expect(
      onReply,
      "a pull well past REPLY_PULL that drifted 15 px down did not answer the message",
    ).toHaveBeenCalledTimes(1);
  });

  it("answers the message when the finger lets go just past REPLY_PULL", async () => {
    const { swipe, onReply } = mount();
    // The message is 0.6 px past the mark when the finger lifts. Framer runs
    // onDragEnd a frame later, after the spring back has begun: a reader of
    // the live `x` there sees the message already short of the mark.
    await thumbSwipe(swipe, 8 + (REPLY_PULL + 0.6) / REPLY_ELASTIC, false);
    expect(
      onReply,
      "a pull let go 0.6 px past REPLY_PULL did not answer the message (the pull was read after the spring back began)",
    ).toHaveBeenCalledTimes(1);
  });
});

describe("a chat row's swipe to its actions", () => {
  const mount = () => {
    const { container } = render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
    const face = container.querySelector<HTMLElement>('[data-pw^="demo-chat-row-face-"]');
    expect(face, "the chat list shows no row to swipe").not.toBeNull();
    const row = face!.parentElement!;
    return { face: face!, row };
  };

  it("keeps a sideways touch from scrolling the list", () => {
    const { face } = mount();
    expect(
      touchMove(face, 100, 100, 112, 103),
      "a touch moving 12 px sideways and 3 px down was left to Safari, which scrolls on it",
    ).toBe(true);
  });

  it("leaves an up-down touch to the list", () => {
    const { face } = mount();
    expect(
      touchMove(face, 100, 100, 103, 112),
      "a touch moving 12 px down and 3 px sideways was taken from the scroll",
    ).toBe(false);
  });

  it("opens the row's actions on a swipe that begins sideways and drifts down", async () => {
    const { face, row } = mount();
    await thumbSwipe(face, OPEN_LEFT - 20);
    expect(
      row.getAttribute("data-open"),
      "a pull past half the actions' width that drifted 15 px down did not open the row",
    ).toBe("left");
  });

  it("leaves an up-down touch to the list while a row's actions are open", async () => {
    const { face, row } = mount();
    await thumbSwipe(face, OPEN_LEFT - 20);
    expect(row.getAttribute("data-open"), "the row did not open first").toBe("left");
    expect(
      touchMove(face, 100, 300, 103, 240),
      "with the actions open, a touch moving 60 px up was held back from scrolling the list",
    ).toBe(false);
  });

  it("closes the row's actions when the list scrolls", async () => {
    const { face, row } = mount();
    await thumbSwipe(face, OPEN_LEFT - 20);
    expect(row.getAttribute("data-open"), "the row did not open first").toBe("left");
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(
      row.getAttribute("data-open"),
      "the list scrolled and the row's actions stayed open",
    ).toBeNull();
  });
});
