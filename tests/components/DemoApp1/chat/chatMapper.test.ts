import { describe, expect, it } from "vitest";
import {
  statusOf,
  toContact,
  toMessage,
  toMessages,
  toThread,
  wordsOf,
  type MapContext,
} from "components/DemoApp1/chat/chatMapper";
import { dayPill } from "components/DemoApp1/chat/chatModel";
import type { Channel, Member, Message } from "utils/types/chat";

// The mapper turns the live chat data (what the chat backend sends and the
// store keeps) into what the new chat screens draw. These check each rule on
// its own, with no screen, no store and no backend.

const ME = 7;
const PEER = 9;
const NOW = new Date(2026, 10, 4, 12, 0, 0); // 4 Nov 2026, 12:00 local

const ctx: MapContext = {
  myId: ME,
  words: {
    photo: "Photo",
    voice: "voice message",
    video: "Video",
    file: "File",
    location: "Location",
    product: "Product",
    deleted: "this message was deleted",
    voiceCall: "Voice Call",
    videoCall: "Video Call",
  },
  locale: "sy-en",
  now: NOW,
  rowTime: (createdAt) => `row ${createdAt}`,
  chatName: (chat) => chat.channel_name || "Peer Name",
};

const status = (userId: number, s: { watched?: boolean; received?: boolean } = {}) => ({
  id: userId,
  user_id: userId,
  is_sent: true,
  is_received: s.received ? 1 : 0,
  is_watched: !!s.watched,
  is_deleted: 0,
  delete_for_all: false,
  message_deleted_at: null,
  watched_at: s.watched ? "2026-11-04T11:00:00" : null,
  received_at: s.received ? "2026-11-04T10:59:00" : null,
  created_at: "2026-11-04T10:58:00",
});

let nextId = 100;
function msg(over: Partial<Message> & { type?: string; text?: string; file?: string; fileName?: string } = {}): Message {
  const { type = "TextMessage", text = "Hello", file, fileName, ...rest } = over;
  return {
    id: String(nextId++),
    sender_user_id: PEER,
    sender_mobile_phone: null,
    receiver_user_id: ME,
    channel_id: "1",
    message_description: "",
    extra_fields: null,
    parent_message_id: null,
    is_forward: 0,
    call_status: null,
    created_at: "2026-11-04T10:00:00",
    duration_in_seconds: null,
    message_content: { message_id: "", content: text, is_locked_by_admin_for_delete: 0, is_locked_by_admin_for_update: 0 },
    message_type: { name: type, event_name: "", created_at: null },
    deleted_by_user_id: null,
    sender_user: null,
    message_status: [status(PEER)],
    message_files: file ? [{ file_path: file, file_name: fileName ?? "" }] : [],
    ...rest,
  } as Message;
}

const member = (userId: number, over: Partial<Member> = {}): Member => ({
  id: userId,
  user_id: userId,
  is_allowed_to_chat: true,
  is_admin: 0,
  mute: 0,
  archived: 0,
  pin: 0,
  is_blocked: 0,
  user: {
    id: userId,
    name: userId === ME ? "Me" : "Peer Name",
    username: null,
    mobile_phone: userId === ME ? "+1000" : "+2000",
    photo_path: userId === ME ? null : "https://media.example/peer.jpg",
    created_at: "",
    contact_user: null,
  },
  created_at: null,
  ...over,
});

function channel(over: Partial<Channel> = {}): Channel {
  return {
    id: "1",
    channel_name: "",
    mobile_phone: "",
    photo_path: null,
    total_unread_message_count: 0,
    activeDate: null,
    created_at: "2026-11-01T09:00:00",
    is_mute: 0,
    updated_at: "2026-11-01T09:00:00",
    channel_members: [member(ME), member(PEER)],
    messages: [],
    channel_type: null,
    ...over,
  } as Channel;
}

