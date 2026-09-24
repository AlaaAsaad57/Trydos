// The chat service (services/chat.ts): loading chats, contacts and the call
// log, sharing a product, and storing the push token.
//
// Every request goes to the chat backend through `fetchData`, which is
// replaced. The shared store is real; the actions each test watches are
// swapped for spies with `useAppStore.setState`.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchData, logServerError, fb, track, showError, showSuccess } = vi.hoisted(() => ({
  fetchData: vi.fn(),
  logServerError: vi.fn(),
  track: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  fb: {
    onValue: vi.fn(),
    ref: vi.fn((_db: any, path: string) => ({ path })),
  },
}));

vi.mock("utils/fetchData", () => ({ fetchData: (p: any) => fetchData(p) }));
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: any[]) => logServerError(...a),
}));
vi.mock("utils/posthogEvents", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, trackPosthog: (...a: any[]) => track(...a) };
});
vi.mock("@/store/notifications/reducer", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    showErrorNotification: (...a: any[]) => showError(...a),
    showSuccessNotification: (...a: any[]) => showSuccess(...a),
  };
});
vi.mock("firebase/database", () => fb);
vi.mock("utils/firebaseInitv1", () => ({ getDb: async () => ({ db: true }) }));

import { useAppStore } from "store";
import chat from "services/chat";

const ME = 10;
const THEM = 20;

function incoming(extra: Record<string, any> = {}) {
  return {
    sender_user_id: THEM,
    message_type: { name: "TextMessage" },
    message_status: [{ user_id: ME, is_watched: false }],
    auth_message_status: { delete_for_all: false },
    ...extra,
  };
}

function channel(id: any, messages: any[] = []) {
  return {
    id,
    messages,
    channel_members: [{ user_id: ME }, { user_id: THEM }],
  };
}

function seed(extra: Record<string, any> = {}) {
  const spies = {
    setChatLoading: vi.fn(),
    setChatDone: vi.fn(),
    setChats: vi.fn(),
    setIsTyping: vi.fn(),
    setLastNotificationDate: vi.fn(),
    setContacts: vi.fn(),
    setFirebaseToken: vi.fn(),
    setCallLoading: vi.fn(),
    setCalls: vi.fn(),
  };
  useAppStore.setState({ userChat: { id: ME }, language: "en", ...spies, ...extra } as any);
  return spies;
}

beforeEach(() => {
  fetchData.mockReset();
  logServerError.mockClear();
  track.mockClear();
  showError.mockClear();
  showSuccess.mockClear();
  fb.onValue.mockClear();
  fb.ref.mockClear();
  localStorage.clear();
});

