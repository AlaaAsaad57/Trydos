import { useIsAutoSaving } from "components/Chat/useIsAutoSaving";
import { translateFunction } from "utils/functions";

// The blur drawn over a photo or video while the chat saves it by itself
// (media that came while the page was closed). It goes away when the save ends,
// or after a short limit, so it can never hide the media for good.
//
// It sits above the dark shade of the bubble (`z-index: 9999` in
// ChatWindow.css) and ignores the pointer, so a tap still opens the media.
function AutoSaveVeil({ filePath }: { filePath?: string }) {
  const saving = useIsAutoSaving(filePath);
  if (!saving) return null;

  return (
    <div
      data-pw="chat-media-saving"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-[10001] flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-black/25 text-xs text-white backdrop-blur-lg"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white"
      />
      {translateFunction("Saving…")}
    </div>
  );
}

export default AutoSaveVeil;
