// The chat list window (components/Chat/pages/ChatWindow.tsx): its tabs, the
// contacts view, the forward banner, and the "last seen" heartbeat.
//
// Every pane is a stand-in (several are .js files with JSX the test build
// cannot parse), and `setLastSeen` is a spy.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ got: {} as Record<string, any>, setLastSeen: null as any }));

function stub(name: string) {
  return {
    default: (p: any) => {
      h.got[name] = p;
      return <div data-testid={name} />;
    },
  };
}

vi.mock("components/Chat/components/ChatWindowHeader", () => stub("Header"));
vi.mock("components/Chat/components/ChatWindowTabs", () => stub("Tabs"));
vi.mock("components/Chat/pages/ChatLists", () => stub("ChatLists"));
vi.mock("components/Chat/pages/CallList", () => stub("CallList"));
vi.mock("components/Chat/pages/StoriesList", () => stub("StoriesList"));
vi.mock("components/Chat/pages/ContactLists", () => stub("ContactLists"));
vi.mock("store/chat/actions", () => ({ setLastSeen: (...a: any[]) => h.setLastSeen(...a) }));

import ChatWindow from "components/Chat/pages/ChatWindow";

async function mount(props: Record<string, any> = {}, store: Record<string, any> = {}) {
  const p = { close: vi.fn(), setOpenContacts: vi.fn(), open: false, setSearch: vi.fn(), search: "", ...props };
  const spies = { setMain: vi.fn(), setForwardMessage: vi.fn() };
  const r = await renderWithProviders(<ChatWindow {...p} />, {
    store: { userChat: { id: 3 }, forwarded_message: null, ...spies, ...store },
  });
  return { ...r, p, spies };
}

beforeEach(() => {
  h.got = {};
  h.setLastSeen = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatWindow", () => {
  it("marks me online at once and every five minutes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await mount();
    expect(h.setLastSeen, "I was not marked online on open").toHaveBeenCalledWith("3");
    await act(async () => {
      vi.advanceTimersByTime(300000);
    });
    expect(h.setLastSeen, "I was not marked online again after five minutes").toHaveBeenCalledTimes(2);
  });

  it("shows the chats tab and switches to calls and stories", async () => {
    await mount();
    expect(screen.getByTestId("ChatLists"), "the chats tab was not shown first").toBeInTheDocument();
    act(() => h.got.Tabs.setSelectedTab("Calls"));
    expect(screen.getByTestId("CallList"), "the calls tab did not open").toBeInTheDocument();
    act(() => h.got.Tabs.setSelectedTab("Stories"));
    expect(screen.getByTestId("StoriesList"), "the stories tab did not open").toBeInTheDocument();
    h.got.Header.setSearch("abc");
  });

  it("the close button closes the window and clears a forward", async () => {
    const { p, spies } = await mount();
    fireEvent.click(screen.getByLabelText("close icon"));
    expect(p.close, "the window did not close").toHaveBeenCalled();
    expect(spies.setForwardMessage, "the forward was not cleared").toHaveBeenCalledWith(null);
    expect(spies.setMain, "the view was not reset").toHaveBeenCalledWith("main");
  });

  it("opens and closes the contacts list", async () => {
    const a = await mount();
    fireEvent.click(document.querySelector('[data-pw="ContactsIcon"]')!);
    expect(a.p.setOpenContacts, "the contacts icon did not open the contacts").toHaveBeenCalledWith(true);
    a.unmount();
    const b = await mount({ open: true });
    expect(screen.getByText("Contacts List"), "the contacts title was not shown").toBeInTheDocument();
    expect(screen.queryByTestId("ChatLists"), "the chat list stayed under the contacts").toBeNull();
    fireEvent.click(document.querySelector(".forward-cancel-icon")!);
    act(() => h.got.ContactLists.close());
    expect(b.p.setOpenContacts, "the contacts did not close").toHaveBeenCalledWith(false);
  });

  it("shows the forward banner and cancels a forward", async () => {
    const { spies } = await mount({}, { forwarded_message: { id: 1 } });
    expect(screen.getByText("Forward Message"), "the forward banner was not shown").toBeInTheDocument();
    fireEvent.click(document.querySelector(".forward-cancel-icon")!);
    expect(spies.setForwardMessage, "the forward was not cancelled").toHaveBeenCalledWith(null);
    expect(spies.setMain, "cancelling did not go back to the chat").toHaveBeenCalledWith("chat");
  });
});
