/**
 * The chat screens' colours and sample content, read out of the XD file
 * (`Home Page – 41` .. `– 45`, `Chat home / Call – 1` and `– 3`).
 *
 * Nothing here talks to a backend: the design is a sample conversation with
 * one contact, and the demo shows exactly what the file draws.
 */

/** The colours the chat boards use, by the job they do. */
export const CHAT = {
  /** The bubble of a message I sent (`– 44`), and the dot beside it. */
  sent: "#8D00E5",
  sentDot: "#883BF2",
  /** The unread count on a chat row ("1", `– 41`). */
  unreadCount: "#7756E9",
  /** The blue "||" of a read message (`– 41`, last row). */
  read: "#007CFF",
  /** "Typing…" (`– 41`). */
  typing: "#388CFF",
  /** A missed call (`– 43`, `– 44`). */
  red: "#FF0508",
  /** The missed-call card and the box round its icon (`– 44`). */
  missedCard: "#FFF6F5",
  missedIconBox: "#FFE6E5",
  /** The other call cards, and the boxes round their icons. */
  callCard: "#F4F4F4",
  incomingIconBox: "#EFEBFF",
  outgoingIconBox: "#F8EDFF",
  /** The quoted message inside a reply (`– 44`). */
  quote: "#EFEBFF",
  /** The long-press menu boxes and the tooltip under them (`– 44`). */
  menu: "#FAFAFA",
  tooltip: "#404040",
  /** The call screen's page (`Chat home / Call – 1`). */
  callPage: "#000000",
  callName: "#D3D3D3",
  callBlue: "#388CFF",
  callGreen: "#38FF9C",
  /** The grey "Delete Chat" and the grey unblock mark (`– 45`). */
  greyText: "#5D5C5D",
} as const;

/** The radius of a bubble that comes in (left) and of one I sent (right). */
export const BUBBLE_RADIUS = {
  in: "2px 50px 2px 30px",
  out: "50px 2px 30px 2px",
  /** The box round a call card's icon, left and right. */
  iconBoxIn: "2px 30px 2px 30px",
  iconBoxOut: "30px 2px 30px 2px",
} as const;

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

/**
 * The delivery mark before a preview: `|` sent, `||` delivered, a blue `||`
 * read (`– 41`, the last three rows). A `sent` preview is grey.
 */
export type DeliveryMark = "sent" | "delivered" | "read";

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

export type CallKind = "missed" | "incoming" | "noAnswer";

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

/** The names in the long-press menu, in the file's order (`– 44`, bottom). */
export const MENU_ACTIONS = [
  "Replay",
  "copy",
  "Category",
  "Delete",
  "Edit",
  "re-remind",
] as const;

/** The timer the file shows once the call is live (`Call – 1`), in seconds. */
export const CALL_TIMER_START = 3 * 60 + 44;
