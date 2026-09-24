// The "Calls" tab while it is still loading.
//
// CallList starts with `loading` true, so the skeleton is the first thing the
// tab ever renders. If the skeleton throws, nobody ever sees the call log —
// not a wrong label, no list at all.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";

// The list asks the chat backend for calls as soon as it mounts. This test is
// about the first paint, not the request, so the call is stubbed out.
vi.mock("services/chat", () => ({
  default: { getCalls: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("store/chat/actions", () => ({ DeleteMessageApi: vi.fn() }));

import CallList from "components/Chat/pages/CallList";

import { renderWithProviders } from "../../render";

describe("CallList — the Calls tab", () => {
  it("renders its loading skeleton without throwing", async () => {
    await expect(
      renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } }),
      "the Calls tab threw while painting its loading skeleton, so the call log never appears",
    ).resolves.toBeTruthy();

    expect(
      document.querySelectorAll(".call-conversation-item").length > 0,
      "the loading skeleton painted no placeholder rows",
    ).toBe(true);
  });
});
