import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StoriesBarClient from "components/Home/Stories/StoriesBarClient";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({ fetchData: (...args: any[]) => fetchData(...args) }));

const storyFrom = (name: string) => ({
  id: 1,
  name,
  photo_path: null,
  stories: [{ id: 11, is_seen: false, created_at: "2026-08-31T00:00:00Z" }],
});

describe("StoriesBarClient", () => {
  beforeEach(() => {
    fetchData.mockReset();
  });

  it("shows the stories the storefront returned", async () => {
    fetchData.mockResolvedValue({ data: { data: [storyFrom("Rana")] } });

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() =>
      expect(
        screen.queryByText("Rana"),
        "the stories backend returned a story but the bar never showed it",
      ).not.toBeNull(),
    );
  });

  it("shows the skeleton, not an error, when the stories backend refuses", async () => {
    fetchData.mockRejectedValue(new Error("Proxy request failed"));

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() =>
      expect(
        fetchData,
        "the stories bar never asked for any stories",
      ).toHaveBeenCalled(),
    );
    expect(
      document.querySelector('[data-pw="stories-skeleton"]'),
      "the stories backend refused and the bar rendered something other than its skeleton; a dead stories service must not stop a shopper browsing",
    ).not.toBeNull();
  });

  it("never carries a token of its own", async () => {
    fetchData.mockResolvedValue({ data: { data: [] } });

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    const params = fetchData.mock.calls[0][0];

    expect(
      JSON.stringify(params ?? {}).toLowerCase(),
      "the stories bar put an Authorization header or a token in its own request; the stories token is HttpOnly and must only ever be attached by /api/proxy on the server",
    ).not.toContain("authorization");
    expect(
      JSON.stringify(params ?? {}).toLowerCase(),
      "the stories bar carried a token in its own request; the stories token is HttpOnly and must only ever be attached by /api/proxy on the server",
    ).not.toContain("bearer");
  });

  it("names the stories service, so the proxy attaches the token on the server", async () => {
    fetchData.mockResolvedValue({ data: { data: [] } });

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());

    expect(
      fetchData.mock.calls[0][0]?.server,
      "the stories bar did not name the stories service, so /api/proxy cannot attach the HttpOnly stories token and every shopper is treated as a guest",
    ).toBe("stories");
    expect(
      fetchData.mock.calls[0][0]?.url,
      "the stories bar asked for the wrong path, so the bar stays empty for everybody",
    ).toContain("users_stories");
  });

  it("says nothing to the shopper when the stories service is down", async () => {
    fetchData.mockResolvedValue({ data: { data: [] } });

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() => expect(fetchData).toHaveBeenCalled());

    expect(
      fetchData.mock.calls[0][0]?.noMessage,
      "the stories bar left the shopper-facing error message on; a failed stories fetch would pop an error notification over a page that is otherwise fine",
    ).toBe(true);
  });
});
