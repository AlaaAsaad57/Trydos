// A shared product bubble (components/Chat/components/messages/Types/ProductMessage.tsx):
// the product card, its link, and the options it hands to its menu.
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../render";

const h = vi.hoisted(() => ({ menus: [] as any[], deleteMessage: null as any, copyText: null as any }));

vi.mock("components/Chat/components/OptionsMenu", () => ({
  default: (p: any) => {
    h.menus.push(p);
    return <div data-testid="menu" />;
  },
}));
vi.mock("components/Chat/components/ChatPhoto", () => ({ default: () => <div data-testid="avatar" /> }));
vi.mock("store/chat/chatUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DeleteMessage: (...a: any[]) => h.deleteMessage(...a),
  copyText: (...a: any[]) => h.copyText(...a),
}));

import ProductMessage from "components/Chat/components/messages/Types/ProductMessage";
import ChatMessage from "components/Chat/components/ChatMessage";
import { useAppStore } from "store";

const ME = 1;
const CONTENT = {
  content: JSON.stringify([{ product_slug: "red-shoe", product_image_url: "/shoe.png", product_name: "Red Shoe" }]),
};
const activeChat = { id: 7, channel_members: [{ user_id: ME, user: { name: "Me" } }] };

async function mount(extra: Record<string, any> = {}, chat: any = activeChat, store: Record<string, any> = {}, path = "/") {
  const p = {
    setOpen: vi.fn(),
    setDelete: vi.fn(),
    openMenu: false,
    type: "lonely",
    is_forward: 0,
    message_content: CONTENT,
    isPrivate: null,
    message_status: [],
    created_at: "2030-01-15T08:05:00",
    mid: null,
    id: 5,
    DeleteModal: false,
    channel_id: 7,
    channel_member: { name: "Me" },
    is_from_sender: true,
    setImg: vi.fn(),
    sender_user_id: ME,
    ...extra,
  };
  const spies = { setForwardMessage: vi.fn(), setReplyMessage: vi.fn() };
  await renderWithProviders(<ProductMessage {...(p as any)} />, {
    path,
    store: { userChat: { id: ME }, activeChat: chat, ...spies, ...store },
  });
  return { p, spies, menu: h.menus.at(-1) };
}

beforeEach(() => {
  h.menus = [];
  h.deleteMessage = vi.fn();
  h.copyText = vi.fn();
});

describe("ProductMessage", () => {
  it("shows the product name, picture and a link to its page", async () => {
    const { p } = await mount({ is_forward: 1 });
    expect(screen.getByText("Red Shoe"), "the product name was not shown").toBeInTheDocument();
    expect(screen.getByText("View Product").closest("a")?.getAttribute("href"), "the product link was wrong").toBe("/gb-en/products/red-shoe");
    expect(document.querySelector(".forwarded-message-icon"), "the forward mark was not shown").not.toBeNull();
    fireEvent.click(screen.getByAltText("user"));
    expect(p.setImg.mock.calls[0][0], "the product picture did not open in the viewer").toContain("shoe.png");
    expect(document.querySelector(".absolute-avatar")!.className, "a member with a name and no photo got no text avatar").toContain("text-avatar");
  });

  it("shows the receive time on someone else's product and no avatar mid-run", async () => {
    await mount({ is_from_sender: false, type: "middle-chat" }, null);
    expect(document.querySelector(".other-date")?.textContent, "the time was not shown").toBe("08:05");
    expect(screen.queryByTestId("avatar"), "a middle bubble showed an avatar").toBeNull();
  });

  it("the menu replies, forwards, copies the link and deletes", async () => {
    const { p, spies, menu } = await mount();
    fireEvent.click(document.querySelector(".product-share-message")!);
    expect(p.setOpen, "a tap did not try to open the menu").toHaveBeenCalled();
    fireEvent.mouseLeave(document.querySelector(".message-hold")!);
    expect(p.setOpen, "leaving did not close the menu").toHaveBeenLastCalledWith(false);
    menu.click();
    expect(spies.setReplyMessage.mock.calls[0][0].message_type, "the reply was not a product").toEqual({ name: "ShareProduct" });
    menu.forward();
    expect(spies.setForwardMessage.mock.calls[0][0].id, "the forward was not this product").toBe(5);
    menu.copy();
    expect(h.copyText.mock.calls[0][0].message_content.content, "the copied link was wrong").toMatch(/\/gb-en\/products\/red-shoe$/);
    menu.deleteMessage(false);
    expect(h.deleteMessage, "the product was not deleted").toHaveBeenCalledWith(7, 5, false);
    menu.setDelete(true);
    expect(p.setDelete, "the delete box was not opened").toHaveBeenCalledWith(true);
  });

  // On a phone the chat covers the whole screen, and it lives in the layout, so
  // it stays open after the link changes the page. The shopper sees nothing
  // happen. The link must close the chat on a phone.
  it("on a phone, 'View Product' closes the chat so the product page shows", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      media: query,
      matches: query === "(max-width: 480px)",
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      addListener: () => {},
      removeListener: () => {},
    }));
    try {
      await mount({}, activeChat, { chatVar: true });
      fireEvent.click(screen.getByText("View Product"));
      expect(useAppStore.getState().chatVar, "the chat stayed open over the product page on a phone").toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("on a desktop, 'View Product' leaves the chat panel open", async () => {
    await mount({}, activeChat, { chatVar: true });
    fireEvent.click(screen.getByText("View Product"));
    expect(useAppStore.getState().chatVar, "the side chat panel closed on a desktop").toBe(true);
  });

  // The shopper is already on this product's page, so there is nowhere to go.
  // The link must close the chat so the page behind it shows — on any screen.
  it("on the product's own page, 'View Product' closes the chat on a desktop", async () => {
    await mount({}, activeChat, { chatVar: true }, "/products/red-shoe");
    fireEvent.click(screen.getByText("View Product"));
    expect(useAppStore.getState().chatVar, "the chat stayed open over the product page the shopper is already on").toBe(false);
  });

  it("BUG-chat-11: tapping a shared product opens its menu", async () => {
    await renderWithProviders(
      <ChatMessage
        isPrivate={null}
        setVid={vi.fn()}
        setImg={vi.fn()}
        GetMessage={vi.fn()}
        type="lonely"
        message_content={CONTENT as any}
        message_files={[]}
        message_type={{ name: "ShareProduct", event_name: "", created_at: null }}
        message_status={[]}
        mid={null as any}
        id={5}
        created_at="2030-01-15T08:05:00"
        auth_message_status={{ is_deleted: 0 } as any}
        is_forward={0}
        sender_user_id={ME}
        parent_message={null as any}
        parent_message_id={null as any}
        duration_in_seconds={null}
      />,
      { store: { userChat: { id: ME }, activeChat } },
    );
    fireEvent.click(document.querySelector(".product-share-message")!);
    expect(document.querySelector(".message-hold")!.className, "a tap on a shared product did not open its menu").toContain("ac");
  });
});
