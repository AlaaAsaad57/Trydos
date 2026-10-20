/**
 * Types into a real field for the demo's own keyboard (`DemoKeyboard`).
 *
 * The field is a normal `<input>` or `<textarea>` that React controls. A plain
 * `field.value = …` is not seen by React, so the value goes in through the
 * element's own setter and an `input` event follows it. The field's `onChange`
 * then runs as if the phone's keyboard had typed, with its own filters.
 */

export type TextField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Where the caret is. `email` and `number` inputs do not say (the browser
 * gives null or throws), so there the caret is taken to be at the end.
 */
function caret(field: TextField): [number, number] {
  const end = field.value.length;
  try {
    const from = field.selectionStart;
    const to = field.selectionEnd;
    if (from === null || to === null) return [end, end];
    return [from, to];
  } catch {
    return [end, end];
  }
}

function write(field: TextField, value: string, at: number, data: string | null) {
  const proto =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, value);
  try {
    field.setSelectionRange(at, at);
  } catch {
    // An `email` or `number` input keeps its caret at the end on its own.
  }
  field.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      data,
      inputType: data === null ? "deleteContentBackward" : "insertText",
    }),
  );
}

/** Puts `text` at the caret, in place of what is selected. */
export function insertText(field: TextField, text: string) {
  const [from, to] = caret(field);
  const limit = field.maxLength >= 0 ? field.maxLength : Infinity;
  const room = limit - (field.value.length - (to - from));
  const added = text.slice(0, Math.max(0, room));
  if (added === "") return;
  write(
    field,
    field.value.slice(0, from) + added + field.value.slice(to),
    from + added.length,
    added,
  );
}

/** Takes away what is selected, or the one character before the caret. */
export function deleteBackward(field: TextField) {
  const [from, to] = caret(field);
  if (from === to && from === 0) return;
  // One whole character: a letter outside the basic plane is two code units.
  const before = [...field.value.slice(0, from)];
  const start = from === to ? from - (before.pop()?.length ?? 1) : from;
  write(field, field.value.slice(0, start) + field.value.slice(to), start, null);
}

/** The text before the caret: what auto-capital reads. */
export function textBefore(field: TextField) {
  return field.value.slice(0, caret(field)[0]);
}
