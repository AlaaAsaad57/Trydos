"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { translateFunction } from "utils/functions";
import { dashInputClass } from "components/SellerDashboard/ui";

const t = (s: string) => translateFunction(s);

/**
 * Minimal seller-dashboard rich-text editor: Bold / Italic / Underline / H2.
 * Drop-in for the old <textarea>/<Area> (same value/onChange/disabled/error API).
 * Emits "" when empty so existing `.trim()` "required" validation keeps working.
 * The saved HTML is sanitized at the save chokepoints (see helpers.ts), and the
 * storefront sanitizes again on render — defense in depth.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const editor = useEditor({
    // Next.js SSR: never render on the server (avoids hydration mismatch).
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        // StarterKit v3 bundles these; disable so our explicit extension / gate wins.
        underline: false,
        link: false,
      }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sync external value changes (data load, boutique "Copy from") without
  // stomping the caret while the user is typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `w-8 h-8 rounded-md text-[13px] flex items-center justify-center transition-colors disabled:opacity-50 ${
      active
        ? "bg-[#5d5d5d] text-white"
        : "bg-[#f2f2f2] text-[#5d5d5d] hover:bg-[#e6e6e6]"
    }`;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <button
          type="button"
          disabled={disabled}
          title={t("Bold")}
          aria-label={t("Bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Italic")}
          aria-label={t("Italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Underline")}
          aria-label={t("Underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Heading")}
          aria-label={t("Heading")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </button>
      </div>
      <EditorContent
        editor={editor}
        className={`${dashInputClass} h-auto py-3 leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px] [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:my-1 [&_strong]:font-bold [&_u]:underline ${
          error ? "border-[#f85555]" : ""
        } ${disabled ? "opacity-70" : ""}`}
      />
    </div>
  );
}
