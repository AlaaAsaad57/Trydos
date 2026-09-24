// The hover menu on a chat bubble (components/Chat/components/OptionsMenu.tsx):
// reply, forward, copy, delete (with its confirm box) and edit.
//
// TextMessage's own use of this menu is covered in
// tests/components/Chat/MessageOptionsEdit.test.tsx; this file drives the menu
// directly, for every option and both kinds of menu (message and call).
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import OptionsMenu from "components/Chat/components/OptionsMenu";

const ME = 1;
const THEM = 2;

async function mount(extra: Record<string, any> = {}, message: Record<string, any> = {}, language: any = "en") {
  const props = {
    isPrivate: null,
    isSender: true,
    DeleteModal: false,
    setDelete: vi.fn(),
    deleteMessage: vi.fn(),
    copy: vi.fn(),
    forward: vi.fn(),
    click: vi.fn(),
    message: {
      sender_user_id: ME,
      message_type: { name: "TextMessage" },
      message_content: { content: "hello" },
      ...message,
    },
    ...extra,
  };
  const r = await renderWithProviders(<OptionsMenu {...props} />, { language, store: { userChat: { id: ME } } });
  return { ...r, props: props as any };
}

describe("OptionsMenu — the message menu", () => {
  it("replies, forwards, copies and opens the delete box", async () => {
    const { props } = await mount({ setImg: vi.fn() });
    const input = document.createElement("input");
    input.id = "type";
    document.body.append(input);
    fireEvent.click(screen.getByText("Reply").parentElement!);
    expect(props.click, "reply did not start").toHaveBeenCalled();
    expect(document.activeElement, "reply did not move the cursor to the input").toBe(input);
    fireEvent.click(screen.getByText("Forward").parentElement!);
    expect(props.forward, "forward did not start").toHaveBeenCalled();
    fireEvent.click(screen.getByText("Copy").parentElement!);
    fireEvent.keyDown(screen.getByText("Copy").parentElement!, { key: "Enter" });
    fireEvent.keyDown(screen.getByText("Copy").parentElement!, { key: " " });
    fireEvent.keyDown(screen.getByText("Copy").parentElement!, { key: "a" });
    expect(props.copy, "copy did not run on click, Enter and Space").toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByText("Delete").parentElement!);
    expect(props.setDelete, "delete did not open the confirm box").toHaveBeenCalledWith(true);
    fireEvent.click(document.querySelector('img[src="/icons/EyeIcon.svg"]')!.parentElement!);
    expect(props.setImg, "the eye button did not open the image").toHaveBeenCalled();
    input.remove();
  });

  it("hides Forward in an order chat and Copy/Edit on a file", async () => {
    await mount({ isPrivate: 4 }, { message_type: { name: "FileMessage" } });
    expect(screen.queryByText("Forward"), "an order chat offered Forward").toBeNull();
    expect(screen.queryByText("Copy"), "a file offered Copy").toBeNull();
    expect(screen.queryByText("Edit"), "a file offered Edit").toBeNull();
  });

  it("opens the edit box with the text, and closes it on Cancel or the backdrop", async () => {
    await mount();
    fireEvent.click(screen.getByText("Edit").parentElement!);
    const box = screen.getByLabelText("Message input") as HTMLTextAreaElement;
    expect(box.value, "the edit box did not start with the message text").toBe("hello");
    expect(screen.getByText("Edt").closest("button"), "saving the same text was allowed").toBeDisabled();
    fireEvent.change(box, { target: { value: "hello again" } });
    expect(screen.getByText("Edt").closest("button"), "a changed text could not be saved").not.toBeDisabled();
    fireEvent.click(screen.getByText("Edt"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Message input"), "Cancel did not close the edit box").toBeNull();
    fireEvent.click(screen.getByText("Edit").parentElement!);
    fireEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(screen.queryByLabelText("Message input"), "the backdrop did not close the edit box").toBeNull();
  });

  it("aligns the edit box right for Arabic", async () => {
    await mount({}, {}, "ar");
    fireEvent.click(document.querySelector('img[src="/icons/chat/edit.svg"]')!.parentElement!);
    expect((screen.getByLabelText("Message input") as HTMLElement).className, "the edit box did not align right for Arabic").toContain("text-right");
  });

  it("an edit box on a text with no content starts empty, in English left to right", async () => {
    await mount({}, { message_content: { content: 5 } });
    fireEvent.click(screen.getByText("Edit").parentElement!);
    const box = screen.getByLabelText("Message input") as HTMLTextAreaElement;
    expect(box.value, "a non-text content was put in the edit box").toBe("");
    expect(box.className, "the edit box did not align left for English").toContain("text-left");
  });

  it("BUG-chat-10: clearing the text keeps the edit box open", async () => {
    await mount();
    fireEvent.click(screen.getByText("Edit").parentElement!);
    fireEvent.change(screen.getByLabelText("Message input"), { target: { value: "" } });
    expect(
      screen.queryByLabelText("Message input") !== null,
      "deleting all the text closed the edit box instead of leaving it empty",
    ).toBe(true);
  });

  it.fails("BUG-chat-9: saving an edited message does something", async () => {
    await mount();
    fireEvent.click(screen.getByText("Edit").parentElement!);
    fireEvent.change(screen.getByLabelText("Message input"), { target: { value: "hello again" } });
    fireEvent.click(screen.getByText("Edt"));
    expect(
      screen.queryByLabelText("Message input") === null,
      "the edit box's save button did nothing: the box stayed open and the change went nowhere",
    ).toBe(true);
  });
});

describe("OptionsMenu — the delete confirm box", () => {
  it("my own message can be deleted for everyone or for me", async () => {
    const { props } = await mount({ DeleteModal: true });
    expect(screen.getByText("Do you want to delete this message?").parentElement!.parentElement!.parentElement, "the confirm box was not put on the body").toBe(document.body);
    fireEvent.click(screen.getByText("For All"));
    expect(props.deleteMessage, "delete for everyone did not run").toHaveBeenCalledWith(true);
    fireEvent.keyDown(screen.getByText("For All"), { key: "Enter" });
    fireEvent.keyDown(screen.getByText("For All"), { key: "x" });
    fireEvent.click(screen.getByText("For Me"));
    fireEvent.keyDown(screen.getByText("For Me"), { key: " " });
    fireEvent.keyDown(screen.getByText("For Me"), { key: "x" });
    expect(props.deleteMessage.mock.calls.map((c: any) => c[0]), "the delete choices were wrong").toEqual([true, true, false, false]);
    expect(props.setDelete, "the confirm box did not close after a choice").toHaveBeenCalledWith(false);
  });

  it("someone else's message offers Cancel instead of For All", async () => {
    const { props } = await mount({ DeleteModal: true }, { sender_user_id: THEM });
    expect(screen.queryByText("For All"), "someone else's message could be deleted for everyone").toBeNull();
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.setDelete, "Cancel did not close the confirm box").toHaveBeenCalledWith(false);
  });

  it("closes on Escape and on the backdrop, not on a click inside", async () => {
    const { props } = await mount({ DeleteModal: true });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(props.setDelete, "a key other than Escape closed the box").not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.setDelete, "Escape did not close the box").toHaveBeenCalledWith(false);
    props.setDelete.mockClear();
    fireEvent.click(screen.getByRole("dialog"));
    expect(props.setDelete, "a click inside the box closed it").not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(props.setDelete, "the backdrop did not close the box").toHaveBeenCalledWith(false);
  });
});

describe("OptionsMenu — the call menu", () => {
  it("offers only Delete, and a call can be deleted only for me", async () => {
    const { props } = await mount({ isCall: true, DeleteModal: true });
    fireEvent.click(document.querySelector(".message-opt")!);
    expect(props.setDelete, "the call menu did not open the delete box").toHaveBeenCalledWith(true);
    expect(screen.queryByText("Reply"), "the call menu offered Reply").toBeNull();
    expect(screen.queryByText("For All"), "a call could be deleted for everyone").toBeNull();
  });
});