describe("chat mapper — ticks of a message I sent", () => {
  it("read when the other member watched it, delivered when they received it, else sent", () => {
    const read = msg({ sender_user_id: ME, message_status: [status(ME), status(PEER, { watched: true })] });
    const delivered = msg({ sender_user_id: ME, message_status: [status(ME), status(PEER, { received: true })] });
    const sent = msg({ sender_user_id: ME, message_status: [status(ME), status(PEER)] });
    expect(statusOf(read, ME), "a message the other member watched does not show as read").toBe("read");
    expect(statusOf(delivered, ME), "a message the other member received does not show as delivered").toBe("delivered");
    expect(statusOf(sent, ME), "a message the other member has not received does not show as sent").toBe("sent");
  });

  it("reads only the other member's status, never mine", () => {
    const m = msg({ sender_user_id: ME, message_status: [status(ME, { watched: true }), status(PEER)] });
    expect(statusOf(m, ME), "my own 'watched' made my message look read by the other member").toBe("sent");
  });
});

describe("chat mapper — one message", () => {
  it("a text I sent is on my side, with its words and its ticks", () => {
    const m = toMessage(
      msg({ sender_user_id: ME, text: "Hi there", message_status: [status(PEER, { received: true })] }),
      ctx,
    );
    expect(m?.kind, "a TextMessage did not become a text").toBe("text");
    if (m?.kind !== "text") return;
    expect(m.side, "a message I sent is not on my side").toBe("out");
    expect(m.text, "the text lost its words").toBe("Hi there");
    expect(m.status, "the text lost its delivered ticks").toBe("delivered");
    expect(m.time, "the time is not the local hour and minute of created_at").toBe("10:00");
  });

  it("a text from the other person is on their side and has no ticks", () => {
    const m = toMessage(msg({ text: "Hey" }), ctx);
    expect(m && "side" in m && m.side, "a message from the other person is not on their side").toBe("in");
    expect(m && "status" in m ? m.status : undefined, "a message from the other person shows ticks").toBeUndefined();
  });

  it("keeps the edited and forwarded marks", () => {
    const m = toMessage(msg({ is_edited: 1, is_forward: 1 }), ctx);
    expect(m?.kind === "text" && m.edited, "an edited text lost its edited mark").toBe(true);
    expect(m?.forwarded, "a forwarded text lost its forwarded mark").toBe(true);
  });

  it("a reply quotes its parent's words, and the answered message gets the reply mark", () => {
    const parent = msg({ text: "The question" });
    const reply = msg({ sender_user_id: ME, text: "The answer", parent_message_id: parent.id, parent_message: parent });
    const replyOut = toMessage(reply, ctx);
    expect(replyOut?.kind === "text" && replyOut.replyTo, "the reply lost its quote").toEqual({ id: parent.id, text: "The question" });
    const parentOut = toMessage(parent, ctx, new Set([parent.id]));
    expect(parentOut?.kind === "text" && parentOut.repliedTo, "the answered message has no reply mark").toBe(true);
  });

  it("a reply to a deleted message quotes 'this message was deleted'", () => {
    const parent = msg({ auth_message_status: { ...status(ME), is_deleted: 1 } });
    const reply = toMessage(msg({ parent_message: parent, parent_message_id: parent.id }), ctx);
    expect(reply?.kind === "text" && reply.replyTo?.text, "a quote of a deleted message shows its old words").toBe(
      "this message was deleted",
    );
  });

  it("a message still sending is pending and uses its local id", () => {
    const m = toMessage(msg({ id: undefined, mid: "m123", sender_user_id: ME }), ctx);
    expect(m?.id, "a sending message does not use its local mid as its id").toBe("m123");
    expect(m?.pending, "a message with a local mid is not marked pending").toBe(true);
  });

  it("a stored message is not pending", () => {
    expect(toMessage(msg({ mid: null }), ctx)?.pending, "a message the backend stored is marked pending").toBeUndefined();
  });

  it("a deleted message becomes the deleted placeholder on its side, whatever its type", () => {
    const m = toMessage(
      msg({ type: "ImageMessage", sender_user_id: ME, auth_message_status: { ...status(ME), is_deleted: 1 } }),
      ctx,
    );
    expect(m?.kind, "a deleted image is not the deleted placeholder").toBe("deleted");
    expect(m && "side" in m && m.side, "the deleted placeholder is not on the sender's side").toBe("out");
  });

  it("a photo, video and voice message take the file's URL; video and voice take the length", () => {
    const photo = toMessage(msg({ type: "ImageMessage", file: "https://media.example/p.jpg" }), ctx);
    const video = toMessage(msg({ type: "VideoMessage", file: "https://media.example/v.mp4", duration_in_seconds: 42 }), ctx);
    const voice = toMessage(msg({ type: "VoiceMessage", file: "https://media.example/a.webm", duration_in_seconds: 9 }), ctx);
    expect(photo?.kind === "photo" && photo.src, "the photo lost its URL").toBe("https://media.example/p.jpg");
    expect(video?.kind === "video" && video.src, "the video lost its URL").toBe("https://media.example/v.mp4");
    expect(video?.kind === "video" && video.seconds, "the video lost its length").toBe(42);
    expect(voice?.kind === "voice" && voice.src, "the voice message lost its sound URL").toBe("https://media.example/a.webm");
    expect(voice?.kind === "voice" && voice.seconds, "the voice message lost its length").toBe(9);
  });

  it("a file takes its URL and name, and has no size (the chat backend sends none)", () => {
    const m = toMessage(msg({ type: "FileMessage", file: "https://media.example/f.pdf", fileName: "invoice.pdf" }), ctx);
    expect(m?.kind === "file" && m.src, "the file lost its URL").toBe("https://media.example/f.pdf");
    expect(m?.kind === "file" && m.name, "the file lost its name").toBe("invoice.pdf");
    expect(m?.kind === "file" && m.bytes, "the file got a size the backend never sent").toBeUndefined();
  });

  it("a shared product takes its name, picture and slug from the JSON content", () => {
    const content = JSON.stringify([
      { product_name: "Red Shoe", product_image_url: "https://media.example/shoe.jpg", product_slug: "red-shoe" },
    ]);
    const m = toMessage(msg({ type: "ShareProduct", text: content }), ctx);
    expect(m?.kind, "a ShareProduct did not become a product").toBe("product");
    if (m?.kind !== "product") return;
    expect(m.name, "the product lost its name").toBe("Red Shoe");
    expect(m.image, "the product lost its picture").toBe("https://media.example/shoe.jpg");
    expect(m.slug, "the product lost its slug").toBe("red-shoe");
  });

  it("a shared product with broken content is an empty product, not a crash", () => {
    const m = toMessage(msg({ type: "ShareProduct", text: "not json" }), ctx);
    expect(m?.kind === "product" && m.name, "a broken product did not become an empty product").toBe("");
  });

  it("a message type the screens do not know is left out", () => {
    expect(toMessage(msg({ type: "SomethingNew" }), ctx), "an unknown message type was not left out").toBeNull();
  });

  it("takes only my own label, and only one of the design's 5", () => {
    const m = toMessage(
      msg({
        tags: [
          { tag: "urgent", count: 1, user_ids: [ME] },
          { tag: "payment", count: 1, user_ids: [PEER] },
          { tag: "shipping", count: 1, user_ids: [ME] },
        ],
      }),
      ctx,
    );
    expect(m?.category, "the message did not take my design label, or took another user's or a non-design tag").toBe(
      "shipping",
    );
  });

  it("takes the reminder time", () => {
    const m = toMessage(msg({ reminder: { id: "r1", remind_at: "2026-11-05T09:00:00", created_at: "" } }), ctx);
    expect(m?.reminderAt, "the reminder time was lost").toBe(new Date("2026-11-05T09:00:00").getTime());
  });
});

