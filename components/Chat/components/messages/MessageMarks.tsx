import { ReactNode } from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import type { MessageReminderInfo, MessageTagSummary } from "utils/types/chat";
import { TAG_STYLES, formatReminderTime } from "./messageExtras";

/** Size of one mark, and the gap between two, in px. */
const MARK = 10;
const GAP = 5;

type Marks = {
  is_forward?: number;
  is_edited?: number;
  tags?: MessageTagSummary[];
  reminder?: MessageReminderInfo | null;
};

/** How many marks a message shows. */
export const countMarks = ({ is_forward, is_edited, tags, reminder }: Marks) =>
  (is_forward === 1 ? 1 : 0) +
  (is_edited === 1 ? 1 : 0) +
  ((tags || []).some((t) => t.count > 0) ? 1 : 0) +
  (reminder?.remind_at ? 1 : 0);

/**
 * The smallest width a short bubble needs so its marks do not run out of it.
 *
 * The marks sit in the bottom row next to the time (`.forwarded-message-icon`
 * in ChatWindow.css: 76px from the side). One mark always fitted in the
 * bubble's normal minimum, so only two or more marks widen it.
 */
export const marksMinWidth = (count: number) =>
  count > 1 ? 96 + count * MARK + (count - 1) * GAP : undefined;

/**
 * One mark: a small icon with its own tooltip. The tooltip shows on hover,
 * and on keyboard focus, drawn like the labels of the message menu.
 */
function Mark({
  icon,
  label,
  tip,
  dataPw,
}: {
  icon: string;
  label: string;
  tip: ReactNode;
  dataPw: string;
}) {
  return (
    <span className="message-mark" tabIndex={0} data-pw={dataPw}>
      <img src={icon} alt={label} style={{ width: MARK, height: MARK }} />
      <span className="message-mark-tip" role="tooltip">
        {tip}
      </span>
    </span>
  );
}

/**
 * Small icons in a message bubble, next to its time: forwarded, edited, my
 * reminder, and tagged. They take the place the forward icon always had.
 * Hovering an icon shows what it means: which tags, and when the reminder is.
 */
function MessageMarks({ is_forward, is_edited, tags, reminder }: Marks) {
  const { language } = useAppStore();
  const shownTags = (tags || []).filter(
    (t) => t.count > 0 && TAG_STYLES[t.tag],
  );
  if (countMarks({ is_forward, is_edited, tags, reminder }) === 0) return null;

  const reminderText = reminder?.remind_at
    ? `${translateFunction("Reminder")}: ${formatReminderTime(
        reminder.remind_at,
        language,
      )}`
    : "";
  const tagNames = shownTags
    .map((t) => translateFunction(TAG_STYLES[t.tag].label))
    .join(", ");

  return (
    <div
      className="forwarded-message-icon items-center"
      style={{ gap: GAP }}
      data-pw="MESSAGE-MARKS"
      // A tap on a mark shows its tooltip; it must not open the message menu.
      onClick={(e) => e.stopPropagation()}
    >
      {is_forward === 1 && (
        <Mark
          icon="/icons/chat/forwarded.svg"
          label={translateFunction("Forwarded")}
          tip={translateFunction("Forwarded")}
          dataPw="MESSAGE-MARK-FORWARDED"
        />
      )}
      {is_edited === 1 && (
        <Mark
          icon="/icons/chat/edit.svg"
          label={translateFunction("Edited")}
          tip={translateFunction("Edited")}
          dataPw="MESSAGE-MARK-EDITED"
        />
      )}
      {reminderText && (
        <Mark
          icon="/icons/chat/remind.svg"
          label={reminderText}
          tip={reminderText}
          dataPw="MESSAGE-MARK-REMINDER"
        />
      )}
      {shownTags.length > 0 && (
        <Mark
          icon="/icons/chat/categ.svg"
          label={tagNames}
          dataPw="MESSAGE-MARK-TAGS"
          tip={shownTags.map((t) => (
            <span key={t.tag} className="flex items-center gap-[4px]">
              <span
                className="w-[6px] h-[6px] rounded-full"
                style={{ backgroundColor: TAG_STYLES[t.tag].color }}
              />
              {translateFunction(TAG_STYLES[t.tag].label)}
              {t.count > 1 && ` (${t.count})`}
            </span>
          ))}
        />
      )}
    </div>
  );
}

export default MessageMarks;
