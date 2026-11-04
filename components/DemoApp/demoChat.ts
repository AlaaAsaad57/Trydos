import type { CallKind, DeliveryMark } from "../DemoApp1/chat/chatModel";

/**
 * The chat screens' sample content, read out of the XD file
 * (`Home Page – 41` .. `– 45`, `Chat home / Call – 1` and `– 3`).
 *
 * Mock data for `/demo` only: shipping code never imports this file (A-16).
 * The design's colours and menu names are in
 * components/DemoApp1/chat/chatTheme.ts.
 */

/** The pictures the file uses, copied out of it as they are. */
export const CHAT_PHOTOS = {
  contact: "/assets/demo/chat/contact-marie.jpg",
  me: "/assets/demo/chat/me.jpg",
  photoMessage: "/assets/demo/chat/photo-message.jpg",
  caller: "/assets/demo/chat/caller-grant.png",
  secondCaller: "/assets/demo/chat/caller-second.jpg",
} as const;

export const CONTACT = {
  name: "Marie Winter",
  initials: "MW",
  phone: "+90 552 800 20 00",
} as const;

/** The file writes the same name under both callers on `Call – 3`. */
export const CALLER = {
  name: "Grant Marshall",
  phone: "+90 552 800 2000",
} as const;

export const CHAT_ROW_TIME = "01:58";
export const MESSAGE_TIME = "12:56";
export const VOICE_LENGTH = "01:20";
/** A dummy 80 s sound for the voice messages, so the waves fill as it plays. */
export const VOICE_SRC = "/assets/demo/chat/voice-message.wav";
/** The counts on the Chats | Calls strip, and the unread count in the conversation's header. */
export const CHAT_COUNTS = { chats: "9", calls: "9", unread: "2" } as const;

export const PREVIEW =
  "When I let go of what I am, I become what I might be.When I let go of what I am, I become what I might be.";
/** The second row's preview (`– 41`): the file types it shorter, ending at "what I". */
export const PREVIEW_SHORT =
  "When I let go of what I am, I become what I might be.When I let go of what I am, I become what I";

export type ChatRow = {
  id: string;
  /** The grey box with the initials instead of the photo (row 2). */
  initials?: boolean;
  /** The purple line and bar of the first row, with its unread count. */
  selected?: boolean;
  unread?: string;
  typing?: boolean;
  /** Row 4: the "Send …" list in place of a preview. */
  attachments?: boolean;
  mark?: DeliveryMark;
};

/** The seven rows of `Home Page – 41`, top to bottom. */
export const CHAT_ROWS: ChatRow[] = [
  { id: "unread", selected: true, unread: "1" },
  { id: "initials", initials: true },
  { id: "typing", typing: true },
  { id: "attachments", attachments: true },
  { id: "sent", mark: "sent" },
  { id: "delivered", mark: "delivered" },
  { id: "read", mark: "read" },
];

/** The four rows of `Home Page – 43`. */
export const CALL_ROWS: { id: string; kind: CallKind; minutes?: string }[] = [
  { id: "missed-1", kind: "missed" },
  { id: "incoming", kind: "incoming", minutes: "16" },
  { id: "no-answer", kind: "noAnswer" },
  { id: "missed-2", kind: "missed" },
];

const HELLO = "Hello World !";
const hello = (n: number) => HELLO.repeat(n);

/** The texts of `Home Page – 44`, in the file's order. */
export const MESSAGES = {
  in1: hello(1),
  in2: hello(3),
  in3: `${hello(3)} ewckj ads\ndskksdlkjklkdc\n\n\nsdklkdclskj\nSdjkkjj`,
  out1: hello(1),
  out2: hello(3),
  out3: `${hello(3)} ${hello(15)}`,
  /** The note under the second missed-call card. The file writes it in title case. */
  note: "We Need Spoke About Project",
  quoted: hello(3),
  reply: hello(1),
  last: hello(1),
  rings: "3",
  minutes: "16",
} as const;

/** The timer the file shows once the call is live (`Call – 1`), in seconds. */
export const CALL_TIMER_START = 3 * 60 + 44;
