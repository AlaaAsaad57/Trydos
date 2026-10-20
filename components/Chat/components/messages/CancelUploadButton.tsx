import React from "react";
import { cancelUpload, useUploadRunning } from "components/Chat/uploadCancel";
import { translateFunction } from "utils/functions";

/**
 * The X a pending bubble shows while its file, video, photo or voice note is
 * still uploading. It takes the place of the bubble's own play button or
 * spinner (`children`), which come back once the upload ends: the message is
 * then already being sent, so there is nothing left to cancel.
 */
export default function CancelUploadButton({
  mid,
  className = "",
  children = null,
}: {
  mid?: number | string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const uploading = useUploadRunning(String(mid ?? ""));
  if (!mid || !uploading) return <>{children}</>;
  const label = translateFunction("Cancel upload");
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-pw="chat-cancel-upload"
      className={`flex items-center justify-center w-[20px] h-[20px] min-w-[20px] rounded-full bg-[#3C3C3C] cursor-pointer ${className}`}
      onClick={(e) => {
        // The file bubble draws it inside its download link, and every bubble
        // opens its menu on a tap. Pressing the X must do neither.
        e.preventDefault();
        e.stopPropagation();
        cancelUpload(String(mid));
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
