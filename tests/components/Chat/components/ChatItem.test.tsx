// One row of the chat list (components/Chat/components/ChatItem.tsx): what it
// shows, and the swipe that uncovers the options behind it.
//
// jsdom has no pointer events and no pointer capture, so the test builds the
// pointer events itself (with a chosen `timeStamp`, which the flick speed is
// measured from) and stubs the three capture methods.
import { act, fireEvent, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ options: [] as any[] }));

vi.mock("components/Chat/components/ChatOptions", () => ({
  default: (p: any) => {
    h.options.push(p);
    return <div data-testid="options" />;
  },
}));
vi.mock("components/Chat/components/LastMessageBody", () => ({
  default: (p: any) => <div data-testid="last-message">{p.message?.message_content?.content}</div>,
}));
vi.mock("components/Chat/components/TypingIndicator", () => ({
  default: (p: any) => <div data-testid="typing">{p.status}</div>,
}));

import ChatItem from "components/Chat/components/ChatItem";

beforeAll(() => {
  const captured = new Set<number>();
  Element.prototype.setPointerCapture = function (id: number) {
    captured.add(id);
  };
  Element.prototype.hasPointerCapture = function (id: number) {
    return captured.has(id);
  };
  Element.prototype.releasePointerCapture = function (id: number) {
    captured.delete(id);
  };
});

function props(extra: Record<string, any> = {}) {
  return {
    isActive: false,
    unread: false,
    handleClickChat: vi.fn(),
    SenderName: "Other Person",
    photo: null,
    lastMessage: { created_at: "2020-01-01T10:00:00", message_content: { content: "hi" } },
    id: 7,
    status: null,
    newMessage: 0,
    pinned: false,
    muted: false,
    chat_members: [{ id: 99, user_id: 1 }, { id: 98, user_id: 2 }],
    ...extra,
  };
}

async function mount(extra: Record<string, any> = {}, language: any = "en") {
  const p = props(extra);
  const setMain = vi.fn();
  const r = await renderWithProviders(<ChatItem {...(p as any)} />, {
    language,
    store: { setMain, userChat: { id: 1 } },
  });
  const row = document.querySelector('[data-pw="ChatItem"]') as HTMLElement;
  return { ...r, p, setMain, row };
}

/** Send one pointer event with the fields the row reads. */
function pointer(el: HTMLElement, type: string, x: number, t: number, extra: Record<string, any> = {}) {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: extra.y ?? 0, button: extra.button ?? 0 });
  Object.defineProperty(ev, "pointerId", { value: extra.id ?? 1 });
  Object.defineProperty(ev, "pointerType", { value: extra.pointerType ?? "touch" });
  Object.defineProperty(ev, "timeStamp", { value: t });
  act(() => {
    el.dispatchEvent(ev);
  });
}

/** Drag from x=0 to `to`, slowly unless `fast`, and lift. */
function swipe(row: HTMLElement, to: number, { fast = false, rest = false } = {}) {
  pointer(row, "pointerdown", 0, 1000);
  pointer(row, "pointermove", to / 2, fast ? 1010 : 2000);
  pointer(row, "pointermove", to, fast ? 1020 : 3000);
  pointer(row, "pointerup", to, rest ? 3200 : fast ? 1030 : 3010);
}

const translate = (row: HTMLElement) => row.style.transform;

describe("ChatItem — what the row shows", () => {
  it("shows the name, the last message, the date and the options", async () => {
    await mount();
    expect(screen.getByText("Other Person"), "the name was not shown").toBeInTheDocument();
    expect(screen.getByTestId("last-message").textContent, "the last message was not shown").toBe("hi");
    expect(document.querySelector(".date-clock")?.textContent, "the last message date was not shown").toBe("2020-01-01");
    expect(document.querySelector(".text-avatar")?.textContent, "the initials were not shown without a photo").toBe("OP");
    expect(h.options.at(-1)?.member_id, "the options were not given my membership id").toBe(99);
  });

  it("shows the photo, or the empty picture and a fallback name", async () => {
    await mount({ photo: "/p.png" });
    expect(screen.getByAltText("user"), "the photo was not shown").toBeInTheDocument();
    await mount({ photo: null, SenderName: "", lastMessage: null });
    expect(screen.getByAltText("Picture of the author"), "the empty picture was not shown").toBeInTheDocument();
    expect(screen.getByText("User-7"), "a chat with no name did not fall back to its id").toBeInTheDocument();
  });

  it("shows typing instead of the last message", async () => {
    await mount({ status: "Typing..." });
    expect(screen.getByTestId("typing").textContent, "typing was not shown").toBe("Typing...");
    expect(screen.queryByTestId("last-message"), "the last message was shown while typing").toBeNull();
  });

  it("shows the unread count, else the mute and pin marks", async () => {
    await mount({ newMessage: 3, muted: true });
    expect(document.querySelector(".new-mes")?.textContent, "the unread count was not shown").toBe("3");
    expect(screen.queryByAltText("muted"), "the mute mark showed over an unread count").toBeNull();
    await mount({ muted: true, pinned: true });
    expect(screen.getByAltText("muted"), "the mute mark was not shown").toBeInTheDocument();
    expect(screen.getByAltText("pinned"), "the pin mark was not shown").toBeInTheDocument();
  });

  it("flips the layout for a right-to-left language", async () => {
    const { row } = await mount({ newMessage: 2, active: true }, "ar");
    expect(row.className, "the row did not flip for Arabic").toContain("flex-row-reverse");
    await mount({ pinned: true }, "ku");
    expect((document.querySelectorAll(".chat-activated-options")[0] as HTMLElement).style.left, "the marks did not move left for Kurdish").toBe("30px");
  });

  it("hides the options when they are disabled, and ignores swipes", async () => {
    h.options = [];
    const { row } = await mount({ disabledOptions: true });
    expect(screen.queryByTestId("options"), "disabled options were shown").toBeNull();
    swipe(row, -200);
    expect(translate(row), "a row with options disabled slid").toBe("translateX(0px)");
  });
});

