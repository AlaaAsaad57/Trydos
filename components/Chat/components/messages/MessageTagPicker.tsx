import { useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { MessageTag, ToggleMessageTag } from "store/chat/actions";
import type { MessageTagSummary } from "utils/types/chat";
import ChatDialog from "./ChatDialog";
import {
  MAX_TAG_LENGTH,
  isMyTag,
  normalizeTag,
  tagLabel,
  tagStyle,
} from "./messageExtras";

/**
 * Put a tag on a message, or take mine off. The list shows the suggested tags
 * and the tags already on the message, and the input adds any new free-text
 * tag (up to 30 characters). Each row toggles one tag and the dialog stays
 * open, so several tags can change in one visit. A tick marks my tags.
 */
function MessageTagPicker({
  open,
  onClose,
  channelId,
  messageId,
  tags,
  channelTags = [],
  myId,
}: {
  open: boolean;
  onClose: () => void;
  channelId: string | number;
  messageId: string | number;
  tags: MessageTagSummary[];
  /** Tags used by the chat's loaded messages (repeats are fine). */
  channelTags?: MessageTag[];
  myId: number | string | undefined | null;
}) {
  const [busy, setBusy] = useState<MessageTag | null>(null);
  const [text, setText] = useState("");

  const toggle = async (tag: MessageTag) => {
    if (busy) return;
    setBusy(tag);
    await ToggleMessageTag(channelId, messageId, tag);
    setBusy(null);
  };

  // Every tag the chat's loaded messages use, then this message's own.
  const allTags: MessageTag[] = Array.from(
    new Set([
      ...channelTags,
      ...tags.filter((t) => t.count > 0).map((t) => t.tag),
    ]),
  );

  const addTag = async () => {
    const tag = normalizeTag(text);
    if (!tag || busy) return;
    const existing = tags.find((t) => t.tag === tag);
    // A toggle would take my own tag off, so an add of a tag I have is a no-op.
    if (!isMyTag(existing?.user_ids, myId)) await toggle(tag);
    setText("");
  };

  return (
    <ChatDialog
      open={open}
      onClose={onClose}
      title={translateFunction("Tag message")}
      dataPw="MESSAGE-TAG-PICKER"
    >
      <form
        className="flex gap-[8px] mb-[8px]"
        onSubmit={(e) => {
          e.preventDefault();
          addTag();
        }}
      >
        <input
          type="text"
          data-pw="MESSAGE-TAG-INPUT"
          value={text}
          maxLength={MAX_TAG_LENGTH * 2}
          onChange={(e) =>
            setText(Array.from(e.target.value).slice(0, MAX_TAG_LENGTH).join(""))
          }
          placeholder={translateFunction("New tag")}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 border border-gray-200 text-gray-900"
        />
        <button
          type="submit"
          data-pw="MESSAGE-TAG-ADD"
          disabled={!!busy || !normalizeTag(text)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium disabled:opacity-50"
        >
          {translateFunction("Add")}
        </button>
      </form>
      <div className="flex flex-col gap-[8px] max-h-[50vh] overflow-y-auto">
        {allTags.map((tag) => {
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
              <span className="flex items-center gap-[10px] min-w-0">
                <span
                  className="w-[10px] h-[10px] shrink-0 rounded-full"
                  style={{ backgroundColor: tagStyle(tag).color }}
                />
                <span className="truncate">
                  {tagLabel(tag, translateFunction)}
                </span>
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