describe("chat mapper — call messages", () => {
  const call = (over: Partial<Message> & { type?: string } = {}) =>
    toMessage(msg({ type: "VoiceCall", ...over }), ctx);

  it("an answered call from the other person is incoming, with its minutes", () => {
    const m = call({ duration_in_seconds: 125 });
    expect(m?.kind === "call" && m.tone, "an answered call is not incoming").toBe("incoming");
    expect(m?.kind === "call" && m.sub, "an answered call does not show minutes").toBe("minutes");
    expect(m?.kind === "call" && m.minutes, "125 s did not round to 2 minutes").toBe("2");
  });

  it("an unanswered call from the other person is missed, with Call back", () => {
    const m = call({ duration_in_seconds: 0 });
    expect(m?.kind === "call" && m.tone, "an unanswered incoming call is not missed").toBe("missed");
    expect(m?.kind === "call" && m.sub, "a missed call does not offer Call back").toBe("callBack");
  });

  it("an unanswered call I made is outgoing with No answer, never missed", () => {
    const m = call({ sender_user_id: ME, duration_in_seconds: 0 });
    expect(m?.kind === "call" && m.tone, "my unanswered call shows as missed").toBe("outgoing");
    expect(m?.kind === "call" && m.sub, "my unanswered call does not say No answer").toBe("noAnswer");
  });

  it("the call that rings now is not missed", () => {
    const ringing = msg({ type: "VoiceCall", duration_in_seconds: 0 });
    const m = toMessage(ringing, { ...ctx, liveCallId: ringing.id });
    expect(m?.kind === "call" && m.tone, "the call that rings now shows as missed").toBe("incoming");
  });

  it("marks a video call, and not a voice call", () => {
    expect(call({ type: "VideoCall" })?.kind === "call" && (call({ type: "VideoCall" }) as { video?: boolean }).video, "a video call lost its video mark").toBe(true);
    const voice = call();
    expect(voice?.kind === "call" && voice.video, "a voice call is marked video").toBeUndefined();
  });
});

