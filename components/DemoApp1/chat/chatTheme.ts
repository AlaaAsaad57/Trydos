/**
 * The chat screens' colours, bubble shapes and menu names, read out of the XD
 * file (`Home Page – 41` .. `– 45`, `Chat home / Call – 1` and `– 3`).
 *
 * These are design values, not sample data. The sample content of the file
 * stays in components/DemoApp/demoChat.ts for `/demo` only (A-16).
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

/**
 * A four-corner radius ("2px 50px 2px 30px": top-left, top-right,
 * bottom-right, bottom-left) as start / end corners, so a bubble's sharp
 * corner follows its side on a right-to-left page (A-13).
 */
export function corners(radius: string) {
  const [a, b = a, c = a, d = b] = radius.trim().split(/\s+/);
  return {
    borderStartStartRadius: a,
    borderStartEndRadius: b,
    borderEndEndRadius: c,
    borderEndStartRadius: d,
  };
}

/** The names in the long-press menu, in the file's order (`– 44`, bottom). */
export const MENU_ACTIONS = [
  "Reply",
  "copy",
  "Category",
  "Delete",
  "Edit",
  "Remind me",
] as const;
