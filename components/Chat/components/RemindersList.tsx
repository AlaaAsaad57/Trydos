import { useEffect, useState } from "react";
import Spinner from "components/global/Spinner";
import { openMessageInChat } from "components/Chat/openMessageInChat";
import { CancelMessageReminder, GetMyReminders } from "store/chat/actions";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import type { MyReminder } from "utils/types/chat";
import { ChatFolderHeader } from "./ChatFolderRow";
import { formatReminderTime } from "./messages/messageExtras";

/** The text a reminder row shows for a message that is not text. */
const TYPE_PREVIEW: Record<string, string> = {
  ImageMessage: "image",
  VideoMessage: "video",
  VoiceMessage: "voice message",
  FileMessage: "file",
  ShareProduct: "Product",
};

/**
 * My reminders that have not fired yet, soonest first. A tap opens the chat
 * the message is in, scrolled to the message; the row shows a spinner while
 * the chat and the message load. The cross cancels the reminder.
 */
function RemindersList({ onBack }: { onBack: () => void }) {
  const { reminders, language } = useAppStore();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Asked again on every opening: a reminder may have fired, or been set on
  // another device, since the chat list loaded.
  useEffect(() => {
    Promise.resolve(GetMyReminders()).finally(() => setLoading(false));
  }, []);

  const open = async (reminder: MyReminder) => {
    if (opening) return;
    setOpening(reminder.id);
    try {
      await openMessageInChat(
        reminder.message?.channel_id,
        reminder.message_id,
      );
    } finally {
      setOpening(null);
    }
  };

  const cancel = async (reminder: MyReminder) => {
    if (cancelling) return;
    setCancelling(reminder.id);
    await CancelMessageReminder(
      reminder.message?.channel_id ?? "",
      reminder.message_id,
      reminder.id,
    );
    setCancelling(null);
  };

  return (
    <div className="chat-list-items chat-lists-class" data-pw="REMINDERS-LIST">
      <ChatFolderHeader title="Reminders" onBack={onBack} />
      {reminders.length === 0 && loading ? (
        <div className="flex justify-center p-[20px]">
          <Spinner />
        </div>
      ) : reminders.length === 0 ? (
        <div className="p-[20px] text-center text-[14px] text-[#8e8d92]">
          {translateFunction("No reminders")}
        </div>
      ) : (
        reminders.map((reminder) => {
          // The chat backend sends `content: ""` for some text messages
          // (seen on staging, 2026-09-26), so an empty text falls back too.
          const text =
            (reminder.message?.message_type === "TextMessage" &&
              reminder.message?.content) ||
            translateFunction(
              TYPE_PREVIEW[reminder.message?.message_type] || "message",
            );
          return (
            <div
              key={reminder.id}
              data-pw="REMINDER-ROW"
              data-message-id={reminder.message_id ?? reminder.message?.id ?? ""}
              className="flex items-center gap-[12px] px-[24px] py-[12px] border-b border-[#f0f0f0] bg-white"
              style={{ fontFamily: "var(--SF-Pro-Rounded-Regular)" }}
            >
              <button
                type="button"
                disabled={!!opening}
                onClick={() => open(reminder)}
                className="flex-1 min-w-0 flex flex-col items-start text-start disabled:cursor-wait"
              >
                <span className="text-[14px] text-[#1d1d1d] truncate max-w-full">
                  {reminder.message?.sender_user?.name ||
                    translateFunction("Message")}
                </span>
                <span className="text-[12px] text-[#5d5d5d] truncate max-w-full">
                  {text}
                </span>
                <span className="flex items-center gap-[5px] text-[11px] text-[#388CFF] mt-[2px]">
                  <img
                    src="/icons/chat/remind.svg"
                    alt=""
                    className="w-[11px] h-[11px]"
                  />
                  {formatReminderTime(reminder.remind_at, language)}
                </span>
              </button>
              {opening === reminder.id && <Spinner />}
              <button
                type="button"
                aria-label={translateFunction("Cancel reminder")}
                title={translateFunction("Cancel reminder")}
                onClick={() => cancel(reminder)}
                disabled={!!cancelling}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-full hover:bg-[#f0f0f0]"
              >
                {cancelling === reminder.id ? (
                  <Spinner />
                ) : (
                  <img
                    src="/icons/chat/cancel.svg"
                    alt=""
                    className="w-[12px] h-[12px]"
                  />
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default RemindersList;
