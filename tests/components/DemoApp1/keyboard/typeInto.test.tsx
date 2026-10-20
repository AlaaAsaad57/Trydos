import React, { useState } from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  deleteBackward,
  insertText,
  textBefore,
} from "components/DemoApp1/keyboard/typeInto";

/** A field React controls, with the filter a demo field may have. */
function Controlled({
  start = "",
  filter = (v: string) => v,
  type = "text",
  maxLength,
}: {
  start?: string;
  filter?: (v: string) => string;
  type?: string;
  maxLength?: number;
}) {
  const [value, setValue] = useState(start);
  return (
    <input
      data-pw="field"
      type={type}
      maxLength={maxLength}
      value={value}
      onChange={(e) => setValue(filter(e.target.value))}
    />
  );
}

const field = (container: HTMLElement) => {
  const el = container.querySelector<HTMLInputElement>('[data-pw="field"]');
  expect(el, "the test's field was not drawn").not.toBeNull();
  return el!;
};

describe("typeInto — the demo keyboard writes into a field React controls", () => {
  it("puts a letter at the caret and tells React, so the field keeps it", () => {
    const { container } = render(<Controlled start="ac" />);
    const el = field(container);
    el.setSelectionRange(1, 1);
    act(() => insertText(el, "b"));
    expect(
      el.value,
      "the letter did not go in at the caret, or React put the old value back",
    ).toBe("abc");
    expect(
      el.selectionStart,
      "the caret is not right after the typed letter",
    ).toBe(2);
  });

  it("types over the selected text", () => {
    const { container } = render(<Controlled start="hello" />);
    const el = field(container);
    el.setSelectionRange(1, 4);
    act(() => insertText(el, "a"));
    expect(el.value, "the selected letters were not replaced").toBe("hao");
  });

  it("lets the field's own filter refuse a character", () => {
    const { container } = render(
      <Controlled filter={(v) => v.replace(/[^\d.]/g, "")} />,
    );
    const el = field(container);
    act(() => insertText(el, "7"));
    act(() => insertText(el, "x"));
    expect(
      el.value,
      "the field's onChange filter did not run on what the keyboard typed",
    ).toBe("7");
  });

  it("stops at the field's maxLength", () => {
    const { container } = render(<Controlled start="ab" maxLength={3} />);
    const el = field(container);
    el.setSelectionRange(2, 2);
    act(() => insertText(el, "c"));
    act(() => insertText(el, "d"));
    expect(el.value, "the keyboard typed past the field's maxLength").toBe(
      "abc",
    );
  });

  it("deletes the character before the caret, and nothing at the start", () => {
    const { container } = render(<Controlled start="abc" />);
    const el = field(container);
    el.setSelectionRange(2, 2);
    act(() => deleteBackward(el));
    expect(el.value, "the character before the caret was not deleted").toBe(
      "ac",
    );
    el.setSelectionRange(0, 0);
    act(() => deleteBackward(el));
    expect(el.value, "a delete at the start of the field took a character").toBe(
      "ac",
    );
  });

  it("deletes the whole selection", () => {
    const { container } = render(<Controlled start="hello" />);
    const el = field(container);
    el.setSelectionRange(1, 4);
    act(() => deleteBackward(el));
    expect(el.value, "the selected letters were not deleted").toBe("ho");
  });

  it("types at the end of an email field, which gives no caret", () => {
    const { container } = render(<Controlled start="a" type="email" />);
    const el = field(container);
    act(() => insertText(el, "@"));
    expect(el.value, "the character did not go to the end of the email").toBe(
      "a@",
    );
    act(() => deleteBackward(el));
    expect(el.value, "the last character of the email was not deleted").toBe(
      "a",
    );
  });

  it("reads the text before the caret", () => {
    const { container } = render(<Controlled start="Hi. there" />);
    const el = field(container);
    el.setSelectionRange(4, 4);
    expect(textBefore(el), "the text before the caret is wrong").toBe("Hi. ");
  });
});
