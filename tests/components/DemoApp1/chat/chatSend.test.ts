import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Sending from the new chat screens. The chat backend calls, the upload to the
// media server and PostHog are mocked: each test checks the sending copy that
// goes into the store, the call that goes out, and what happens on a failure.

const api = vi.hoisted(() => ({
  SendMessage: vi.fn(async () => undefined),
  SaveContact: vi.fn(async () => true),
  getContacts: vi.fn(async () => undefined),
}));
vi.mock("store/chat/actions", async (importOriginal) => ({ ...(await importOriginal<any>()), ...api }));

const media = vi.hoisted(() => ({
  upload: vi.fn(async (file: File) => ({ path: `https://media.example/${file.name}`, name: file.name })),
  forwardMessage: vi.fn(async () => undefined),
  openChatFromList: vi.fn(),
  trackPosthog: vi.fn(),
  showErrorNotification: vi.fn(),
}));
vi.mock("components/Chat/chatsFunctions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  upload: media.upload,
  forwardMessage: media.forwardMessage,
}));
vi.mock("components/Chat/openChatFromList", () => ({ openChatFromList: media.openChatFromList }));
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog: media.trackPosthog,
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: media.showErrorNotification,
}));

import {
  forwardTo,
  openChatWith,
  saveContact,
  sendAnyFile,
  sendMediaMessage,
  sendTextMessage,
  sendVideoFile,
  sendVoiceNote,
} from "components/DemoApp1/chat/chatSend";
import { cancelUpload } from "components/Chat/uploadCancel";
import { useAppStore } from "store";

const ME = 7;
const PEER = 9;

// Only the fields the send code reads; the full Channel type has many more.
const channel = (id: string, messages: any[] = []): any => ({
  id,
  channel_members: [
    { id: 70, user_id: ME, user: { id: ME } },
    { id: 90, user_id: PEER, user: { id: PEER } },
  ],
  messages,
});

const store = { sendMessage: vi.fn(), deleteErrorMessage: vi.fn() };
const initial = useAppStore.getState();

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    ...store,
    userChat: { id: ME, name: "Me" },
    data: [channel("1", [{ id: "500", message_type: { name: "TextMessage" } }]), channel("2")],
    archivedChats: [],
    activeChat: null,
    contacts: [],
  });
});
afterEach(() => {
  useAppStore.setState(initial, true);
});

/** The sending copy the store was given, and the payload sent to the chat backend. */
const copy = () => (store.sendMessage.mock.calls[0]?.[0] as any)?.message;
const sent = () => (api.SendMessage.mock.calls[0] as any[] | undefined)?.[0];

describe("sending a text", () => {
  it("puts a sending copy in the store, then sends the words to the chat backend", () => {
    sendTextMessage("1", "  Hello  ");
    expect(copy()?.message_content, "the sending copy does not hold the trimmed words").toEqual({ content: "Hello" });
    expect(copy()?.mid, "the sending copy has no local mid").toMatch(/^m\d+$/);
    expect(sent()?.content, "the chat backend did not get the trimmed words").toBe("Hello");
    expect(sent()?.receiver_user_id, "the text was not addressed to the other person").toBe(PEER);
    expect(sent()?.mid, "the sent message lost the copy's mid, so the copy can never be swapped").toBe(copy()?.mid);
  });

  it("a reply carries the answered message's id, and its copy quotes it", () => {
    sendTextMessage("1", "Yes", { id: "500", text: "Question" });
    expect(sent()?.parent_message_id, "the reply was not sent with the answered message's id").toBe("500");
    expect(copy()?.parent_message?.id, "the sending copy does not quote the answered message").toBe("500");
  });

  it("sends chat_message_sent with the old properties", () => {
    sendTextMessage("1", "Hello", { id: "500", text: "Q" });
    expect(media.trackPosthog, "chat_message_sent did not go out with the old properties").toHaveBeenCalledWith(
      "chat_message_sent",
      { conversation_id: "1", message_type: "TextMessage", is_order_chat: false, is_reply: true },
    );
  });

  it("empty words, or a chat that is not loaded, send nothing", () => {
    sendTextMessage("1", "   ");
    sendTextMessage("999", "Hello");
    expect(api.SendMessage, "an empty text or an unknown chat reached the chat backend").not.toHaveBeenCalled();
  });
});

