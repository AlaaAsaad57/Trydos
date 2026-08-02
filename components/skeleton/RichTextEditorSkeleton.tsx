"use client";

// Loading fallback for the lazily-loaded TipTap RichTextEditor. Mirrors its
// shape — a toolbar row of 32px buttons above a bordered text area — so the
// seller edit forms don't jump when the editor chunk swaps in.
function RichTextEditorSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-2">
        <div className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
        <div className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
        <div className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
        <div className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
      </div>
      <div className="w-full min-h-[112px] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
    </div>
  );
}

export default RichTextEditorSkeleton;
