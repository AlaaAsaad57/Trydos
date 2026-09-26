import type { MessageTag } from "store/chat/actions";

/**
 * How each message tag looks. The label is the English translation key; the
 * colour follows the chat and seller-dashboard palette.
 */
export const TAG_STYLES: Record<MessageTag, { label: string; color: string }> =
  {
    urgent: { label: "Urgent", color: "#f85555" },
    important: { label: "Important", color: "#ff9500" },
    todo: { label: "To do", color: "#388CFF" },
    done: { label: "Done", color: "#34c759" },
  };

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
