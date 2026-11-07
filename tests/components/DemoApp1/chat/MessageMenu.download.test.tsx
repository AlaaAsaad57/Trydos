import { describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import MessageMenu, { MENU_ROW_H, menuHeight } from "components/DemoApp1/chat/MessageMenu";

// A held photo or video can be saved: the old chat's viewer had a download
// button (90b9c36be). The new chat has no viewer, so the menu carries it.

const menu = (canDownload: boolean, onPick = vi.fn()) => {
  render(
    <MessageMenu
      side="in"
      canEdit={false}
      canDownload={canDownload}
      onPick={onPick}
      onReact={vi.fn()}
      onMore={vi.fn()}
      t={(k: string) => k}
    />,
  );
  return onPick;
};
const download = () => document.querySelector<HTMLElement>('[data-pw="demo-chat-menu-download"]');

describe("the message menu's Download row", () => {
  it("is there for a message that can be saved, and says so when tapped", () => {
    const onPick = menu(true);
    expect(download(), "the menu has no Download row").not.toBeNull();
    fireEvent.click(download()!);
    expect(onPick, "the Download row did nothing").toHaveBeenCalledWith("Download");
  });

  it("is not there for other messages", () => {
    menu(false);
    expect(download(), "a message that cannot be saved shows Download").toBeNull();
  });

  it("counts in the menu's height, so the screen makes room for it", () => {
    expect(menuHeight(false, true, false, true), "the height leaves out the Download row").toBe(
      menuHeight(false, true, false) + MENU_ROW_H,
    );
  });
});