describe("chat mapper — the conversation", () => {
  it("orders the messages oldest first and puts a day pill before each day's first message", () => {
    const older = msg({ text: "older", created_at: "2026-10-23T08:00:00" });
    const yesterday = msg({ text: "yesterday", created_at: "2026-11-03T20:00:00" });
    const today1 = msg({ text: "today 1", created_at: "2026-11-04T09:00:00" });
    const today2 = msg({ text: "today 2", created_at: "2026-11-04T09:05:00" });
    const out = toMessages([today2, yesterday, today1, older], ctx);
    const drawn = out.map((m) =>
      m.kind === "day" ? `pill ${m.label ?? m.date}` : m.kind === "text" ? m.text : m.kind,
    );
    expect(drawn, "the conversation is not oldest first with one pill per day").toEqual([
      "pill 23 Oct",
      "older",
      "pill YESTERDAY",
      "yesterday",
      "pill TODAY",
      "today 1",
      "today 2",
    ]);
  });

  it("leaves out a message of an unknown type but keeps the rest", () => {
    const out = toMessages([msg({ text: "kept" }), msg({ type: "SomethingNew" })], ctx);
    expect(out.map((m) => m.kind), "the unknown message was drawn, or the known one was lost").toEqual(["day", "text"]);
  });
});

describe("chat mapper — the day pill", () => {
  it("says the date for an older day, with the year only in another year", () => {
    expect(dayPill(new Date(2026, 9, 23, 8).getTime(), "sy-en", NOW), "an older day this year is not '23 Oct'").toEqual({
      date: "23 Oct",
    });
    expect(dayPill(new Date(2025, 9, 23, 8).getTime(), "sy-en", NOW), "a day last year has no year").toEqual({
      date: "23 Oct 2025",
    });
  });

  it("says TODAY and YESTERDAY for the design's two days", () => {
    expect(dayPill(new Date(2026, 10, 4, 1).getTime(), "en", NOW), "today is not TODAY").toEqual({ label: "TODAY" });
    expect(dayPill(new Date(2026, 10, 3, 23).getTime(), "en", NOW), "yesterday is not YESTERDAY").toEqual({
      label: "YESTERDAY",
    });
  });
});

