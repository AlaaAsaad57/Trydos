// The order chat widget (components/Chat/ChatWidget.tsx): one conversation in
// a side panel, opened from an order, and the `chat_id` link it cleans up.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const h = vi.hoisted(() => ({ got: null as any }));

vi.mock("components/Chat/pages/ConversationContainer", () => ({
  default: (p: any) => {
    h.got = p;
    return <div data-testid="conversation" />;
  },
}));

import ChatWidget from "components/Chat/ChatWidget";

async function mount(isOpen = true, store: Record<string, any> = {}) {
  const onClose = vi.fn();
  const spies = { openChat: vi.fn(), setMain: vi.fn() };
  const r = await renderWithProviders(<ChatWidget isOpen={isOpen} onClose={onClose} />, {
    store: { activeChat: { id: 7, order_chat_participant_id: 44 }, isNavigating: false, ...spies, ...store },
  });
  return { ...r, onClose, spies };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatWidget", () => {
  it("renders nothing while closed", async () => {
    const { container } = await mount(false);
    expect(container.innerHTML, "a closed widget rendered").toBe("");
  });

  it("shows the order conversation and scrolls to the newest message", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const anchor = document.createElement("div");
    anchor.id = "scroled";
    anchor.scrollIntoView = vi.fn();
    document.body.append(anchor);
    await mount();
    expect(h.got.isPrivate, "the conversation was not opened as an order chat").toBe(44);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(anchor.scrollIntoView, "the widget did not scroll to the newest message").toHaveBeenCalled();
    anchor.remove();
    h.got.setSearch("x");
  });

  it("the backdrop closes the widget and the chat", async () => {
    const { onClose, spies } = await mount();
    fireEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(onClose, "the backdrop did not close the widget").toHaveBeenCalled();
    expect(spies.setMain, "the view did not go back to the list").toHaveBeenCalledWith("main");
    expect(spies.openChat, "the chat was not closed").toHaveBeenCalledWith(null);
  });

  it("removes chat_id from the address after it closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const r = await mount();
    window.history.pushState({}, "", "/gb-en/orders?chat_id=7&tab=1");
    r.unmount();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(window.location.search, "chat_id was left in the address").toBe("?tab=1");
  });

  it("leaves the address alone without chat_id, or while navigating", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const a = await mount();
    window.history.pushState({}, "", "/gb-en/orders?tab=2");
    a.unmount();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(window.location.search, "an address without chat_id was changed").toBe("?tab=2");
    const b = await mount(true, { isNavigating: true });
    window.history.pushState({}, "", "/gb-en/orders?chat_id=8");
    b.unmount();
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(window.location.search, "the address was changed during a navigation").toBe("?chat_id=8");
  });
});