describe("ChatItem — tapping and swiping", () => {
  it("a tap opens the chat", async () => {
    const { row, p, setMain } = await mount();
    fireEvent.click(row);
    expect(p.handleClickChat, "the chat did not open").toHaveBeenCalled();
    expect(setMain, "the view did not switch to the chat").toHaveBeenCalledWith("chat");
  });

  it("a slow swipe left past the snap point opens the left panel, and a tap closes it", async () => {
    const { row, p } = await mount();
    swipe(row, -120);
    expect(translate(row), "the row did not snap open to the left").toBe("translateX(-250px)");
    fireEvent.click(row);
    expect(p.handleClickChat, "the swipe's own click opened the chat").not.toHaveBeenCalled();
    fireEvent.click(row);
    expect(translate(row), "a tap on an open row did not close it").toBe("translateX(0px)");
    expect(p.handleClickChat, "the tap that closed the row also opened the chat").not.toHaveBeenCalled();
  });

  it("a slow swipe right opens the right panel, a short one springs back", async () => {
    const { row } = await mount();
    swipe(row, 100);
    expect(translate(row), "the row did not snap open to the right").toBe("translateX(180px)");
    swipe(row, -10);
    swipe(row, -150, { rest: true });
    const { row: row2 } = await mount();
    swipe(row2, 20);
    expect(translate(row2), "a short swipe did not spring back").toBe("translateX(0px)");
  });

  it("a fast flick opens or closes whatever the distance", async () => {
    const { row } = await mount();
    swipe(row, -30, { fast: true });
    expect(translate(row), "a flick left did not open the left panel").toBe("translateX(-250px)");
    swipe(row, 30, { fast: true });
    expect(translate(row), "a flick right did not close a left-open row").toBe("translateX(0px)");
    swipe(row, 30, { fast: true });
    expect(translate(row), "a flick right did not open the right panel").toBe("translateX(180px)");
    swipe(row, -30, { fast: true });
    expect(translate(row), "a flick left did not close a right-open row").toBe("translateX(0px)");
  });

  it("pulls heavily past the open position", async () => {
    const { row } = await mount();
    pointer(row, "pointerdown", 0, 1000);
    pointer(row, "pointermove", 400, 2000);
    expect(translate(row), "dragging past the right panel was not slowed").toBe("translateX(235px)");
    pointer(row, "pointermove", -450, 3000);
    expect(translate(row), "dragging past the left panel was not slowed").toBe("translateX(-300px)");
    pointer(row, "pointercancel", -450, 3001, { id: 2 });
    pointer(row, "pointercancel", -450, 3001);
    expect(translate(row), "a cancelled drag did not go back to where it started").toBe("translateX(0px)");
  });

  it("leaves a vertical drag to the list scroll", async () => {
    const { row } = await mount();
    pointer(row, "pointerdown", 0, 1000);
    pointer(row, "pointermove", 2, 1010, { y: 3 });
    pointer(row, "pointermove", 2, 1020, { y: 40 });
    pointer(row, "pointermove", 60, 1030, { y: 40 });
    pointer(row, "pointerup", 60, 1040);
    expect(translate(row), "a vertical drag moved the row").toBe("translateX(0px)");
    pointer(row, "pointermove", 60, 1050, { id: 3 });
    pointer(row, "pointerup", 60, 1050, { id: 3 });
  });

  it("ignores a right-click, and closes another open row when one is touched", async () => {
    const first = await mount();
    const rowA = first.row;
    pointer(rowA, "pointerdown", 0, 1000, { pointerType: "mouse", button: 2 });
    pointer(rowA, "pointermove", -200, 2000, { pointerType: "mouse" });
    expect(translate(rowA), "a right-click drag moved the row").toBe("translateX(0px)");
    swipe(rowA, -120);
    expect(translate(rowA), "the first row did not open").toBe("translateX(-250px)");
    const { container } = await renderWithProviders(<ChatItem {...(props({ id: 8 }) as any)} />, { store: { setMain: vi.fn() } });
    const rowB = container.querySelector('[data-pw="ChatItem"]') as HTMLElement;
    pointer(rowB, "pointerdown", 0, 5000);
    expect(translate(rowA), "touching another row did not close the open one").toBe("translateX(0px)");
  });

  it("the options can close the row", async () => {
    const { row } = await mount();
    swipe(row, -120);
    act(() => h.options.at(-1).closeRow());
    expect(translate(row), "the options did not close the row").toBe("translateX(0px)");
  });
});