describe("getChats", () => {
  it("does nothing without a chat user", async () => {
    seed({ userChat: null });
    expect(await chat.getChats(false), "getChats ran without a chat user").toBeUndefined();
    expect(fetchData, "chats were requested without a chat user").not.toHaveBeenCalled();
  });

  it("loads the chats, marks new ones as received, and follows typing", async () => {
    const s = seed();
    const withNew = channel(1, [incoming()]);
    const pinned = channel(2, [incoming({ message_type: { name: "VoiceCall" } })]);
    fetchData.mockImplementation(async (p: any) =>
      p.url.includes("my_channels")
        ? { success: true, data: { channels: [withNew, channel("ch-5", [incoming()])], pinned_channels: [pinned] } }
        : { success: true },
    );
    const result = await chat.getChats(false, 5, 7, "ts" as any);

    const first = fetchData.mock.calls[0][0];
    expect(first.url, "the chat list query was wrong").toMatch(/my_channels\?limit=5&messages_limit=7&timestamp=ts$/);
    expect(JSON.parse(first.body), "the chat list body was wrong").toEqual({ limit: 5, messages_limit: 7, role_id: 16, timestamp: "ts" });
    expect(s.setChatLoading, "the first load did not show the loading state").toHaveBeenCalled();
    const receivedUrls = fetchData.mock.calls.map((c) => c[0].url).filter((u: string) => u.endsWith("/received"));
    expect(receivedUrls, "only the chat with a new text message should be marked received").toEqual(["/api/v1/channels/1/received"]);
    expect(s.setChats, "the chats were not stored").toHaveBeenCalledWith([withNew, expect.anything()], [pinned]);
    expect(fb.ref.mock.calls[0]?.[1], "typing was not followed for the other member").toBe(`Transaction/${THEM}/${ME}`);
    expect(result?.map((c: any) => c.id), "getChats did not return all the chats").toEqual([1, "ch-5", 2]);
    expect(s.setLastNotificationDate, "the last load time was not stored").toHaveBeenCalled();
    expect(s.setChatDone, "the loading flag was not lowered").toHaveBeenCalled();

    const listener = fb.onValue.mock.calls[0][1];
    listener({ val: () => "typing..." });
    expect(s.setIsTyping, "a typing text was not shown").toHaveBeenLastCalledWith({ id: 1, desc: "typing..." });
    listener({ val: () => ({ a: "recording" }) });
    expect(s.setIsTyping, "a typing object was not shown").toHaveBeenLastCalledWith({ id: 1, desc: "recording" });
    listener({ val: () => ({}) });
    expect(s.setIsTyping, "an empty typing object did not clear the line").toHaveBeenLastCalledWith({ id: 1, desc: null });
    listener({ val: () => null });
    expect(s.setIsTyping, "no typing did not clear the line").toHaveBeenLastCalledWith({ id: 1, desc: null });
  });

  it("a refresh does not show the loading state, and empty lists still load", async () => {
    const s = seed();
    fetchData.mockResolvedValue({ success: true, data: { channels: [], pinned_channels: [] } });
    await chat.getChats(true);
    expect(s.setChatLoading, "a refresh showed the loading state").not.toHaveBeenCalled();
    expect(fetchData.mock.calls[0][0].url, "a load with no timestamp still sent one").not.toContain("timestamp");
  });

  it("logs a failed 'received' call with the channel id", async () => {
    seed();
    fetchData.mockImplementation(async (p: any) => {
      if (p.url.includes("my_channels"))
        return { success: true, data: { channels: [channel(1, [incoming()]), channel(3, [incoming()]), channel(4, [incoming()])], pinned_channels: [] } };
      if (p.url.includes("/1/")) return { success: false, message: "refused" };
      if (p.url.includes("/3/")) return { success: false };
      throw new Error("down");
    });
    await chat.getChats(true);
    const scenarios = logServerError.mock.calls.map((c) => [c[0].scenario, c[0].error?.message]);
    expect(scenarios, "each failed 'received' call was not logged with its reason").toEqual([
      ["Error In sendReceivedForChannelsWithNewMessages in services/chat for channel 1", "refused"],
      ["Error In sendReceivedForChannelsWithNewMessages in services/chat for channel 3", "Failed to mark as received"],
      ["Error In sendReceivedForChannelsWithNewMessages in services/chat for channel 4", "down"],
    ]);
  });

  it("skips 'received' when the chat user has gone and when data is missing", async () => {
    seed();
    fetchData.mockImplementation(async () => {
      useAppStore.setState({ userChat: null } as any);
      return { success: true, data: { channels: [channel(1, [incoming()])], pinned_channels: [] } };
    });
    await chat.getChats(true);
    expect(fetchData.mock.calls.filter((c) => c[0].url.endsWith("/received")).length, "a 'received' call was made with no chat user").toBe(0);

    seed();
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true, data: {} });
    await chat.getChats(true);
    expect(logServerError.mock.calls.at(-1)?.[0]?.scenario, "an answer with no channel list was not logged").toBe("Error In getChats in services/chat");
  });

  it("logs a refused chat list and still lowers the loading flag", async () => {
    const s = seed();
    fetchData.mockResolvedValue({ success: false, message: "no chats" });
    await chat.getChats(false);
    expect(logServerError.mock.calls[0]?.[0]?.error?.message, "the refusal was not logged").toBe("no chats");
    expect(s.setChatDone, "the loading flag stayed up after a refusal").toHaveBeenCalled();
  });
});

