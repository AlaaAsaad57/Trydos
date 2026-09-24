// The chat entry point (components/Chat/ChatModal.tsx): it loads the chat data
// and mounts the chat window when the chat is open.
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const h = vi.hoisted(() => ({
  chat: { getChats: vi.fn(), getContacts: vi.fn(), getCalls: vi.fn() },
  ga: vi.fn(),
  track: vi.fn(),
  controller: vi.fn(),
  windowProps: null as any,
}));

vi.mock("services/chat", () => ({ default: h.chat }));
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => h.ga(...a) }));
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog: (...a: any[]) => h.track(...a),
}));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ChatConroller: (...a: any[]) => h.controller(...a),
}));
vi.mock("components/Home/LandingPage", () => ({ default: () => <div data-testid="landing" /> }));
vi.mock("components/Chat/ChatWindowModal", () => ({
  default: (p: any) => {
    h.windowProps = p;
    return <button onClick={() => p.close()}>chat window</button>;
  },
}));

import ChatModal from "components/Chat/ChatModal";

beforeEach(() => {
  Object.values(h.chat).forEach((f) => f.mockClear());
  h.ga.mockClear();
  h.track.mockClear();
  h.controller.mockClear();
  h.windowProps = null;
});

describe("ChatModal", () => {
  it("loads chats, contacts and calls, tracks the open, and mounts the window", async () => {
    await renderWithProviders(<ChatModal />, { store: { chatVar: true, callInProgress: false } });
    expect(h.chat.getChats, "the chat list was not loaded").toHaveBeenCalledWith(false);
    expect(h.chat.getContacts, "the contacts were not loaded").toHaveBeenCalled();
    expect(h.chat.getCalls, "the call log was not loaded").toHaveBeenCalled();
    expect(h.track, "the chat open was not tracked").toHaveBeenCalledWith("chat_opened");
    expect(h.ga.mock.calls[0]?.[0]?.params?.screen_path, "the screen view was not sent with the page").toBe(window.location.pathname);
    const button = await screen.findByText("chat window");
    fireEvent.click(button);
    await waitFor(() => expect(h.controller, "closing did not close the chat").toHaveBeenCalledWith(false));
  });

  it("loads nothing and mounts nothing while the chat is closed", async () => {
    await renderWithProviders(<ChatModal />, { store: { chatVar: false } });
    expect(h.chat.getChats, "chats were loaded with the chat closed").not.toHaveBeenCalled();
    expect(h.track, "a closed chat was tracked as opened").not.toHaveBeenCalled();
    expect(screen.queryByText("chat window"), "the window mounted while closed").toBeNull();
  });
});
