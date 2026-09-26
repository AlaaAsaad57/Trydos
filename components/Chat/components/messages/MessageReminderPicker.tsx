import { useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { CancelMessageReminder, SetMessageReminder } from "store/chat/actions";
import type { MessageReminderInfo } from "utils/types/chat";
import ChatDialog from "./ChatDialog";
import { REMINDER_LATEST, formatReminderTime } from "./messageExtras";

/** The quick choices. `at` answers the time from "now". */
const PRESETS: { label: string; at: (now: Date) => Date }[] = [
  { label: "In 20 minutes", at: (now) => new Date(now.getTime() + 20 * 60000) },
  { label: "In 1 hour", at: (now) => new Date(now.getTime() + 60 * 60000) },
  { label: "In 3 hours", at: (now) => new Date(now.getTime() + 180 * 60000) },
  {
    label: "Tomorrow morning",
    at: (now) => {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    },
  },
];

/** A Date as the value a `datetime-local` input takes, in local time. */
const toInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

/**
 * Set a reminder on a message, move it, or cancel it. The backend keeps one
 * active reminder per message for me, so setting a new time moves the one
 * the message has.
 */
function MessageReminderPicker({
  open,
  onClose,
  channelId,
  messageId,
  reminder,
}: {
  open: boolean;
  onClose: () => void;
  channelId: string | number;
  messageId: string | number;
  reminder: MessageReminderInfo | null | undefined;
}) {
  const { language } = useAppStore();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const close = () => {
    setCustom("");
    setError(null);
    onClose();
  };

  const save = async (key: string, at: Date) => {
    if (busy) return;
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      setError(translateFunction("Choose a time in the future"));
      return;
    }
    if (at.getTime() > REMINDER_LATEST.getTime()) {
      setError(translateFunction("Choose an earlier time"));
      return;
    }
    setError(null);
    setBusy(key);
    const saved = await SetMessageReminder(channelId, messageId, at);
    setBusy(null);
    if (saved) close();
  };

  const cancel = async () => {
    if (busy || !reminder?.id) return;
    setBusy("cancel");
    const done = await CancelMessageReminder(channelId, messageId, reminder.id);
    setBusy(null);
    if (done) close();
  };

  const optionClass =
    "flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xs hover:shadow-md transition-shadow text-gray-900 font-medium disabled:cursor-wait";

  return (
    <ChatDialog
      open={open}
      onClose={close}
      title={translateFunction("Remind me")}
      dataPw="MESSAGE-REMINDER-PICKER"
    >
      {reminder?.remind_at && (
        <div className="flex items-center justify-between gap-[10px] mb-4 rounded-lg bg-[#f0f0f0] px-4 py-3">
          <span className="text-[14px] text-gray-900">
            {`${translateFunction("Reminder set for")}: ${formatReminderTime(
              reminder.remind_at,
              language,
            )}`}
          </span>
          <button
            type="button"
            data-pw="MESSAGE-REMINDER-CANCEL"
            disabled={!!busy}
            onClick={cancel}
            className="text-[14px] font-medium text-[#f85555] shrink-0"
          >
            {busy === "cancel" ? (
              <Spinner />
            ) : (
              translateFunction("Cancel reminder")
            )}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-[8px]">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={!!busy}
            className={optionClass}
            onClick={() => save(preset.label, preset.at(new Date()))}
          >
            <span>{translateFunction(preset.label)}</span>
            {busy === preset.label && <Spinner />}
          </button>
        ))}
      </div>
      <label
        htmlFor="message-reminder-custom"
        className="block text-sm font-medium text-gray-700 mt-4 mb-2"
      >
        {translateFunction("Pick a date and time")}
      </label>
      <div className="flex gap-[8px]">
        <input
          id="message-reminder-custom"
          type="datetime-local"
          value={custom}
          min={toInputValue(new Date())}
          max={toInputValue(REMINDER_LATEST)}
          onChange={(e) => {
            setCustom(e.target.value);
            setError(null);
          }}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-xl text-gray-800 bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          disabled={!custom || !!busy}
          onClick={() => save("custom", new Date(custom))}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            !custom || busy
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {busy === "custom" ? <Spinner /> : translateFunction("Set")}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-[#f85555]">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={close}
        className="mt-4 w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
      >
        {translateFunction("Close")}
      </button>
    </ChatDialog>
  );
}

export default MessageReminderPicker;
