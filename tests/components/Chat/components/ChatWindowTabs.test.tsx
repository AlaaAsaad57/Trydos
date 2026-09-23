// The Chats / Calls / Stories tabs (components/Chat/components/ChatWindowTabs.tsx
// and the icon it draws, components/Chat/components/ChatTabIcon.tsx).
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import ChatWindowTabs from "components/Chat/components/ChatWindowTabs";

const ME = 1;

function unread(id: number) {
  return {
    id,
    sender_user_id: 2,
    message_type: { name: "TextMessage" },
    message_status: [{ user_id: ME, is_watched: false }],
    auth_message_status: { delete_for_all: false },
  };
}

async function mount(SelectedTab: string, store: Record<string, any> = {}) {
  const setSelectedTab = vi.fn();
  await renderWithProviders(<ChatWindowTabs SelectedTab={SelectedTab} setSelectedTab={setSelectedTab} />, {
    store: { userChat: { id: ME }, data: [], calls: [], ...store },
  });
  const tabs = Array.from(document.querySelectorAll(".chat-tab")) as HTMLElement[];
  const icon = (i: number) => tabs[i].querySelector("img")?.getAttribute("src");
  return { setSelectedTab, tabs, icon };
}

describe("ChatWindowTabs", () => {
  it("marks the selected tab and switches tabs", async () => {
    const { setSelectedTab, tabs, icon } = await mount("Calls");
    expect(icon(0), "an unselected chats tab did not show its plain icon").toBe("/icons/chat/ChatIcon.svg");
    expect(icon(1), "the selected calls tab was not active").toBe("/icons/chat/ActiveCallIcon.svg");
    expect(icon(2), "an unselected stories tab did not show its plain icon").toBe("/icons/chat/StoryIcon.svg");
    tabs.forEach((t) => fireEvent.click(t));
    expect(setSelectedTab.mock.calls.map((c) => c[0]), "the tabs did not switch").toEqual(["Chats", "Calls", "Stories"]);
    expect((tabs[0].firstElementChild as HTMLElement).style.marginLeft, "the first tab was not pushed from the left").toBe("40px");
    expect((tabs[2].firstElementChild as HTMLElement).style.marginRight, "the last tab was not pushed from the right").toBe("40px");
    expect((tabs[1].firstElementChild as HTMLElement).style.justifyContent, "the middle tab was not centred").toBe("center");
  });

  it("shows how many chats and calls are new", async () => {
    const { icon } = await mount("Stories", {
      data: [{ id: 1, messages: [unread(1)] }],
      calls: [unread(2), unread(3)],
    });
    expect(icon(0), "the chats tab did not show the new-chats icon").toBe("/icons/chat/HasNewChatIon.svg");
    expect(icon(1), "the calls tab did not show the new-calls icon").toBe("/icons/chat/HasNewCallIcon.svg");
    const counts = Array.from(document.querySelectorAll(".number-of-new-item span")).map((s) => s.textContent);
    expect(counts, "the new counts were wrong").toEqual(["1", "2"]);
    const badges = document.querySelectorAll(".number-of-new-item") as NodeListOf<HTMLElement>;
    expect(badges[1].style.left, "the calls badge was not placed for the middle tab").toBe("72px");
    expect(icon(2), "the selected stories tab was not active").toBe("/icons/chat/ActiveStoryIcon.svg");
  });
});
