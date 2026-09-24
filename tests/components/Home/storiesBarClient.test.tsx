import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import StoriesBarClient from "components/Home/Stories/StoriesBarClient";
import { useAppStore } from "store";

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

  it("never shows a QA story on the bar", async () => {
    // The bar is on the home page, so this is the most visible of the four
    // story readers -- a QA story here is a test story on every shopper's
    // screen. A real author is returned beside the QA one, so an empty bar
    // cannot make this pass for the wrong reason.
    fetchData.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: "Rana",
            photo_path: null,
            stories: [
              {
                id: 11,
                is_seen: false,
                created_at: "2026-08-31T00:00:00Z",
                link: "https://trydos.com/product/real",
              },
            ],
          },
          {
            id: 2,
            name: "QA Tester",
            photo_path: null,
            stories: [
              {
                id: 12,
                is_seen: false,
                created_at: "2026-08-31T00:00:00Z",
                link: "https://qa-test.trydos.tech/qa-product",
              },
            ],
          },
        ],
      },
    });

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() =>
      expect(
        screen.queryByText("Rana"),
        "the real author never appeared, so the check below would pass against an empty bar",
      ).not.toBeNull(),
    );

    expect(
      screen.queryByText("QA Tester"),
      "an author whose only story links to the QA host still has a tile on the home page stories bar",
    ).toBeNull();
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
  it("shows the QA story when the viewer id arrives after the feed", async () => {
    // The timing this ticket exists to survive. `CheckLogin` fills the store
    // **after** boot, while this component fetches on mount with deps
    // [language, country]. A filter applied inside the `.then` would run with no
    // viewer id and drop the test account's own story, and no later render
    // would bring it back — there is no second request.
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", "999000000001");

    const qaGroup = {
      id: 41,
      name: "QA Tester",
      photo_path: null,
      stories: [
        {
          id: 99,
          link: "https://qa-test.trydos.tech/e2e/tok/photo",
          is_seen: false,
          created_at: "2026-09-20T00:00:00Z",
        },
      ],
    };
    fetchData.mockResolvedValue({ data: { data: [qaGroup] } });

    // Signed out at first render, exactly as the real boot order is.
    useAppStore.setState({ userStories: null, userProfile: null, user: null } as any);
    render(<StoriesBarClient language="en" country="sy" />);
    await waitFor(() => expect(fetchData).toHaveBeenCalled());

    expect(
      screen.queryByText("QA Tester"),
      "the QA story was on screen before the viewer was known to be a test account",
    ).toBeNull();

    // The store fills, and nothing else happens: no second fetch.
    await act(async () => {
      useAppStore.setState({
        userStories: { id: 41 },
        userProfile: { phone: "999000000001" },
      } as any);
    });

    await waitFor(() =>
      expect(
        screen.queryByText("QA Tester"),
        "the viewer id arrived after the feed and the bar never re-filtered, so a test account is never shown the story its own run uploaded",
      ).not.toBeNull(),
    );

    expect(
      fetchData.mock.calls.length,
      "the bar fetched the feed a second time when the viewer id landed; the raw page it already holds is what the filter is meant to re-read",
    ).toBe(1);
  });
});