describe("ShareProduct", () => {
  it("shares, reloads the chats, tracks the event and calls back", async () => {
    seed();
    fetchData.mockImplementation(async (p: any) =>
      p.url.includes("share_product") ? { success: true } : { success: true, data: { channels: [], pinned_channels: [] } },
    );
    const callback = vi.fn();
    await chat.ShareProduct({ userId: [THEM], product: { id: 1, slug: "s" }, callback });
    const body = JSON.parse(fetchData.mock.calls[0][0].body);
    expect(body.content[0], "the product was not sent at 400x400").toMatchObject({ id: 1, product_image_width: 400, product_image_height: 400 });
    expect(track, "the share was not tracked").toHaveBeenCalledWith("chat_product_shared", { product_id: 1, product_slug: "s", receiver_user_id: [THEM] });
    expect(showSuccess, "the shopper was not told the share worked").toHaveBeenCalledWith("Product is Shared Successfully");
    expect(callback, "the caller was not called back").toHaveBeenCalled();
  });

  it("a refused share tells the shopper and throws", async () => {
    seed();
    fetchData.mockResolvedValue({ success: false, message: "no share" });
    await expect(chat.ShareProduct({ userId: [1], product: {}, callback: vi.fn() }), "a refused share did not throw").rejects.toThrow();
    expect(showError, "the shopper was not told the share failed").toHaveBeenCalledWith("Product Share error");
  });
});

describe("StoreToken", () => {
  it("stores the push token and its id", async () => {
    const s = seed();
    fetchData.mockResolvedValue({ success: true, data: { id: 77 } });
    await chat.StoreToken({ token: "push" });
    expect(s.setFirebaseToken, "the push token was not stored").toHaveBeenCalledWith("push");
    expect(localStorage.getItem("firebase_id"), "the token id was not kept").toBe("77");
  });

  it("logs a refused token", async () => {
    seed();
    fetchData.mockResolvedValue({ success: false, message: "bad" });
    await chat.StoreToken({ token: "push" });
    expect(logServerError.mock.calls[0]?.[0]?.scenario, "a refused token was not logged").toBe("Error In StoreToken in services/chat");
  });
});

describe("getContacts", () => {
  it("does nothing without a chat user, else stores the contacts", async () => {
    const s = seed({ userChat: null });
    await chat.getContacts();
    expect(fetchData, "contacts were requested without a chat user").not.toHaveBeenCalled();
    const s2 = seed();
    fetchData.mockResolvedValue({ success: true, data: ["c"] });
    await chat.getContacts();
    expect(s2.setContacts, "the contacts were not stored").toHaveBeenCalledWith(["c"]);
    expect(s.setContacts, "the first seed's spy should not be used").not.toHaveBeenCalled();
  });

  it("logs a refused contacts call", async () => {
    seed();
    fetchData.mockResolvedValue({ success: false, message: "x" });
    await chat.getContacts();
    expect(logServerError.mock.calls[0]?.[0]?.scenario, "a refused contacts call was not logged").toBe("Error In getContacts in services/chat");
  });
});

describe("getCalls", () => {
  it("stores the call log page", async () => {
    const s = seed();
    fetchData.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await chat.getCalls(5);
    expect(JSON.parse(fetchData.mock.calls[0][0].body), "the page request was wrong").toEqual({ limit: "20", last_message_id: 5 });
    expect(s.setCalls, "the calls were not stored").toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("logs a refused call log", async () => {
    seed();
    fetchData.mockResolvedValue({ success: false, message: "x" });
    await chat.getCalls();
    expect(logServerError.mock.calls[0]?.[0]?.scenario, "a refused call log was not logged").toBe("Error In getCalls in services/chat");
  });

  it("BUG-chat-1: loading the call log raises the call-log flag, not the 'placing a call' flag", async () => {
    // Real store actions this time, so the test reads the flags the UI reads.
    const initial = useAppStore.getInitialState() as any;
    useAppStore.setState({
      userChat: { id: ME },
      setCallLoading: initial.setCallLoading,
      setCallLoadingState: initial.setCallLoadingState,
      setCalls: initial.setCalls,
      calls: [],
      call_loading: false,
      callLoading: "video",
    } as any);
    let seenWhileLoading: any;
    fetchData.mockImplementation(async () => {
      seenWhileLoading = { ...useAppStore.getState() };
      return { success: true, data: [] };
    });
    await chat.getCalls();
    expect(seenWhileLoading.call_loading, "CallList's loading flag (call_loading) was not raised while the call log loaded").toBe(true);
    expect(useAppStore.getState().callLoading, "loading the call log reset the 'placing a video call' flag").toBe("video");
  });
});
