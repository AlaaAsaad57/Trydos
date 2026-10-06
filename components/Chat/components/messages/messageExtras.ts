import type { MessageTag } from "store/chat/actions";

/**
 * Look of the suggested tags. The label is the English translation key; the
 * colour follows the chat and seller-dashboard palette. A tag is free text,
 * so a tag that is not here is drawn by `tagStyle` with the default colour.
 */
export const TAG_STYLES: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "#f85555" },
  important: { label: "Important", color: "#ff9500" },
  todo: { label: "To do", color: "#388CFF" },
  done: { label: "Done", color: "#34c759" },
};

const CUSTOM_TAG_COLOR = "#8e8d92";

const isSuggested = (tag: string) =>
  Object.prototype.hasOwnProperty.call(TAG_STYLES, tag);

/** The style of any tag: a suggested one, or a custom one in grey. */
export const tagStyle = (tag: MessageTag) =>
  isSuggested(tag)
    ? TAG_STYLES[tag]
    : { label: tag, color: CUSTOM_TAG_COLOR };

/** The tag as the user sees it: suggested tags are translated, custom ones are not. */
export const tagLabel = (
  tag: MessageTag,
  translate: (key: string) => string,
) => (isSuggested(tag) ? translate(TAG_STYLES[tag].label) : tag);

/** The longest tag the backend accepts, in characters (emoji count as one). */
export const MAX_TAG_LENGTH = 30;

/** Trim a typed tag and cut it to the allowed length; "" when nothing is left. */
export const normalizeTag = (text: string) =>
  Array.from(text.trim()).slice(0, MAX_TAG_LENGTH).join("");

/**
 * The latest time the backend accepts for a reminder. It stores the time as a
 * 32-bit timestamp, so it refuses 2038-01-19 and later.
 */
export const REMINDER_LATEST = new Date("2038-01-18T23:59:00");

/** The locale for `Intl` date formats. Kurdish here is Sorani (ckb). */
export const dateLocale = (language?: string | null) =>
  language === "ku" ? "ckb" : language || "en";

/** A reminder time for display, in the reader's language: "26 Sep, 14:30". */
export const formatReminderTime = (iso: string, language?: string | null) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(dateLocale(language), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Whether the signed-in user put this tag on the message. */
export const isMyTag = (
  userIds: Array<number | string> | undefined,
  myId: number | string | undefined | null,
) => myId != null && (userIds || []).some((id) => String(id) === String(myId));
