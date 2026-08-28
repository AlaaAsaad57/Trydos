import { describe, expect, it, vi, beforeEach } from "vitest";
import { GetTicket } from "utils/UploadUtils";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

import { fetchData } from "utils/fetchData";

describe("UploadUtils GetTicket function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls /api/ticket with folder, story, and count payload and returns ticket string", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      ticket: "test-ticket-token-123",
    });

    const ticket = await GetTicket("products", false, 1);
    expect(fetchData, "should post to /api/ticket with ticket request params").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/ticket",
        method: "POST",
        body: JSON.stringify({ folder: "products", story: false, count: 1 }),
        server: "local",
      }),
    );

    expect(ticket, "should return the ticket string from response").toBe("test-ticket-token-123");
  });

  it("throws error when API returns success: false", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      message: "Ticket request denied",
    });

    await expect(
      GetTicket("stories", true, 2),
      "should throw error when ticket creation fails",
    ).rejects.toThrow("Ticket request denied");
  });
});
