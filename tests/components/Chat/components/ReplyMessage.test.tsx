// The "replying to" bar above the chat input
// (components/Chat/components/ReplyMessage.tsx).
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import ReplyMessage from "components/Chat/components/ReplyMessage";

async function mount(message: Record<string, any>) {
  const cancel = vi.fn();
  await renderWithProviders(<ReplyMessage message={message} cancel={cancel} />);
  return { cancel, content: document.querySelector(".reply-content") as HTMLElement };
}

describe("ReplyMessage", () => {
  it("shows the text being replied to and cancels the reply", async () => {
    const { cancel, content } = await mount({ message_type: { name: "TextMessage" }, message_content: { content: "hello" } });
    expect(content.textContent, "the replied text was not shown").toBe("hello");
    expect(content.className, "a text reply was laid out inline").not.toContain("inline-flex");
    fireEvent.click(document.querySelector(".cancel-reply-icon")!);
    expect(cancel, "the reply was not cancelled").toHaveBeenCalled();
  });

  it("shows the product being replied to", async () => {
    const { content } = await mount({
      message_type: { name: "ShareProduct" },
      message_content: { content: JSON.stringify([{ product_name: "Red Shoe", product_image_url: "/shoe.png" }]) },
    });
    expect(content.textContent, "the product name was not shown").toContain("Red Shoe");
    expect(screen.getByAltText("Image"), "the product picture was not shown").toBeInTheDocument();
  });

  it.each([
    ["ImageMessage", "Image", { message_files: [{ file_path: "https://example.com/p.png" }] }],
    ["VideoMessage", "Video", {}],
    ["VoiceMessage", "Audio", {}],
    ["FileMessage", "File", {}],
  ])("names a %s being replied to", async (type, label, extra) => {
    const { content } = await mount({ message_type: { name: type }, ...extra });
    expect(content.textContent, `a ${type} reply was not named`).toContain(label);
    expect(content.className, `a ${type} reply was not laid out inline`).toContain("inline-flex");
  });

  it("shows nothing for a type it does not know", async () => {
    const { content } = await mount({ message_type: { name: "Sticker" } });
    expect(content.textContent, "an unknown type showed text").toBe("");
  });
});
