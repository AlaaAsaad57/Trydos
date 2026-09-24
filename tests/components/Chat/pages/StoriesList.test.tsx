// The stories tab of the chat window (components/Chat/pages/StoriesList.tsx):
// first page, more pages on scroll, and the end of the list.
//
// The stories backend call (`fetchStoriesForUser`), the row (a .js file with
// JSX the test build cannot parse) and the in-view trigger are stand-ins.
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

vi.mock("serverRequests", () => ({ fetchStoriesForUser: (...a: any[]) => h.fetch(...a) }));
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
  getUserStories: () => ({ access_token: "stories-session" }),
}));

import StoriesList from "components/Chat/pages/StoriesList";

const story = (id: number) => ({ id, stories: [{ id: id * 10 }] });

async function mount() {
  return renderWithProviders(<StoriesList />, { store: { storiesData: [] } });
}

beforeEach(() => {
  h.fetch = vi.fn(async () => ({ data: [story(1)], next_page_url: "p2" }));
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
    await act(async () => finish({ data: [story(1)], next_page_url: "p2" }));
    expect(h.fetch.mock.calls[0].slice(2), "the first page was not asked for with the stories session").toEqual([1, "stories-session"]);
    expect(store.getState().storiesData.map((s: any) => s.id), "the first page was not stored").toEqual([1]);
    expect(screen.getByTestId("story-row").textContent, "the story row was not shown").toBe("1");
  });

  it("loads the next page when the end scrolls into view, and says when there are no more", async () => {
    const { store } = await mount();
    await waitFor(() => expect(h.inView, "no scroll trigger was shown").not.toBeNull());
    h.fetch = vi.fn(async () => ({ data: [story(2)], next_page_url: null }));
    await act(async () => {
      h.inView(false);
    });
    expect(h.fetch, "the next page loaded before the end was visible").not.toHaveBeenCalled();
    await act(async () => {
      h.inView(true);
    });
    expect(h.fetch.mock.calls[0][2], "the second page was not asked for").toBe(2);
    expect(store.getState().storiesData.map((s: any) => s.id), "the second page was not added after the first").toEqual([1, 2]);
    expect(screen.getByText("No more stories"), "the end of the list was not shown").toBeInTheDocument();
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

  it("keeps waiting when the stories backend answers with no data", async () => {
    h.fetch = vi.fn(async () => ({}));
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
    await act(async () => finish({ data: [story(3)], next_page_url: null }));
    expect(screen.queryByTestId("in-view"), "the scroll trigger came back after the last page").toBeNull();
    expect(h.fetch, "more than one page was asked for").toHaveBeenCalledTimes(1);
  });
});
