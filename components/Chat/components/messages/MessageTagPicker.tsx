import { useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { MESSAGE_TAGS, MessageTag, ToggleMessageTag } from "store/chat/actions";
import type { MessageTagSummary } from "utils/types/chat";
import ChatDialog from "./ChatDialog";
import { TAG_STYLES, isMyTag } from "./messageExtras";

/**
 * Put a tag of the fixed list on a message, or take mine off. Each row
 * toggles one tag and the dialog stays open, so several tags can change in
 * one visit. A tick marks the tags I put on the message.
 */
function MessageTagPicker({
  open,
  onClose,
  channelId,
  messageId,
  tags,
  myId,
}: {
  open: boolean;
  onClose: () => void;
  channelId: string | number;
  messageId: string | number;
  tags: MessageTagSummary[];
  myId: number | string | undefined | null;
}) {
  const [busy, setBusy] = useState<MessageTag | null>(null);

  const toggle = async (tag: MessageTag) => {
    if (busy) return;
    setBusy(tag);
    await ToggleMessageTag(channelId, messageId, tag);
    setBusy(null);
  };

  return (
    <ChatDialog
      open={open}
      onClose={onClose}
      title={translateFunction("Tag message")}
      dataPw="MESSAGE-TAG-PICKER"
    >
      <div className="flex flex-col gap-[8px]">
        {MESSAGE_TAGS.map((tag) => {
          const summary = tags.find((t) => t.tag === tag);
          const mine = isMyTag(summary?.user_ids, myId);
          return (
            <button
              key={tag}
              type="button"
              data-pw={`MESSAGE-TAG-${tag}`}
              aria-pressed={mine}
              disabled={!!busy}
              onClick={() => toggle(tag)}
              className={`flex items-center justify-between w-full rounded-lg px-4 py-3 border transition-shadow text-gray-900 font-medium ${
                mine
                  ? "bg-[#f0f0f0] border-gray-300"
                  : "bg-white border-gray-200 shadow-xs hover:shadow-md"
              } disabled:cursor-wait`}
            >
              <span className="flex items-center gap-[10px]">
                <span
                  className="w-[10px] h-[10px] rounded-full"
                  style={{ backgroundColor: TAG_STYLES[tag].color }}
                />
                {translateFunction(TAG_STYLES[tag].label)}
                {summary && summary.count > 0 && (
                  <span className="text-[12px] text-gray-500">
                    {summary.count}
                  </span>
                )}
              </span>
              <span className="w-[18px] h-[18px] flex items-center justify-center">
                {busy === tag ? (
                  <Spinner />
                ) : mine ? (
                  <img
                    src="/icons/chat/read.svg"
                    alt=""
                    className="w-[14px] h-[14px]"
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
      >
        {translateFunction("Close")}
      </button>
    </ChatDialog>
  );
}

export default MessageTagPicker;
