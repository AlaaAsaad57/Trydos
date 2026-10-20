import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * A small dialog over the chat, drawn like the delete confirm box in
 * OptionsMenu: a dark backdrop and a white card in the middle.
 *
 * It is sent to `document.body` for the same reason as that box: the message
 * row hides its menu on hover-out, and a dialog inside the row would go with
 * it. The body also puts it above the chat window (see ChatOptions).
 *
 * A portal still passes React events up to the message row, and the row of a
 * sent message listens for pointer events to swipe. So the dialog stops them
 * here, and a drag inside the dialog cannot move the message.
 */
function ChatDialog({
  open,
  title,
  onClose,
  children,
  dataPw,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  dataPw?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 z-9999999999999 flex items-center justify-center bg-[#0000006a]"
      onClick={(e) => {
        stop(e);
        if (e.target === e.currentTarget) onClose();
      }}
      onPointerDown={stop}
      onPointerMove={stop}
      onPointerUp={stop}
      onMouseLeave={stop}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-[400px]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-pw={dataPw}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 text-center">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default ChatDialog;
