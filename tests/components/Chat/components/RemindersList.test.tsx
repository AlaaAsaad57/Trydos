// The Reminders folder of the chat list
// (components/Chat/components/RemindersList.tsx).
//
// A tap on a reminder must open the chat on screen and bring the reminded
// message into view. The message can be far up the chat, and the chat can be
// one the list has not loaded yet, so the row waits for both before it opens
// the chat.
//
// The store is real. The chat backend is a stand-in `fetchData` that answers
// by URL, so each test reads what the row asked the backend for.
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  fetchData: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("utils/fetchData", () => ({
  fetchData: (request: any) => h.fetchData(request),
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => h.showError(...a),
}));
// ChatSearchResults (where openChatFromList lives) draws these rows; the test
// build cannot read the JSX in TypingIndicator.js that ChatItem pulls in.
vi.mock("components/Chat/components/ChatItem", () => ({ default: () => null }));
vi.mock("components/Chat/components/SearchResult", () => ({ default: () => null }));
// Last seen and "watched" reach firebase and the backend; neither matters here.
vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GetLastSeen: vi.fn(),
  watchChannel: vi.fn(),
}));

import RemindersList from "components/Chat/components/RemindersList";
import { useAppStore } from "store";

const ME = 1;
const BILAL = 8;

function msg(id: string, created_at: string) {
  return {
    id,
    created_at,
    sender_user_id: BILAL,
    message_type: { name: "TextMessage" },
    message_content: { content: `text ${id}` },
    message_status: [],
  };
}

/** The chat with Bilal, with its newest page loaded (oldest first). */
function bilalChat(id = "40") {
  return {
    id,
    updated_at: "2026-09-26T10:00:00.000Z",
    messages: [
      msg("90", "2026-09-26T09:00:00.000Z"),
      msg("91", "2026-09-26T09:05:00.000Z"),
    ],
    channel_members: [
      { user_id: ME, pin: 0, mute: 0, user: { name: "Me" } },
      { user_id: BILAL, pin: 0, mute: 0, user: { name: "Bilal" } },
    ],
  };
}

function reminderFor(messageId: string, channelId = "40") {
  return {
    id: `r-${messageId}`,
    remind_at: "2030-01-01T09:00:00.000Z",
    created_at: "2026-09-26T09:00:00.000Z",
    message_id: messageId,
    message: {
      id: messageId,
      channel_id: channelId,
      message_type: "TextMessage",
      content: "call the shop",
      sender_user: { id: BILAL, name: "Bilal", photo_path: null },
      created_at: null,
    },
  };
}

/** Answers every chat backend call; `routes` overrides by URL fragment. */
function backend(routes: Record<string, () => any> = {}) {
  h.fetchData.mockImplementation(async (request: any) => {
    for (const [fragment, answer] of Object.entries(routes)) {
      if (String(request.url).includes(fragment)) return answer();
    }
    // GetMyReminders on mount: keep the list the test seeded.
    if (String(request.url).includes("reminders")) {
      return { success: true, data: useAppStore.getState().reminders };
    }
    return { success: true, data: null };
  });
}

async function mount(store: Record<string, any>) {
  await renderWithProviders(<RemindersList onBack={vi.fn()} />, {
    store: {
      userChat: { id: ME },
      main: "main",
      activeChat: null,
      archivedChats: [],
      forwarded_message: null,
      ...store,
    },
  });
}

const row = () =>
  document.querySelector('[data-pw="REMINDER-ROW"] button') as HTMLButtonElement;

beforeEach(() => {
  h.fetchData.mockReset();
  h.showError.mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("RemindersList — tapping a reminder", () => {
  it("opens the chat on screen at a message that is already loaded", async () => {
    backend();
    await mount({ data: [bilalChat()], reminders: [reminderFor("91")] });

    await act(async () => fireEvent.click(row()));

    await waitFor(() =>
      expect(
        useAppStore.getState().main,
        "the reminder opened the chat in the store but never showed the conversation",
      ).toBe("chat"),
    );
    expect(
      String(useAppStore.getState().activeChat?.id),
      "the reminder opened a different chat",
    ).toBe("40");
    expect(
      useAppStore.getState().jumpToMessageId,
      "the conversation was not asked to scroll to the reminded message",
    ).toBe("91");
  });

  it("loads the messages up to one far up the chat, with a spinner, before it shows the chat", async () => {
    let answer!: (value: any) => void;
    backend({
      get_all_messages_between_two_messages: () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    });
    await mount({ data: [bilalChat()], reminders: [reminderFor("12")] });

    await act(async () => fireEvent.click(row()));

    const between = h.fetchData.mock.calls.find(([r]) =>
      String(r.url).includes("get_all_messages_between_two_messages"),
    )?.[0];
    expect(between, "the messages between the loaded page and the reminded message were not asked for").toBeTruthy();
    expect(
      JSON.parse(between.body),
      "the chat backend was asked for the wrong range of messages",
    ).toEqual({ channel_id: "40", first_message_id: "90", second_message_id: "12" });
    expect(
      document.querySelector('[data-pw="REMINDER-ROW"] [data-pw="SpinneR"]'),
      "the row showed no spinner while the messages were loading",
    ).not.toBeNull();
    expect(
      useAppStore.getState().main,
      "the chat was shown before the reminded message had loaded",
    ).toBe("main");

    await act(async () =>
      answer({ success: true, data: [msg("12", "2026-01-01T09:00:00.000Z")] }),
    );

    await waitFor(() =>
      expect(useAppStore.getState().main, "the chat did not show after the messages loaded").toBe("chat"),
    );
    expect(
      useAppStore.getState().activeChat?.messages?.some((m: any) => m.id === "12"),
      "the reminded message was not put into the open chat",
    ).toBe(true);
    expect(
      useAppStore.getState().jumpToMessageId,
      "the conversation was not asked to scroll to the reminded message",
    ).toBe("12");
  });

  it("finds a chat the list has not loaded yet, and opens it", async () => {
    backend({
      my_channels: () => ({
        success: true,
        data: {
          pinned_channels: [],
          // The backend sends the newest message first.
          channels: [{ ...bilalChat("77"), messages: [...bilalChat().messages].reverse() }],
        },
      }),
    });
    await mount({ data: [bilalChat("40")], reminders: [reminderFor("91", "77")] });

    await act(async () => fireEvent.click(row()));

    await waitFor(() =>
      expect(
        useAppStore.getState().main,
        "a reminder in a chat outside the loaded list did not open that chat",
      ).toBe("chat"),
    );
    expect(String(useAppStore.getState().activeChat?.id), "the reminder opened a different chat").toBe("77");
  });

  it("says so, and stays on the list, when the chat cannot be found", async () => {
    backend({
      my_channels: () => ({ success: true, data: { pinned_channels: [], channels: [] } }),
    });
    await mount({ data: [bilalChat("40")], reminders: [reminderFor("91", "404")] });

    await act(async () => fireEvent.click(row()));

    await waitFor(() =>
      expect(h.showError, "a chat that could not be found was not reported").toHaveBeenCalledWith(
        "Could Not Open The Chat",
      ),
    );
    expect(useAppStore.getState().main, "the list was left for a chat that does not exist").toBe("main");
    expect(screen.getByText("call the shop"), "the reminder row went away").toBeInTheDocument();
  });
});
