// A chat message that fails to send must tell the user.
//
// The chat shows a message at once, as a pending copy, and `SendMessage`
// (store/chat/actions.tsx) posts it to the chat backend in the background.
// When the chat backend refused it, `SendMessage` removed the pending copy and
// logged to Sentry — and said nothing. The message just disappeared. The
// "Failed to send message" toast in ConversationContainer never ran, because
// that caller does not await `SendMessage` and `SendMessage` catches its own
// errors.
import { beforeEach, describe, expect, it, vi } from "vitest";

const showErrorNotification = vi.fn();

vi.mock("store/notifications/reducer", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    showErrorNotification: (...args: any[]) => showErrorNotification(...args),
  };
});

const fetchData = vi.fn();

vi.mock("utils/fetchData", () => ({
  fetchData: (request: any) => fetchData(request),
}));

const { logError, fb, getChats } = vi.hoisted(() => ({
  logError: vi.fn(),
  getChats: vi.fn(),
  fb: {
    onValue: vi.fn(),
    ref: vi.fn((_db: any, path: string) => ({ path })),
    push: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, LogError: (...a: any[]) => logError(...a) };
});

vi.mock("firebase/database", () => fb);

vi.mock("utils/firebaseInitv1", () => ({ getDb: async () => ({ db: true }) }));

vi.mock("components/Chat/chatsFunctions", () => ({
  showDate: (d: any) => `shown:${d}`,
}));

vi.mock("services/chat", () => ({ default: { getChats: (...a: any[]) => getChats(...a) } }));

const CHANNEL_ID = "539";
const LOCAL_ID = "m123";

describe("sending a chat message", () => {
  beforeEach(() => {
    showErrorNotification.mockClear();
    fetchData.mockReset();
  });

  it("shows an error toast when the chat backend refuses the message", async () => {
    fetchData.mockResolvedValue({ success: false, message: "Server Error" });
    const { SendMessage } = await import("store/chat/actions");

    await SendMessage(
      { cid: CHANNEL_ID, mid: LOCAL_ID, content: "hello", message_type: "TextMessage" },
      false,
    );

    expect(
      showErrorNotification,
      "the chat backend refused the message and the user was not told — the message just disappeared",
    ).toHaveBeenCalledWith("Failed to send message");
  });

  it("shows no error toast when the message is sent", async () => {
    fetchData.mockResolvedValue({
      success: true,
      data: { id: "900", channel_id: CHANNEL_ID },
    });
    const { SendMessage } = await import("store/chat/actions");

    await SendMessage(
      { cid: CHANNEL_ID, mid: LOCAL_ID, content: "hello", message_type: "TextMessage" },
      false,
    );

    expect(
      showErrorNotification,
      "a message the chat backend accepted still raised a failure toast",
    ).not.toHaveBeenCalled();
  });
});

describe("sending a chat message — the answer the chat backend gives", () => {
  beforeEach(() => {
    fetchData.mockReset();
    showErrorNotification.mockClear();
  });

  it("a new chat gets the real channel from the answer", async () => {
    const { useAppStore } = await import("store");
    const sendNewMessage = vi.fn();
    const sendRealMessage = vi.fn();
    useAppStore.setState({ sendNewMessage, sendRealMessage } as any);
    fetchData.mockResolvedValue({ success: true, data: { id: 1, channel_id: 9 } });
    const { SendMessage } = await import("store/chat/actions");

    await SendMessage({ cid: "ch1", mid: "m1" }, "ch1");
    expect(sendNewMessage.mock.calls[0]?.[0]?.channel?.id, "a new chat did not take the channel id from the chat backend").toBe(9);

    await SendMessage({ cid: 9, mid: "m2" }, false, 44);
    expect(JSON.parse(fetchData.mock.calls.at(-1)![0].body).order_chat_participant_id, "a private message was not sent with the order participant id").toBe(44);
    expect(sendRealMessage.mock.calls[0]?.[0], "the private answer was not stored against the pending copy").toMatchObject({ mid: "m2", cid: 9, isPrivate: 44 });

    sendRealMessage.mockClear();
    fetchData.mockResolvedValue({ success: true, data: {} });
    await SendMessage({ cid: 9, mid: "m3" }, false);
    expect(sendRealMessage, "an answer with no message id was stored").not.toHaveBeenCalled();
  });

  // The chat list comes in pages, so the chat a contact leads to may not be
  // loaded yet. The first message then turns the placeholder into that chat
  // with only the new message, and the history showed only after a reload.
  it("a first message into a chat that is not loaded yet loads its earlier messages", async () => {
    const { useAppStore } = await import("store");
    useAppStore.setState({ data: [], sendNewMessage: vi.fn(), setPageData: vi.fn() } as any);
    fetchData.mockResolvedValue({ success: true, data: { id: 77, channel_id: 40 } });
    const { SendMessage } = await import("store/chat/actions");

    await SendMessage({ cid: "ch-8", mid: "m1" }, "ch-8");

    expect(
      fetchData.mock.calls.map(([p]) => p.url),
      "the earlier messages of the chat the backend used were not asked for",
    ).toContain("/api/v1/messages/messages_of_channel/40?message_id=77&limit=10");
  });

  it("a first message into a loaded chat asks for no earlier messages", async () => {
    const { useAppStore } = await import("store");
    useAppStore.setState({ data: [{ id: 40, messages: [] }], sendNewMessage: vi.fn(), setPageData: vi.fn() } as any);
    fetchData.mockResolvedValue({ success: true, data: { id: 77, channel_id: 40 } });
    const { SendMessage } = await import("store/chat/actions");

    await SendMessage({ cid: "ch-8", mid: "m1" }, "ch-8");

    expect(
      fetchData.mock.calls.map(([p]) => p.url).filter((url) => url.includes("messages_of_channel")),
      "a loaded chat's history was asked for again",
    ).toEqual([]);
  });

  it("logs a thrown non-Error as text", async () => {
    fetchData.mockRejectedValue("boom");
    const { SendMessage } = await import("store/chat/actions");
    logError.mockClear();
    await SendMessage({ cid: 1, mid: "x" }, false);
    expect(logError.mock.calls[0]?.[0]?.error, "a thrown string was not logged as text").toBe("boom");
  });
});

describe("chat actions — calls to the chat backend", () => {
  beforeEach(() => {
    fetchData.mockReset();
    logError.mockClear();
    getChats.mockClear();
    Object.values(fb).forEach((f: any) => f.mockClear());
  });

  /** Run an action once with a refused answer and return what it logged. */
  async function refusedScenario(run: () => Promise<any>) {
    fetchData.mockResolvedValueOnce({ success: false, message: "refused" });
    await run();
    return logError.mock.calls.at(-1)?.[0];
  }

  it("GetLastSeen stores the server time and follows the friend's status", async () => {
    const { useAppStore } = await import("store");
    const setServerTime = vi.fn();
    const setIsTyping = vi.fn();
    useAppStore.setState({ setServerTime, setIsTyping } as any);
    fetchData.mockResolvedValue({ success: true, data: "T" });
    const { GetLastSeen } = await import("store/chat/actions");
    await GetLastSeen(5, 7);
    expect(setServerTime, "the server time from the chat backend was not stored").toHaveBeenCalledWith("T");
    expect(fb.ref.mock.calls[0]?.[1], "the friend's status path was wrong").toBe("ConnectStatus/7");

    const listener = fb.onValue.mock.calls[0][1];
    await listener({ val: () => "2030-01-01" });
    expect(setIsTyping, "a last-seen date was not stored").toHaveBeenLastCalledWith({ id: "5", date: "2030-01-01" });
    await listener({ val: () => ({ k: "typing" }) });
    expect(setIsTyping, "a typing status was not shown").toHaveBeenLastCalledWith({ id: "5", desc: "shown:typing" });
    await listener({ val: () => ({}) });
    expect(setIsTyping, "an empty status did not clear the typing line").toHaveBeenLastCalledWith({ id: "5", desc: null });
    await listener({ val: () => null });
    expect(setIsTyping, "no status did not clear the line").toHaveBeenLastCalledWith({ id: "5", desc: null, date: null });

    const logged = await refusedScenario(() => GetLastSeen(5, 7));
    expect(logged, "a refused server-time call was not logged").toEqual({ scenario: "Error in GetLastSeen in  chat/actions", error: "refused" });
    fetchData.mockRejectedValueOnce("x");
    await GetLastSeen(5, 7);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("x");
  });

  it("setLastSeen writes my server time to my status", async () => {
    const { useAppStore } = await import("store");
    useAppStore.setState({ setServerTime: vi.fn() } as any);
    fetchData.mockResolvedValue({ success: true, data: "T2" });
    fb.set.mockResolvedValueOnce(undefined);
    const { setLastSeen } = await import("store/chat/actions");
    await setLastSeen(3);
    expect(fb.set.mock.calls[0]?.[0]?.path, "my status path was wrong").toBe("ConnectStatus/3");
    expect(fb.set.mock.calls[0]?.[1], "my server time was not written").toBe("T2");

    fb.set.mockRejectedValueOnce(new Error("denied"));
    await setLastSeen(3);
    await new Promise((r) => setTimeout(r, 0));
    expect(logError.mock.calls.at(-1)?.[0]?.message, "a refused status write was not logged").toBe("denied");

    const logged = await refusedScenario(() => setLastSeen(3));
    expect(logged?.scenario, "a refused server-time call was not logged").toBe("Error in setLastSeen in  chat/actions");
    fetchData.mockRejectedValueOnce("y");
    await setLastSeen(3);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("y");
  });

  it("watchChannel and Recive report the channel, and log a refusal", async () => {
    const { watchChannel, Recive } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true });
    await watchChannel(12);
    expect(fetchData.mock.calls[0][0].url, "the watched call went to the wrong address").toBe("/api/v1/channels/12/watched");
    await Recive(12);
    expect(fetchData.mock.calls[1][0].url, "the received call went to the wrong address").toBe("/api/v1/channels/12/received");
    expect((await refusedScenario(() => watchChannel(1)))?.scenario, "a refused watch was not logged").toBe("Error in watchChannel in  chat/actions");
    expect((await refusedScenario(() => Recive(1)))?.scenario, "a refused receive was not logged").toBe("Error in Recive in  chat/actions");
    fetchData.mockRejectedValueOnce("w");
    await watchChannel(1);
    fetchData.mockRejectedValueOnce("r");
    await Recive(1);
    expect(logError.mock.calls.slice(-2).map((c) => c[0].error), "thrown strings were not logged").toEqual(["w", "r"]);
  });

  it("DeleteMessageApi and deleteChat send the right body", async () => {
    const { DeleteMessageApi, deleteChat } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true });
    await DeleteMessageApi(4, true);
    await DeleteMessageApi(4, false);
    expect(fetchData.mock.calls.map((c) => JSON.parse(c[0].body).delete_for_all), "delete-for-all was not sent as 1/0").toEqual([1, 0]);
    await deleteChat(8);
    expect(JSON.parse(fetchData.mock.calls[2][0].body), "the chat id was not sent").toEqual({ id: 8 });
    fetchData.mockRejectedValueOnce(new Error("gone"));
    await deleteChat(8);
    expect(logError.mock.calls.at(-1)?.[0], "a failed chat delete was not logged").toEqual({ scenario: "Error in deleteChat in  chat/actions", error: "gone" });
    fetchData.mockRejectedValueOnce("s");
    await deleteChat(8);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("s");
  });

  it("getPage and getMessagesBetweenTwoMessages store the page", async () => {
    const { useAppStore } = await import("store");
    const setPageData = vi.fn();
    useAppStore.setState({ setPageData } as any);
    const { getPage, getMessagesBetweenTwoMessages } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    await getPage(3, 10);
    expect(fetchData.mock.calls[0][0].url, "the page address was wrong").toBe("/api/v1/messages/messages_of_channel/3?message_id=10&limit=10");
    expect(setPageData, "the page was not stored").toHaveBeenCalledWith({ mes: [{ id: 1 }], ch: 3 });
    await getMessagesBetweenTwoMessages({ first: 1, second: 2, channel_id: 3 });
    expect(JSON.parse(fetchData.mock.calls[1][0].body), "the range body was wrong").toEqual({ channel_id: 3, first_message_id: 1, second_message_id: 2 });
    expect((await refusedScenario(() => getPage(3, 1)))?.scenario, "a refused page was not logged").toBe("Error in getMessagesBetweenMessage in  chat/actions");
    fetchData.mockRejectedValueOnce("p");
    await getPage(3, 1);
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("p");
    fetchData.mockResolvedValueOnce({ success: false, message: "no range" });
    await expect(getMessagesBetweenTwoMessages({ first: 1, second: 2, channel_id: 3 }), "a refused range did not throw to the caller").rejects.toThrow("no range");
  });

  it("SearchContact searches only with text and stores the results", async () => {
    const { useAppStore } = await import("store");
    const setChatSearchResults = vi.fn();
    useAppStore.setState({ setChatSearchResults } as any);
    const { SearchContact } = await import("store/chat/actions");
    await SearchContact("");
    expect(fetchData, "an empty search reached the chat backend").not.toHaveBeenCalled();
    fetchData.mockResolvedValue({ success: true, data: ["a"] });
    await SearchContact("a b");
    expect(fetchData.mock.calls[0][0].url, "the search text was not encoded").toBe("/api/v1/users/search/a%20b");
    expect(setChatSearchResults, "the results were not stored").toHaveBeenCalledWith(["a"]);
    expect((await refusedScenario(() => SearchContact("x")))?.scenario, "a refused search was not logged").toBe("Error in SearchContact in  chat/actions");
    fetchData.mockRejectedValueOnce("q");
    await SearchContact("x");
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("q");
  });

  it("PinnChat and MuteChat send 1/0 and PinnChat reloads the chats", async () => {
    const { PinnChat, MuteChat } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true });
    await PinnChat({ id: 1, member_id: 2, value: true });
    await PinnChat({ id: 1, member_id: 2, value: false });
    expect(fetchData.mock.calls.map((c) => JSON.parse(c[0].body).pin), "pin was not sent as 1/0").toEqual([1, 0]);
    expect(getChats, "the chat list was not reloaded after pinning").toHaveBeenCalledWith(true);
    await MuteChat({ id: 1, member_id: 2, value: true });
    await MuteChat({ id: 1, member_id: 2, value: false });
    expect(fetchData.mock.calls.slice(2).map((c) => JSON.parse(c[0].body).mute), "mute was not sent as 1/0").toEqual([1, 0]);
    expect((await refusedScenario(() => PinnChat({ id: 1 })))?.scenario, "a refused pin was not logged").toBe("chat store action failed");
    expect((await refusedScenario(() => MuteChat({ id: 1 })))?.scenario, "a refused mute was not logged").toBe("Error in MuteChat in  chat/actions");
    fetchData.mockRejectedValueOnce("m");
    await MuteChat({ id: 1 });
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("m");
  });

  it("getContacts and GetChatDetails store what the chat backend sent", async () => {
    const { useAppStore } = await import("store");
    const setContacts = vi.fn();
    const editChatInfo = vi.fn();
    useAppStore.setState({ setContacts, editChatInfo } as any);
    const { getContacts, GetChatDetails } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true, data: ["c"] });
    await getContacts();
    expect(setContacts, "the contacts were not stored").toHaveBeenCalledWith(["c"]);
    await GetChatDetails(6);
    expect(fetchData.mock.calls[1][0].url, "the chat details address did not carry the chat id").toMatch(/channels\/6\/media$/);
    expect(editChatInfo, "the chat details were not stored").toHaveBeenCalledWith({ id: 6, data: ["c"] });
    expect((await refusedScenario(() => getContacts()))?.scenario, "a refused contacts call was not logged").toBe("Error in getContacts in  chat/actions");
    expect((await refusedScenario(() => GetChatDetails(6)))?.scenario, "a refused details call was not logged").toBe("Error in GetChatDetails in  chat/actions");
    fetchData.mockRejectedValueOnce("c1");
    await getContacts();
    fetchData.mockRejectedValueOnce("c2");
    await GetChatDetails(6);
    expect(logError.mock.calls.slice(-2).map((c) => c[0].error), "thrown strings were not logged").toEqual(["c1", "c2"]);
  });

  it("getMedia stores one media page for the chat info panel", async () => {
    const { useAppStore } = await import("store");
    const editChatInfoMedia = vi.fn();
    useAppStore.setState({ editChatInfoMedia } as any);
    const { getMedia } = await import("store/chat/actions");
    fetchData.mockResolvedValue({ success: true, data: ["img"] });
    await getMedia(6, "ImageMessage");
    expect(fetchData.mock.calls[0][0].url, "the media page address was wrong").toBe("/api/v1/messages/messages_of_channel/6?limit=10&message_type=ImageMessage");
    expect(editChatInfoMedia, "the media page was not stored").toHaveBeenCalledWith({ id: 6, data: ["img"], media: "ImageMessage" });
    expect((await refusedScenario(() => getMedia(6, "x")))?.scenario, "a refused media call was not logged").toBe("Error in getMedia in  chat/actions");
    fetchData.mockRejectedValueOnce("g");
    await getMedia(6, "x");
    expect(logError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged").toBe("g");
  });

  // A `ch-<user id>` chat is a placeholder for a person with no chat yet. The
  // chat backend has no channel by that id, so asking it for media only fails.
  it("GetChatDetails and getMedia ask nothing for a placeholder ch- chat", async () => {
    const { GetChatDetails, getMedia } = await import("store/chat/actions");
    await GetChatDetails("ch-8");
    expect(fetchData.mock.calls.map(([p]) => p.url), "the chat details of a placeholder chat were asked for").toEqual([]);
    await getMedia("ch-8", "ImageMessage");
    expect(fetchData.mock.calls.map(([p]) => p.url), "the images of a placeholder chat were asked for").toEqual([]);
  });

  it("getMediaReducer names the count for each media type", async () => {
    const { getMediaReducer } = await import("store/chat/actions");
    expect(getMediaReducer("ImageMessage", 1), "images were not counted").toEqual({ image_messages: 1 });
    expect(getMediaReducer("VideoMessage", 2), "videos were not counted").toEqual({ video_messages: 2 });
    expect(getMediaReducer("FileMessage", 3), "files were not counted").toEqual({ file_messages: 3 });
    expect(getMediaReducer("Other", 4), "an unknown type got a count").toBeUndefined();
  });
});

