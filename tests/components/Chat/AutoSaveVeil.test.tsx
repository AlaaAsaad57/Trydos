// The blur over a photo or video while the chat saves it by itself.
//
// It must show while the save runs, go away when the save ends, and never
// stop a tap from reaching the media under it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const downloadFile = vi.fn(async (_url: string) => {});
vi.mock("components/Chat/downloadFile", () => ({
  downloadFile: (url: string) => downloadFile(url),
}));

import { act, renderWithProviders } from "../../render";
import AutoSaveVeil from "components/Chat/components/messages/AutoSaveVeil";
import {
  autoSaveMissedMedia,
  resetAutoDownloadMemory,
  setAutoDownloadMode,
} from "components/Chat/autoDownload";

const URL = "https://m.example.com/veil.jpg";
const veil = () => document.querySelector('[data-pw="chat-media-saving"]');

function sent(days: number, filePath: string) {
  return {
    id: filePath,
    sender_user: { id: 9 },
    message_type: { name: "ImageMessage" },
    message_files: [{ file_path: filePath }],
    created_at: new Date(Date.parse("2026-10-01T10:00:00Z") + days * 86400000).toISOString(),
  };
}

beforeEach(() => {
  localStorage.clear();
  resetAutoDownloadMemory();
  downloadFile.mockClear();
  setAutoDownloadMode("always");
  // One earlier visit, so the next photo counts as "missed".
  autoSaveMissedMedia("ch1", [sent(0, "")], 7);
  resetAutoDownloadMemory();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AutoSaveVeil", () => {
  it("shows over the media while it saves, and goes away when the save ends", async () => {
    await renderWithProviders(<AutoSaveVeil filePath={URL} />);
    // Fake timers start after the render, which waits on real timers.
    vi.useFakeTimers();
    expect(veil(), "a blur showed although nothing was being saved").toBeNull();

    act(() => {
      autoSaveMissedMedia("ch1", [sent(2, URL)], 7);
    });
    expect(veil(), "the media was not blurred while it was being saved").not.toBeNull();
    expect(
      veil()?.className,
      "the blur takes taps, so the media under it could not be opened",
    ).toContain("pointer-events-none");

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(veil(), "the blur stayed after the save ended").toBeNull();
  });

  it("does not blur a different file", async () => {
    await renderWithProviders(<AutoSaveVeil filePath="https://m.example.com/other.jpg" />);
    act(() => {
      autoSaveMissedMedia("ch1", [sent(2, URL)], 7);
    });
    expect(veil(), "a file that is not being saved was blurred").toBeNull();
  });
});
