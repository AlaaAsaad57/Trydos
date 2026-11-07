import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Calls tab loads older calls a page at a time, by the old CallList's rule.
// The chat backend call is mocked: each test gives it one page and checks what
// was asked for, and whether the list goes on.

const chat = vi.hoisted(() => ({ getCalls: vi.fn() }));
vi.mock("services/chat", () => ({ default: chat, CALLS_PAGE_SIZE: 3 }));

import { loadOlderCalls } from "components/DemoApp1/chat/chatPaging";
import { useAppStore } from "store";

const call = (id: number, day: number) => ({ id, created_at: `2026-11-0${day}T10:00:00` });

const initial = useAppStore.getState();
beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ calls: [call(30, 5), call(10, 1), call(20, 3)] } as never);
});
afterEach(() => {
  useAppStore.setState(initial, true);
});

describe("older calls of the Calls tab", () => {
  it("asks the chat backend for the page before the oldest call by time, not by place in the list", async () => {
    chat.getCalls.mockResolvedValue([call(9, 1), call(8, 1), call(7, 1)]);
    await loadOlderCalls();
    expect(chat.getCalls, "the page was not asked for before call 10, the oldest").toHaveBeenCalledWith(10);
  });

  it("says there is more after a full page of new calls", async () => {
    chat.getCalls.mockResolvedValue([call(9, 1), call(8, 1), call(7, 1)]);
    expect(await loadOlderCalls(), "a full page of new calls did not leave the list open").toBe("more");
  });

  it("stops after a short page: it is the last one", async () => {
    chat.getCalls.mockResolvedValue([call(9, 1)]);
    expect(await loadOlderCalls(), "a short page did not end the list").toBe("done");
  });

  it("stops when a full page brings no new call, so the end of the log does not ask for ever", async () => {
    chat.getCalls.mockResolvedValue([call(30, 5), call(10, 1), call(20, 3)]);
    expect(await loadOlderCalls(), "a page of calls already held did not end the list").toBe("done");
  });

  it("may try again after a failed call to the chat backend", async () => {
    chat.getCalls.mockResolvedValue(null);
    expect(await loadOlderCalls(), "a failed page ended the list for good").toBe("again");
  });

  it("asks for nothing with no call loaded", async () => {
    useAppStore.setState({ calls: [] } as never);
    expect(await loadOlderCalls(), "an empty log did not end the list").toBe("done");
    expect(chat.getCalls, "the chat backend was asked with no call to go from").not.toHaveBeenCalled();
  });
});
