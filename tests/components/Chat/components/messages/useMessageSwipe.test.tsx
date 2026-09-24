// Swipe a chat bubble to the right to show its dates
// (components/Chat/components/messages/useMessageSwipe.ts).
//
// The hook's pointer handlers are called directly with small event objects:
// they read only clientX/Y, pointerType, button(s), pointerId and currentTarget.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMessageSwipe } from "components/Chat/components/messages/useMessageSwipe";

function setup(opts: { id?: any; enabled?: boolean; isMenuOpen?: boolean } = {}) {
  const content = document.createElement("div");
  const dates = document.createElement("div");
  document.body.append(content, dates);
  const hook = renderHook((p: any) => useMessageSwipe(p), {
    initialProps: { id: opts.id ?? 1, enabled: opts.enabled, isMenuOpen: opts.isMenuOpen },
  });
  hook.result.current.contentRef.current = content;
  hook.result.current.datesRef.current = dates;
  const target = {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  };
  const ev = (x: number, y = 0, extra: Record<string, any> = {}) =>
    ({ clientX: x, clientY: y, pointerId: 1, pointerType: "touch", button: 0, buttons: 1, currentTarget: target, ...extra }) as any;
  const h = () => hook.result.current.swipeHandlers;
  const swipe = (to: number, y = 0) => {
    act(() => {
      h().onPointerDown(ev(0));
      h().onPointerMove(ev(to / 2, y / 2));
      h().onPointerMove(ev(to, y));
      h().onPointerUp(ev(to, y));
    });
  };
  return { hook, content, dates, target, ev, h, swipe };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("useMessageSwipe", () => {
  it("a swipe right past 20px locks the bubble open and shows the dates", () => {
    const { hook, content, dates, swipe } = setup();
    const onSwiped = vi.fn();
    window.addEventListener("chat-message-swiped", onSwiped);
    swipe(60);
    window.removeEventListener("chat-message-swiped", onSwiped);
    expect(hook.result.current.isOpen, "the bubble did not lock open").toBe(true);
    expect(content.style.transform, "the bubble did not rest at the snap offset").toBe("translateX(18px)");
    expect(dates.style.opacity, "the dates were not shown").toBe("1");
    expect(onSwiped.mock.calls[0][0].detail, "the other bubbles were not told which one opened").toEqual({ id: 1 });
  });

  it("a short swipe right springs back", () => {
    const { hook, content, ev, h } = setup();
    act(() => {
      h().onPointerDown(ev(0));
      h().onPointerMove(ev(10));
    });
    expect(content.style.transform, "the bubble did not follow the finger").toBe("translateX(10px)");
    act(() => h().onPointerUp(ev(15)));
    expect(hook.result.current.isOpen, "a short swipe locked open").toBe(false);
    expect(content.style.transform, "the bubble did not spring back").toBe("translateX(0px)");
  });

  it("resists a long pull and ignores a swipe to the left when closed", () => {
    const { content, ev, h, hook } = setup();
    act(() => {
      h().onPointerDown(ev(0));
      h().onPointerMove(ev(135));
    });
    expect(content.style.transform, "a long pull was not slowed after 35px").toBe("translateX(50px)");
    act(() => h().onPointerCancel(ev(135)));
    expect(content.style.transform, "a cancelled swipe did not go back").toBe("translateX(0px)");
    act(() => {
      h().onPointerDown(ev(0));
      h().onPointerMove(ev(-40));
      h().onPointerUp(ev(-40));
    });
    expect(hook.result.current.isOpen, "a left swipe opened a closed bubble").toBe(false);
  });

  it("an open bubble closes when dragged left, and stays open on a small drag", () => {
    const { hook, content, ev, h, swipe } = setup();
    swipe(60);
    act(() => {
      h().onPointerDown(ev(100));
      h().onPointerMove(ev(90));
    });
    expect(content.style.transform, "the open bubble did not follow a small left drag").toBe("translateX(8px)");
    act(() => h().onPointerUp(ev(90)));
    expect(hook.result.current.isOpen, "a small drag closed the bubble").toBe(true);
    act(() => {
      h().onPointerDown(ev(100));
      h().onPointerMove(ev(40));
    });
    expect(content.style.transform, "an open bubble was dragged past its rest point").toBe("translateX(0px)");
    act(() => h().onPointerMove(ev(200)));
    expect(content.style.transform, "an open bubble was pulled past 35px").toBe("translateX(35px)");
    act(() => h().onPointerUp(ev(60)));
    expect(hook.result.current.isOpen, "a long left drag did not close the bubble").toBe(false);
  });

  it("a cancel on an open bubble keeps it open", () => {
    const { hook, ev, h, swipe } = setup();
    swipe(60);
    act(() => h().onPointerCancel(ev(0)));
    expect(hook.result.current.isOpen, "a cancel closed an open bubble").toBe(true);
  });

  it("leaves a vertical drag to the scroll", () => {
    const { hook, content, ev, h } = setup();
    act(() => {
      h().onPointerDown(ev(0, 0));
      h().onPointerMove(ev(3, 30));
      h().onPointerMove(ev(60, 30));
      h().onPointerUp(ev(60, 30));
    });
    expect(hook.result.current.isOpen, "a vertical drag opened the bubble").toBe(false);
    expect(content.style.transform, "a vertical drag moved the bubble").toBe("");
  });

  it("ignores a mouse that is not pressed, a right-click, a disabled swipe and an open menu", () => {
    const a = setup();
    act(() => {
      a.h().onPointerDown(a.ev(0, 0, { pointerType: "mouse", button: 2 }));
      a.h().onPointerMove(a.ev(60, 0, { pointerType: "mouse", buttons: 0 }));
    });
    expect(a.content.style.transform, "a hovering mouse moved the bubble").toBe("");
    const b = setup({ enabled: false });
    b.swipe(60);
    expect(b.hook.result.current.isOpen, "a disabled bubble opened").toBe(false);
  });

  it("closes when the options menu opens", () => {
    const { hook, swipe } = setup();
    swipe(60);
    hook.rerender({ id: 1, isMenuOpen: true });
    expect(hook.result.current.isOpen, "opening the menu did not close the bubble").toBe(false);
    act(() => {
      hook.result.current.swipeHandlers.onPointerDown({ clientX: 0, clientY: 0 } as any);
      hook.result.current.swipeHandlers.onPointerMove({ clientX: 60, clientY: 0 } as any);
    });
    expect(hook.result.current.isOpen, "a bubble with its menu open could be swiped").toBe(false);
  });

  it("closes when another bubble opens or the chat scrolls, not for itself", () => {
    const { hook, swipe } = setup({ id: 1 });
    swipe(60);
    act(() => {
      window.dispatchEvent(new CustomEvent("chat-message-swiped", { detail: { id: 1 } }));
    });
    expect(hook.result.current.isOpen, "its own swipe event closed the bubble").toBe(true);
    act(() => {
      window.dispatchEvent(new CustomEvent("chat-message-swiped", { detail: { id: 2 } }));
    });
    expect(hook.result.current.isOpen, "another bubble opening did not close this one").toBe(false);
    swipe(60);
    act(() => {
      window.dispatchEvent(new Event("chat-message-close-all"));
    });
    expect(hook.result.current.isOpen, "scrolling the chat did not close the bubble").toBe(false);
  });

  it("closes on a tap outside, but not on a tap on itself", () => {
    vi.useFakeTimers();
    const { hook, content, swipe } = setup();
    swipe(60);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    act(() => {
      content.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(hook.result.current.isOpen, "a tap on the bubble closed it").toBe(true);
    act(() => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(hook.result.current.isOpen, "a tap outside did not close the bubble").toBe(false);
  });

  it("keeps working when pointer capture throws", () => {
    const { hook, target, swipe, ev, h } = setup();
    target.setPointerCapture.mockImplementation(() => {
      throw new Error("no capture");
    });
    target.releasePointerCapture.mockImplementation(() => {
      throw new Error("no capture");
    });
    swipe(60);
    expect(hook.result.current.isOpen, "a capture error stopped the swipe").toBe(true);
    swipe(-60);
    act(() => h().onPointerCancel(ev(0)));
    expect(hook.result.current.isOpen, "a capture error stopped the close").toBe(false);
  });

  it("works with no bubble element attached", () => {
    const hook = renderHook(() => useMessageSwipe({ id: 3 }));
    act(() => hook.result.current.open());
    expect(hook.result.current.isOpen, "open failed with no element").toBe(true);
    act(() => hook.result.current.close());
    expect(hook.result.current.isOpen, "close failed with no element").toBe(false);
  });
});
