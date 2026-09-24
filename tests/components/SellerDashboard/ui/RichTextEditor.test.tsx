// The seller-dashboard rich-text editor (TipTap) that replaced the plain
// description <textarea>. The rest of the form treats it like a text input:
// it gets `value`, hands back HTML through `onChange`, and must hand back ""
// when the seller empties it, so the "required" checks that call `.trim()`
// keep working.
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "components/SellerDashboard/ui/RichTextEditor";

import { act, renderWithProviders, screen, waitFor } from "../../../render";

async function mount(props: {
  value: string;
  disabled?: boolean;
  error?: string;
}) {
  const onChange = vi.fn<(v: string) => void>();
  const utils = await renderWithProviders(
    <RichTextEditor {...props} onChange={onChange} />,
  );
  // `immediatelyRender: false` builds the editor in an effect, so the
  // toolbar is only on the page one tick after the first render.
  await screen.findByRole("button", { name: "Bold" });
  return { ...utils, onChange };
}

const editorEl = (container: HTMLElement) =>
  container.querySelector(".ProseMirror") as HTMLElement;

/** TipTap puts its own editor object on the editable element. The tests use
 *  it only to select text or clear it — what jsdom cannot do by key or mouse. */
const tiptap = (container: HTMLElement) => (editorEl(container) as any).editor;

// jsdom has no layout, so ProseMirror's "scroll the caret into view" step finds
// no getClientRects on ranges or elements. Empty answers are enough.
beforeAll(() => {
  const rect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  const rects = () => Object.assign([rect], { item: () => rect }) as any;
  Range.prototype.getClientRects = rects;
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  if (!(Text.prototype as any).getClientRects) (Text.prototype as any).getClientRects = rects;
  document.elementFromPoint = () => null;
});

describe("RichTextEditor", () => {
  it("shows the starting value and one toolbar button per format", async () => {
    const { container } = await mount({ value: "<p>Soft cotton</p>" });

    expect(
      editorEl(container).innerHTML,
      "the editor did not show the description it was given",
    ).toContain("Soft cotton");
    for (const name of ["Bold", "Italic", "Underline", "Heading"]) {
      expect(
        screen.getByRole("button", { name }),
        `the "${name}" toolbar button is missing`,
      ).toBeEnabled();
    }
  });

  it("marks the selected text bold, italic, underlined or as a heading and reports the new HTML", async () => {
    const { container, onChange } = await mount({ value: "<p>Soft</p>" });

    act(() => tiptap(container).commands.selectAll());
    act(() => screen.getByRole("button", { name: "Bold" }).click());
    await waitFor(() =>
      expect(
        onChange.mock.calls.at(-1)?.[0],
        "pressing Bold did not send back bold HTML",
      ).toContain("<strong>"),
    );

    act(() => screen.getByRole("button", { name: "Italic" }).click());
    await waitFor(() =>
      expect(
        onChange.mock.calls.at(-1)?.[0],
        "pressing Italic did not send back italic HTML",
      ).toContain("<em>"),
    );

    act(() => screen.getByRole("button", { name: "Underline" }).click());
    await waitFor(() =>
      expect(
        onChange.mock.calls.at(-1)?.[0],
        "pressing Underline did not send back underlined HTML",
      ).toContain("<u>"),
    );

    act(() => screen.getByRole("button", { name: "Heading" }).click());
    await waitFor(() =>
      expect(
        onChange.mock.calls.at(-1)?.[0],
        "pressing Heading did not turn the paragraph into an <h2>",
      ).toContain("<h2>"),
    );
  });

  it("sends an empty string, not an empty paragraph, when the seller clears the text", async () => {
    const { container, onChange } = await mount({ value: "<p>x</p>" });
    // The same transaction a select-all + Delete produces.
    act(() => tiptap(container).commands.clearContent(true));

    await waitFor(() =>
      expect(
        onChange.mock.calls.at(-1)?.[0],
        "an emptied editor must report \"\" so required checks fail",
      ).toBe(""),
    );
  });

  it("shows a new value that arrives from outside, and leaves an unchanged one alone", async () => {
    const { container, rerender } = await mount({ value: "" });
    const onChange = vi.fn();

    rerender(<RichTextEditor value="<p>Loaded later</p>" onChange={onChange} />);
    await waitFor(() =>
      expect(
        editorEl(container).innerHTML,
        "the editor did not pick up the value loaded after mount",
      ).toContain("Loaded later"),
    );
    expect(
      onChange,
      "an outside value change must not be echoed back as a seller edit",
    ).not.toHaveBeenCalled();

    // Same value again: nothing to replace.
    rerender(<RichTextEditor value="<p>Loaded later</p>" onChange={onChange} />);
    expect(
      editorEl(container).innerHTML,
      "passing the same value again must keep the text as it is",
    ).toContain("Loaded later");
  });

  it("locks the toolbar and the text in view mode and paints the error border", async () => {
    const { container, rerender } = await mount({
      value: "<p>Read only</p>",
      disabled: true,
      error: "Required",
    });

    expect(
      screen.getByRole("button", { name: "Bold" }),
      "the toolbar must be disabled in view mode",
    ).toBeDisabled();
    expect(
      editorEl(container).getAttribute("contenteditable"),
      "the text must not be editable in view mode",
    ).toBe("false");
    expect(
      container.querySelector(".border-\\[\\#f85555\\]"),
      "an error must paint the red border on the editor",
    ).not.toBeNull();

    rerender(<RichTextEditor value="<p>Read only</p>" onChange={vi.fn()} />);
    await waitFor(() =>
      expect(
        editorEl(container).getAttribute("contenteditable"),
        "leaving view mode must make the text editable again",
      ).toBe("true"),
    );
  });
});