describe("chat mapper — the chat row", () => {
  it("reads pin and mute from my own member row, not from the chat or the other member", () => {
    const thread = toThread(
      channel({ is_mute: 1, channel_members: [member(ME, { pin: 1, mute: 0 }), member(PEER, { mute: 1 })] }),
      ctx,
    );
    expect(thread.pinned, "my pin on my member row did not pin the chat").toBe(true);
    expect(thread.muted, "the chat's or the other member's mute muted my chat").toBeUndefined();
  });

  it("counts unread messages, and a chat I marked unread shows at least one", () => {
    expect(toThread(channel({ total_unread_message_count: 4 }), ctx).unread, "the unread count was lost").toBe(4);
    expect(toThread(channel({ marked_unread: true }), ctx).unread, "a chat I marked unread shows no unread").toBe(1);
  });

  it("an archived chat is archived", () => {
    expect(toThread(channel({ is_archived: 1 }), ctx).archived, "an archived chat is not archived").toBe(true);
  });

  it("'blocked' means I blocked them; 'blocked either way' hides the composer when they blocked me", () => {
    const iBlocked = toThread(channel({ channel_members: [member(ME), member(PEER, { is_blocked: 1 })] }), ctx);
    const theyBlocked = toThread(channel({ channel_members: [member(ME, { is_blocked: 1 }), member(PEER)] }), ctx);
    expect(iBlocked.blocked, "a contact I blocked does not show as blocked").toBe(true);
    expect(iBlocked.blockedEitherWay, "a chat with a contact I blocked still lets me send").toBe(true);
    expect(theyBlocked.blocked, "a contact who blocked me shows as blocked by me").toBeUndefined();
    expect(theyBlocked.blockedEitherWay, "a chat with a contact who blocked me still lets me send").toBe(true);
  });

  it("shows the other person's typing words as typing, and 'null' as not typing", () => {
    expect(toThread({ ...channel(), status: "Typing..." } as Channel, ctx).typingNow, "typing words did not show typing").toBe(true);
    expect(toThread({ ...channel(), status: "null" } as Channel, ctx).typingNow, "'null' showed typing").toBeUndefined();
  });

  it("previews the last message, with my ticks when it is mine, and its row time", () => {
    const last = msg({
      sender_user_id: ME,
      text: "See you",
      created_at: "2026-11-04T11:00:00",
      message_status: [status(PEER, { watched: true })],
    });
    const thread = toThread(channel({ messages: [last, msg({ created_at: "2026-11-04T08:00:00" })] }), ctx);
    expect(thread.preview, "the row does not preview the last message").toBe("See you");
    expect(thread.mark, "the row does not show the read ticks of my last message").toBe("read");
    expect(thread.time, "the row time is not the old chat's rule for the last message").toBe("row 2026-11-04T11:00:00");
    expect(thread.lastAt, "the row is not ordered by its last message").toBe(new Date("2026-11-04T11:00:00").getTime());
  });

  it("previews a non-text last message by its kind, with no ticks when it is theirs", () => {
    const thread = toThread(channel({ messages: [msg({ type: "ImageMessage", file: "x" })] }), ctx);
    expect(thread.preview, "a photo is not previewed as 'Photo'").toBe("Photo");
    expect(thread.mark, "a message from the other person shows my ticks").toBeUndefined();
  });

  it("previews a file by its name and a call by its kind", () => {
    expect(wordsOf(msg({ type: "FileMessage", file: "x", fileName: "a.pdf" }), ctx.words), "a file preview lost its name").toBe(
      "File: a.pdf",
    );
    expect(wordsOf(msg({ type: "VideoCall" }), ctx.words), "a video call is not previewed as 'Video Call'").toBe("Video Call");
  });

  it("a chat with no message has an empty preview and is ordered by its last update", () => {
    const thread = toThread(channel({ updated_at: "2026-11-02T10:00:00" }), ctx);
    expect(thread.preview, "an empty chat shows a preview").toBe("");
    expect(thread.lastAt, "an empty chat is not ordered by its last update").toBe(new Date("2026-11-02T10:00:00").getTime());
  });
});

describe("chat mapper — the contact", () => {
  it("is the other member, with the chat's name, their phone and their photo", () => {
    const contact = toContact(channel({ channel_name: "Shop Owner" }), ctx);
    expect(contact.id, "the contact is not the other member").toBe(String(PEER));
    expect(contact.name, "the contact does not take the chat's name").toBe("Shop Owner");
    expect(contact.phone, "the contact lost the other member's phone").toBe("+2000");
    expect(contact.photo, "the contact lost the other member's photo").toBe("https://media.example/peer.jpg");
    expect(contact.initials, "the initials are not from the name").toBe("SO");
  });

  it("a contact with no photo has none, so the screen draws the initials", () => {
    const contact = toContact(
      channel({ channel_members: [member(ME), member(PEER, { user: { ...member(PEER).user, photo_path: null } })] }),
      ctx,
    );
    expect(contact.photo, "a contact with no photo got one").toBeUndefined();
  });
});