// Message edit, tags and reminders; chat archive and unread
// (store/chat/actions.tsx). Each answer below is the shape the staging chat
// backend gave on 2026-09-26, cut down to the fields the action reads.
describe("chat actions — edit, tags, reminders, archive and unread", () => {
  /** Store actions the chat actions call, recorded. */
  async function seedStore() {
    const { useAppStore } = await import("store");
    const spies = {
      patchMessage: vi.fn(),
      archiveChat: vi.fn(),
      setUnreadChat: vi.fn(),
      setReminders: vi.fn(),
      removeReminder: vi.fn(),
      setArchivedChats: vi.fn(),
    };
    useAppStore.setState(spies as any);
    return spies;
  }

  /** The request the action sent, with its body parsed. */
  const sent = (n = 0) => {
    const request = fetchData.mock.calls[n]?.[0] ?? {};
    return { ...request, body: request.body ? JSON.parse(request.body) : undefined };
  };

  beforeEach(() => {
    fetchData.mockReset();
    logError.mockClear();
    showErrorNotification.mockClear();
  });

  it("EditMessageApi sends the new text and stores the edited message, not its reminder", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({
      success: true,
      data: { id: "339496", is_edited: 1, message_content: { content: "Tr" }, tags: [], reminder: null },
    });
    const { EditMessageApi } = await import("store/chat/actions");
    const saved = await EditMessageApi(539, "339496", "Tr");

    expect(saved, "a saved edit did not report success").toBe(true);
    expect(sent(), "the edit request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/messages/update",
      method: "POST",
      server: "chat",
      noMessage: true,
      body: { id: "339496", content: "Tr" },
    });
    expect(spies.patchMessage.mock.calls[0]?.[0], "the edited message was not stored").toEqual({
      ch_id: 539,
      msg_id: "339496",
      patch: { id: "339496", is_edited: 1, message_content: { content: "Tr" }, tags: [] },
    });
  });

  it("EditMessageApi tells the user when the chat backend refuses the edit", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({ success: false, httpStatus: 403, message: "Only the message sender can edit this message" });
    const { EditMessageApi } = await import("store/chat/actions");
    expect(await EditMessageApi(539, "339494", "hi"), "a refused edit reported success").toBe(false);
    expect(showErrorNotification, "a refused edit showed no error").toHaveBeenCalledWith("Failed to edit the message");
    expect(spies.patchMessage, "a refused edit changed the message").not.toHaveBeenCalled();
  });

  it("ToggleMessageTag toggles the tag and stores the full tag list", async () => {
    const spies = await seedStore();
    const tags = [{ tag: "urgent", count: 2, user_ids: [657, 672] }];
    fetchData.mockResolvedValueOnce({ success: true, data: { message_id: "5", tag: "urgent", action: "added", tags } });
    const { ToggleMessageTag } = await import("store/chat/actions");
    await ToggleMessageTag(539, "5", "urgent");

    expect(sent(), "the tag request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/messages/5/tags",
      method: "POST",
      noMessage: true,
      body: { tag: "urgent", action: "toggle" },
    });
    expect(spies.patchMessage, "the tag list from the chat backend was not stored").toHaveBeenCalledWith({ ch_id: 539, msg_id: "5", patch: { tags } });
  });

  it("ToggleMessageTag tells the user when the tag change fails", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({ success: false, httpStatus: 500, message: "Table message_tags does not exist" });
    const { ToggleMessageTag } = await import("store/chat/actions");
    expect(await ToggleMessageTag(539, "5", "todo"), "a failed tag change reported success").toBe(false);
    expect(showErrorNotification, "a failed tag change showed no error").toHaveBeenCalledWith("Failed to update the tag");
    expect(spies.patchMessage, "a failed tag change still changed the tags").not.toHaveBeenCalled();
  });

  it("SetMessageReminder sends the time in ISO form, stores the reminder and reloads my list", async () => {
    const spies = await seedStore();
    fetchData
      .mockResolvedValueOnce({
        success: true,
        data: { message_id: "5", id: "r-1", remind_at: "2030-01-01T09:00:00.000Z", created_at: "2026-09-26T09:00:00.000Z" },
      })
      .mockResolvedValueOnce({ success: true, data: [] });
    const { SetMessageReminder } = await import("store/chat/actions");
    await SetMessageReminder(539, "5", new Date("2030-01-01T09:00:00.000Z"));

    expect(sent(0), "the reminder request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/messages/5/reminders",
      method: "POST",
      noMessage: true,
      body: { remind_at: "2030-01-01T09:00:00.000Z" },
    });
    expect(spies.patchMessage.mock.calls[0]?.[0]?.patch, "the new reminder was not put on the message").toEqual({
      reminder: { id: "r-1", remind_at: "2030-01-01T09:00:00.000Z", created_at: "2026-09-26T09:00:00.000Z" },
    });
    await vi.waitFor(() =>
      expect(sent(1).url, "my reminder list was not reloaded after a new reminder").toBe("/api/v1/messages/reminders"),
    );
  });

  it("CancelMessageReminder deletes by the reminder id and clears it everywhere", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({ success: true, hasContent: false, data: null });
    const { CancelMessageReminder } = await import("store/chat/actions");
    await CancelMessageReminder(539, "5", "r-1");

    expect(sent(), "the cancel request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/messages/reminders/r-1",
      method: "DELETE",
      noMessage: true,
    });
    expect(spies.patchMessage, "the reminder stayed on the message").toHaveBeenCalledWith({ ch_id: 539, msg_id: "5", patch: { reminder: null } });
    expect(spies.removeReminder, "the reminder stayed in my list").toHaveBeenCalledWith("r-1");
  });

  it("ArchiveChannel sends 1 or 0, never a boolean, and moves the chat", async () => {
    const spies = await seedStore();
    fetchData
      .mockResolvedValueOnce({ success: true, data: { channel_id: 539, channel_member_id: 1078, archived: 1 } })
      .mockResolvedValueOnce({ success: true, data: { channel_id: 539, channel_member_id: 1078, archived: 0 } });
    const { ArchiveChannel } = await import("store/chat/actions");
    await ArchiveChannel(539, true);
    await ArchiveChannel(539, false);

    expect(sent(0), "the archive request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/channels/539/archive",
      method: "POST",
      noMessage: true,
      body: { archived: 1 },
    });
    expect(sent(1).body, "the unarchive request did not send 0").toEqual({ archived: 0 });
    expect(spies.archiveChat.mock.calls, "the chat did not move between the lists").toEqual([
      [{ id: 539, archived: true }],
      [{ id: 539, archived: false }],
    ]);
  });

  it("ArchiveChannel leaves the chat where it is when the chat backend refuses", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({ success: false, httpStatus: 400, message: "Bad Request" });
    const { ArchiveChannel } = await import("store/chat/actions");
    await ArchiveChannel(539, true);
    expect(showErrorNotification, "a refused archive showed no error").toHaveBeenCalledWith("Failed to archive the chat");
    expect(spies.archiveChat, "a refused archive still moved the chat").not.toHaveBeenCalled();
  });

  it("MarkChannelUnread tells the chat backend, then marks the chat", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({ success: true, data: { channel_id: 539, total_unread_message_count: 1 } });
    const { MarkChannelUnread } = await import("store/chat/actions");
    await MarkChannelUnread(539);
    expect(sent(), "the unread request to the chat backend was wrong").toMatchObject({
      url: "/api/v1/channels/539/unread",
      method: "POST",
      noMessage: true,
    });
    expect(spies.setUnreadChat, "the chat was not marked unread").toHaveBeenCalledWith({ id: 539, value: true });
  });

  it("GetArchivedChats asks my_channels for archived chats only, pinned ones included", async () => {
    const spies = await seedStore();
    fetchData.mockResolvedValueOnce({
      success: true,
      data: { channels: [{ id: 539 }], pinned_channels: [{ id: 7 }] },
    });
    const { GetArchivedChats } = await import("store/chat/actions");
    await GetArchivedChats();
    expect(sent().body?.archived, "the archived list was not asked with archived: true").toBe(true);
    expect(spies.setArchivedChats, "the archived chats were not stored").toHaveBeenCalledWith([{ id: 7 }, { id: 539 }]);
  });

  it("GetTaggedMessages asks the chat's messages with one tag", async () => {
    fetchData.mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    const { GetTaggedMessages } = await import("store/chat/actions");
    const found = await GetTaggedMessages(539, "important");
    expect(sent(), "the tag filter request was wrong").toMatchObject({
      url: "/api/v1/messages/messages_of_channel/539",
      method: "POST",
      body: { limit: 50, tag: "important" },
    });
    expect(found, "the tagged messages were not returned").toEqual([{ id: 1 }]);

    fetchData.mockResolvedValueOnce({ success: false, httpStatus: 500, message: "down" });
    expect(await GetTaggedMessages(539, "important"), "a failed load looked like an empty list").toBeNull();
  });
});

describe("chat actions — a reminder that is gone already", () => {
  it("CancelMessageReminder clears a reminder the chat backend no longer has (404), with no error", async () => {
    const { useAppStore } = await import("store");
    const patchMessage = vi.fn();
    const removeReminder = vi.fn();
    useAppStore.setState({ patchMessage, removeReminder } as any);
    fetchData.mockReset();
    showErrorNotification.mockClear();
    fetchData.mockResolvedValueOnce({ success: false, httpStatus: 404, message: "Reminder not found" });
    const { CancelMessageReminder } = await import("store/chat/actions");

    expect(await CancelMessageReminder(539, "5", "1"), "a reminder that is gone was reported as not cancelled").toBe(true);
    expect(patchMessage, "a reminder that is gone stayed on the message").toHaveBeenCalledWith({ ch_id: 539, msg_id: "5", patch: { reminder: null } });
    expect(removeReminder, "a reminder that is gone stayed in my list").toHaveBeenCalledWith("1");
    expect(showErrorNotification, "a reminder that is gone showed an error").not.toHaveBeenCalled();
  });
});
