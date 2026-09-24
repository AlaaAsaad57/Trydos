// Loading the next page of chats when the list end scrolls into view
// (components/Chat/components/GetMoreChats.tsx).
//
// jsdom has no IntersectionObserver, so a stand-in records the callback and a
// test fires "the loader is visible" itself. The chat service is replaced.
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  getChats: null as any,
  logError: null as any,
  observers: [] as any[],
}));

vi.mock("services/chat", () => ({ default: { getChats: (...a: any[]) => h.getChats(...a) } }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));

import GetMoreChats from "components/Chat/components/GetMoreChats";

class FakeObserver {
  disconnect = vi.fn();
  constructor(public cb: any) {
    h.observers.push(this);
  }
  observe() {}
}

const ME = 1;

/** Ten chats, one a day, the newest first, like the chat backend sends them. */
function chats(count = 10, extra: (i: number) => Record<string, any> = () => ({})) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    updated_at: `2030-01-${String(20 - i).padStart(2, "0")}T10:00:00Z`,
    channel_members: [{ user_id: ME, pin: 0 }],
    ...extra(i),
  }));
}

async function mount(data: any[], hasMore = true) {
  const setHasMore = vi.fn();
  const r = await renderWithProviders(<GetMoreChats hasMore={hasMore} setHasMore={setHasMore} />, {
    store: { data, userChat: { id: ME } },
  });
  return { ...r, setHasMore };
}

/** Tell the latest observer that the loader came into view (or did not). */
async function scrollToLoader(visible = true) {
  await act(async () => {
    await h.observers.at(-1).cb([{ isIntersecting: visible }]);
  });
}

beforeEach(() => {
  h.getChats = vi.fn(async () => [{ id: 99 }]);
  h.logError = vi.fn();
  h.observers = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GetMoreChats", () => {
  it("renders nothing for a short list or when there is no more", async () => {
    const a = await mount(chats(5));
    expect(a.container.innerHTML, "a short list showed the loader").toBe("");
    const b = await mount(chats(10), false);
    expect(b.container.innerHTML, "a finished list showed the loader").toBe("");
  });

  it("asks for chats older than the oldest unpinned one it holds", async () => {
    const data = chats(10, (i) => (i === 9 ? { channel_members: [{ user_id: ME, pin: 1 }] } : {}));
    data.push({ id: 50, updated_at: "not a date", channel_members: [] } as any);
    data.push({ id: 51, channel_members: [] } as any);
    await mount(data);
    await scrollToLoader(false);
    expect(h.getChats, "the next page loaded before the loader was visible").not.toHaveBeenCalled();
    await scrollToLoader();
    expect(h.getChats, "the next page did not start after the oldest unpinned chat").toHaveBeenCalledWith(
      true,
      10,
      10,
      "2030-01-12T10:00:00Z",
    );
  });

  it("stops for good when a page brings nothing new", async () => {
    const data = chats(10);
    h.getChats = vi.fn(async () => [{ id: 1 }, { id: 2 }]);
    const { setHasMore } = await mount(data);
    await scrollToLoader();
    expect(setHasMore, "a page with nothing new did not end the list").toHaveBeenCalledWith(false);
    await scrollToLoader();
    expect(h.getChats, "the list asked again after it ended").toHaveBeenCalledTimes(1);
  });

  it("keeps going after a page with new chats or a failed request", async () => {
    const { setHasMore } = await mount(chats(10));
    await scrollToLoader();
    h.getChats = vi.fn(async () => undefined);
    await scrollToLoader();
    h.getChats = vi.fn(async () => {
      throw new Error("page refused");
    });
    await scrollToLoader();
    expect(setHasMore, "the list ended after a good page or a failure").not.toHaveBeenCalled();
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "the failed page was not logged").toBe("get more chats (pagination) - chat widget");
  });

  it("does not ask twice while a page is loading", async () => {
    let finish: any;
    h.getChats = vi.fn(() => new Promise((r) => (finish = r)));
    await mount(chats(10));
    const cb = h.observers.at(-1).cb;
    act(() => {
      cb([{ isIntersecting: true }]);
    });
    act(() => {
      cb([{ isIntersecting: true }]);
    });
    expect(h.getChats, "a second page request started while one was loading").toHaveBeenCalledTimes(1);
    await act(async () => finish([{ id: 77 }]));
  });

  it("does not ask without a usable cursor", async () => {
    await mount(chats(10, () => ({ updated_at: null })));
    await scrollToLoader();
    expect(h.getChats, "a page was asked with no cursor").not.toHaveBeenCalled();
  });
});
