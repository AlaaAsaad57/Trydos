import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

/**
 * A row at the top of the chat list that opens a folder: the archived chats,
 * or my reminders. It shows only while the folder holds something.
 */
function ChatFolderRow({
  icon,
  label,
  count,
  onClick,
  dataPw,
}: {
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
  dataPw?: string;
}) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <button
      type="button"
      data-pw={dataPw}
      onClick={onClick}
      className={`flex w-full items-center gap-[14px] px-[24px] py-[12px] bg-white hover:bg-[#fafafa] transition-colors border-b border-[#f0f0f0] ${
        isRtl ? "flex-row-reverse text-right" : "flex-row text-left"
      }`}
      style={{ fontFamily: "var(--SF-Pro-Rounded-Regular)" }}
    >
      <img src={icon} alt="" className="w-[18px] h-[18px]" />
      <span className="flex-1 text-[14px] text-[#1d1d1d]">
        {translateFunction(label)}
      </span>
      <span className="text-[12px] text-[#8e8d92]">{count}</span>
    </button>
  );
}

/** The header of an open folder: a back arrow and the folder name. */
export function ChatFolderHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="forwarded-label" aria-label={isRtl ? "ar" : undefined}>
      <button
        type="button"
        className="forward-cancel-icon"
        aria-label={translateFunction("Back")}
        onClick={onBack}
      >
        <img
          src="/icons/chat/arrow.svg"
          alt=""
          className={isRtl ? "rotate-180" : undefined}
        />
      </button>
      <div className="forward-text">{translateFunction(title)}</div>
    </div>
  );
}

export default ChatFolderRow;