describe("sending a photo, a video, a file or a voice note", () => {
  const photo = () => new File(["img"], "pic.jpg", { type: "image/jpeg" });

  it("shows a sending copy with a preview, uploads the file, then sends its media address", async () => {
    await sendMediaMessage("1", photo(), "ImageMessage");
    expect(copy()?.message_files?.[0]?.file_path, "the sending copy has no preview of the photo").toMatch(/^data:/);
    expect(media.upload, "the photo was not uploaded to the media server").toHaveBeenCalledWith(
      expect.objectContaining({ name: "pic.jpg" }),
      expect.any(AbortSignal),
    );
    expect(sent()?.content, "the chat backend did not get the uploaded photo's address").toEqual([
      { file_path: "https://media.example/pic.jpg", file_name: "pic.jpg" },
    ]);
    expect(sent()?.message_type, "the photo was not sent as an ImageMessage").toBe("ImageMessage");
  });

  it("a failed upload takes the sending copy back and says why", async () => {
    media.upload.mockRejectedValueOnce(new Error("File size should not exceed 25 MB"));
    await sendMediaMessage("1", photo(), "ImageMessage");
    expect(store.deleteErrorMessage, "the copy of a failed upload stayed in the chat").toHaveBeenCalledWith(
      expect.objectContaining({ ch_id: "1" }),
    );
    expect(media.showErrorNotification, "the shopper was not told why the upload failed").toHaveBeenCalledWith(
      "File size should not exceed 25 MB",
    );
    expect(api.SendMessage, "a failed upload still sent a message to the chat backend").not.toHaveBeenCalled();
  });

  it("an upload the sender cancelled sends nothing and shows no error", async () => {
    media.upload.mockImplementationOnce(async (_file: File, signal?: AbortSignal) => {
      cancelUpload(copy()?.mid);
      if (signal?.aborted) throw new Error("aborted");
      return { path: "x", name: "x" };
    });
    await sendMediaMessage("1", photo(), "ImageMessage");
    expect(api.SendMessage, "a cancelled upload still sent a message").not.toHaveBeenCalled();
    expect(media.showErrorNotification, "a cancel by the sender showed an error").not.toHaveBeenCalled();
  });

  it("a video no browser can play is refused with the old words, and nothing uploads", () => {
    sendVideoFile("1", new File(["v"], "clip.avi", { type: "video/x-msvideo" }));
    expect(media.showErrorNotification, "an unplayable video was not refused with the old words").toHaveBeenCalledWith(
      "This video format is not supported. Send an MP4 video instead.",
    );
    expect(media.upload, "an unplayable video was uploaded").not.toHaveBeenCalled();
  });

  it("any picked file becomes the bubble its kind calls for (a picture is a photo)", async () => {
    sendAnyFile("1", photo());
    await vi.waitFor(() => expect(api.SendMessage, "the picked file was not sent").toHaveBeenCalled());
    expect(sent()?.message_type, "a picked picture was not sent as an ImageMessage").toBe("ImageMessage");
  });

  it("a voice note in a new chat keeps the old 'new chat' flag; in a chat that exists it does not", async () => {
    useAppStore.setState({ data: [channel("1"), channel("ch-9")] });
    sendVoiceNote("ch-9", new Blob(["a"], { type: "audio/wav" }));
    await vi.waitFor(() => expect(api.SendMessage, "the voice note was not sent").toHaveBeenCalled());
    expect((api.SendMessage.mock.calls[0] as any[])[1], "a voice note in a new chat lost the 'new chat' flag").toBe("ch-9");
    expect(sent()?.message_type, "the recording was not sent as a VoiceMessage").toBe("VoiceMessage");
    api.SendMessage.mockClear();
    sendVoiceNote("1", new Blob(["a"], { type: "audio/wav" }));
    await vi.waitFor(() => expect(api.SendMessage, "the voice note was not sent").toHaveBeenCalled());
    expect((api.SendMessage.mock.calls[0] as any[])[1], "a voice note in an existing chat was flagged as new").toBe(false);
  });
});

describe("forward, new chat and new contact", () => {
  it("forward hands the message and the target chat to the old forward", () => {
    forwardTo("1", "500", "2");
    expect(media.forwardMessage, "message 500 was not forwarded to chat 2").toHaveBeenCalledWith(
      expect.objectContaining({ id: "500" }),
      expect.objectContaining({ id: "2" }),
    );
  });

  it("a chat with a contact who already has one opens that chat", () => {
    const id = openChatWith({ id: String(PEER), name: "Peer", phone: "+2", initials: "P" });
    expect(id, "the existing chat with the contact was not chosen").toBe("1");
    expect(media.openChatFromList, "the existing chat was not opened").toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
  });

  it("a chat with a new contact opens a ch-<user id> chat with both members, as the old contact row", () => {
    const id = openChatWith({ id: "11", name: "Friend", phone: "+3", initials: "F" });
    expect(id, "a new chat did not get the ch-<user id> id").toBe("ch-11");
    const opened = media.openChatFromList.mock.calls[0][0];
    expect(opened.channel_name, "the new chat lost the contact's name").toBe("Friend");
    expect(
      opened.channel_members.map((m: { user_id: unknown }) => String(m.user_id)),
      "the new chat is not between the contact and me",
    ).toEqual(["11", String(ME)]);
  });

  it("a saved contact who is on Trydos gives their user id, found by the number", async () => {
    api.getContacts.mockImplementationOnce(async () => {
      useAppStore.setState({ contacts: [{ id: 1, mobile_phone: "963 944 000 000", contact_user: { id: 11 } }] });
    });
    const id = await saveContact(" Friend ", "963944000000");
    expect(api.SaveContact, "the contact was not saved with the trimmed name and the full number").toHaveBeenCalledWith(
      "Friend",
      "963944000000",
    );
    expect(id, "the saved contact's Trydos user id was not found").toBe("11");
  });

  it("a saved contact who is not on Trydos, or a refused save, gives no one to chat with", async () => {
    api.getContacts.mockImplementationOnce(async () => {
      useAppStore.setState({ contacts: [{ id: 1, mobile_phone: "963944000000", contact_user: null }] });
    });
    expect(await saveContact("Outside", "963944000000"), "a contact who is not on Trydos gave a chat id").toBeNull();
    api.SaveContact.mockResolvedValueOnce(false);
    expect(await saveContact("Refused", "1"), "a refused save gave a chat id").toBeNull();
  });
});
