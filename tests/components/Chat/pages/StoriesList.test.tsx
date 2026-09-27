// The stories tab of the chat window (components/Chat/pages/StoriesList.tsx):
// first page, more pages on scroll, and the end of the list.
//
// The stories backend call (`fetchData`), the row (a .js file with JSX the test
// build cannot parse) and the in-view trigger are stand-ins.
import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  fetch: null as any,
  select: null as any,
  logError: null as any,
  rows: [] as any[],
  inView: null as any,
}));

vi.mock("utils/fetchData", () => ({ fetchData: (...a: any[]) => h.fetch(...a) }));
vi.mock("store/homepage/actions", () => ({
  GetUnviewedStory: () => 0,
  SelectStory: (...a: any[]) => h.select(...a),
}));
vi.mock("services/story", () => ({ default: { configureStory: (s: any) => ({ configured: s.id }) } }));
vi.mock("components/Chat/components/StoryChatRow", () => ({
  default: (p: any) => {
    h.rows.push(p);
    return <div data-testid="story-row">{p.story.id}</div>;
  },
}));
vi.mock("react-intersection-observer", () => ({
  InView: (p: any) => {
    h.inView = p.onChange;
    return <div data-testid="in-view">{p.children}</div>;
  },
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));

import StoriesList from "components/Chat/pages/StoriesList";

const story = (id: number) => ({ id, stories: [{ id: id * 10 }] });
/** One page of the feed, as `fetchData` hands it over from /api/proxy. */
const page = (data: any[], next_page_url: string | null) => ({ success: true, data: { data, next_page_url } });

async function mount(store: any = {}) {
  return renderWithProviders(<StoriesList />, { store: { storiesData: [], ...store } });
}

beforeEach(() => {
  h.fetch = vi.fn(async () => page([story(1)], "p2"));
  h.select = vi.fn();
  h.logError = vi.fn();
  h.rows = [];
  h.inView = null;
});

describe("StoriesList", () => {
  it("shows placeholders, then the first page", async () => {
    let finish: any;
    h.fetch = vi.fn(() => new Promise((r) => (finish = r)));
    const { store } = await mount();
    expect(document.querySelectorAll(".chat-conversation-item").length, "no loading rows were shown").toBeGreaterThan(0);
    await act(async () => finish(page([story(1)], "p2")));
    const call = h.fetch.mock.calls[0][0];
    expect(call.url, "the first page was not asked for").toBe("/api/v1/stories/users_stories?page=1");
    // The same path as the stories bar on the home page: /api/proxy attaches the
    // HttpOnly stories token and renews it on a 401. The old server action had
    // no renewal, so after the 60-second token expired the seen marks were lost.
    expect(call.server, "the chat did not read the stories through the stories service of /api/proxy").toBe("stories");
    expect(JSON.stringify(call).toLowerCase(), "the chat carried a stories token in its own request").not.toContain("token");
    expect(store.getState().storiesData.map((s: any) => s.id), "the first page was not stored").toEqual([1]);
    expect(screen.getByTestId("story-row").textContent, "the story row was not shown").toBe("1");
  });

  it("loads the next page when the end scrolls into view, and says when there are no more", async () => {
    const { store } = await mount();
    await waitFor(() => expect(h.inView, "no scroll trigger was shown").not.toBeNull());
    h.fetch = vi.fn(async () => page([story(2)], null));
    await act(async () => {
      h.inView(false);
    });
    expect(h.fetch, "the next page loaded before the end was visible").not.toHaveBeenCalled();
    await act(async () => {
      h.inView(true);
    });
    expect(h.fetch.mock.calls[0][0].url, "the second page was not asked for").toBe("/api/v1/stories/users_stories?page=2");
    expect(store.getState().storiesData.map((s: any) => s.id), "the second page was not added after the first").toEqual([1, 2]);
    expect(screen.getByText("No More Stories"), "the end of the list was not shown").toBeInTheDocument();
  });

  it("opens a story when its row is chosen", async () => {
    await mount();
    await waitFor(() => expect(h.rows.length, "no row was shown").toBeGreaterThan(0));
    h.rows.at(-1).select();
    expect(h.select, "the story did not open").toHaveBeenCalledWith({ configured: 1 });
  });

  it("stops paging and logs when a page fails, and ignores an empty answer", async () => {
    h.fetch = vi.fn(async () => {
      throw new Error("stories refused");
    });
    await mount();
    await waitFor(() => expect(h.logError, "a failed page was not logged").toHaveBeenCalled());
    expect(h.logError.mock.calls[0][0].scenario, "the failure was logged under the wrong name").toBe("getStoriesData in StoriesList - chat widget");
    expect(screen.queryByTestId("in-view"), "paging went on after a failure").toBeNull();
  });

  it("shows the shopper's own row with their newest story, as the stories bar does", async () => {
    h.fetch = vi.fn(async () =>
      page([{ id: 7, stories: [{ id: 70 }, { id: 71 }, { id: 72 }] }, { id: 8, stories: [{ id: 80 }, { id: 81 }] }], null),
    );
    await mount({ userStories: { id: 7 } });
    await waitFor(() => expect(h.rows.length, "no row was shown").toBeGreaterThan(0));
    const shown = (id: number) => h.rows.filter((r) => r.story.id === id).at(-1)?.viewedStory?.id;
    expect(shown(7), "the shopper's own row did not show their newest story (72)").toBe(72);
    expect(shown(8), "another author's row did not show the first story not seen yet").toBe(80);
  });

  it("stops paging and logs when the stories backend refuses a page", async () => {
    h.fetch = vi.fn(async () => ({ success: false, message: "Token is missing" }));
    await mount();
    await waitFor(() => expect(h.logError, "a refused page was not logged").toHaveBeenCalled());
    expect(h.logError.mock.calls[0][0].error?.message, "the log did not carry what the stories backend said").toBe("Token is missing");
    expect(screen.queryByTestId("in-view"), "paging went on after a refusal").toBeNull();
  });

  it("keeps waiting when the stories backend answers with no data", async () => {
    h.fetch = vi.fn(async () => ({ success: true, data: {} }));
    await mount();
    await waitFor(() => expect(h.fetch, "the first page was not asked for").toHaveBeenCalled());
    expect(screen.queryByTestId("story-row"), "rows were shown with no data").toBeNull();
  });

  it("swaps the scroll trigger for a spinner while a page loads", async () => {
    let finish: any;
    await mount();
    await waitFor(() => expect(h.inView).not.toBeNull());
    h.fetch = vi.fn(() => new Promise((r) => (finish = r)));
    await act(async () => {
      h.inView(true);
    });
    expect(screen.queryByTestId("in-view"), "the scroll trigger stayed while a page was loading").toBeNull();
    await act(async () => finish(page([story(3)], null)));
    expect(screen.queryByTestId("in-view"), "the scroll trigger came back after the last page").toBeNull();
    expect(h.fetch, "more than one page was asked for").toHaveBeenCalledTimes(1);
  });
});
