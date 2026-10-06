import { useState } from "react";
import Spinner from "components/global/Spinner";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";
import {
  GetTaggedMessages,
  MESSAGE_TAGS,
  MessageTag,
} from "store/chat/actions";
import {
  MAX_TAG_LENGTH,
  dateLocale,
  normalizeTag,
  tagLabel,
  tagStyle,
} from "./messages/messageExtras";

/** The text a row shows for a message that is not text. */
const TYPE_PREVIEW: Record<string, string> = {
  ImageMessage: "image",
  VideoMessage: "video",
  VoiceMessage: "voice message",
  FileMessage: "file",
  ShareProduct: "Product",
};

/**
 * The "Tagged messages" block of the chat info panel. Pick a tag to list the
 * messages of this chat that carry it; tap one to jump to it in the chat. The
 * jump can load many messages first, so the row shows a spinner until then.
 */
function TaggedMessages({
  channelId,
  openMessage,
}: {
  channelId: string | number;
  openMessage: (messageId: string | number) => Promise<void> | void;
}) {
  const { language } = useAppStore();
  const [tag, setTag] = useState<MessageTag | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (messageId: string | number) => {
    if (opening) return;
    setOpening(String(messageId));
    try {
      await openMessage(messageId);
    } finally {
      setOpening(null);
    }
  };

  const pick = async (next: MessageTag) => {
    if (loading) return;
    if (next === tag) {
      setTag(null);
      setMessages(null);
      return;
    }
    setTag(next);
    setMessages(null);
    setLoading(true);
    const found = await GetTaggedMessages(channelId, next);
    setLoading(false);
    setMessages(found);
  };

  return (
    <div
      className="chat-user-files-container"
      data-pw="TAGGED-MESSAGES"
      // chatcomponent.css gives this box a fixed 75px row. The list below
      // needs it to grow, and plain CSS wins over Tailwind classes here.
      style={{
        height: "auto",
        flexDirection: "column",
        alignItems: "stretch",
        paddingBottom: 13,
        paddingRight: 15,
        cursor: "default",
      }}
    >
      <div className="flex items-center gap-[10px] w-full">
        <div className="chat-user-files-icon">
          <img src="/icons/chat/categ.svg" alt="" />
        </div>
        <div className="text-[#8d8d8d]">
          {translateFunction("Tagged messages")}
        </div>
      </div>
      <div className="flex flex-wrap gap-[6px] mt-[10px]">
        {(tag && !MESSAGE_TAGS.includes(tag)
          ? [...MESSAGE_TAGS, tag]
          : MESSAGE_TAGS
        ).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tag === t}
            data-pw={`TAGGED-FILTER-${t}`}
            onClick={() => pick(t)}
            className={`flex items-center gap-[5px] h-[26px] px-[10px] max-w-full rounded-[12px] text-[12px] text-[#404040] transition-colors ${
              tag === t ? "bg-[#f0f0f0]" : "bg-[#fafafa]"
            }`}
            style={{
              boxShadow:
                tag === t
                  ? `inset 0 0 0 1px ${tagStyle(t).color}`
                  : "rgba(0, 0, 0, 0.167) 0px 2px 10px",
            }}
          >
            <span
              className="w-[7px] h-[7px] shrink-0 rounded-full"
              style={{ backgroundColor: tagStyle(t).color }}
            />
            <span className="truncate">{tagLabel(t, translateFunction)}</span>
          </button>
        ))}
      </div>
      <form
        className="flex gap-[6px] mt-[8px]"
        onSubmit={(e) => {
          e.preventDefault();
          const next = normalizeTag(custom);
          if (!next) return;
          setCustom("");
          if (next !== tag) pick(next);
        }}
      >
        <input
          type="text"
          data-pw="TAGGED-FILTER-INPUT"
          value={custom}
          onChange={(e) =>
            setCustom(
              Array.from(e.target.value).slice(0, MAX_TAG_LENGTH).join(""),
            )
          }
          placeholder={translateFunction("Search a tag")}
          className="flex-1 min-w-0 h-[28px] px-[10px] rounded-[12px] text-[12px] bg-[#fafafa] border border-[#f0f0f0]"
        />
      </form>
      {tag && (
        <div
          className="mt-[10px] flex flex-col"
          data-pw="TAGGED-MESSAGES-LIST"
          // Its own scroll box, so a long list does not push the rest of the
          // panel away. Inline for the same reason as the box above.
          style={{ maxHeight: 240, overflowY: "auto" }}
        >
          {loading && (
            <div className="flex justify-center py-[10px]">
              <Spinner />
            </div>
          )}
          {!loading && messages === null && (
            <div className="text-[13px] text-[#f85555] py-[6px]">
              {translateFunction("Could not load the messages")}
            </div>
          )}
          {!loading && messages?.length === 0 && (
            <div className="text-[13px] text-[#8e8d92] py-[6px]">
              {translateFunction("No messages with this tag")}
            </div>
          )}
          {!loading &&
            messages?.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!!opening}
                onClick={() => open(m.id)}
                className="flex items-center justify-between gap-[10px] py-[8px] border-b border-[#f0f0f0] text-start"
              >
                <span className="flex-1 min-w-0 truncate text-[13px] text-[#1d1d1d]">
                  {m.message_type?.name === "TextMessage"
                    ? m.message_content?.content
                    : translateFunction(
                        TYPE_PREVIEW[m.message_type?.name] || "message",
                      )}
                </span>
                {opening === String(m.id) ? (
                  <Spinner />
                ) : (
                  <span className="shrink-0 text-[11px] text-[#8e8d92]">
                    {new Date(m.created_at).toLocaleDateString(
                      dateLocale(language),
                    )}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default TaggedMessages;
