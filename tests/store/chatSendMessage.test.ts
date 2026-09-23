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
