import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
}));

const GetHomeBoutiques = vi.fn();
vi.mock("serverRequests/home", () => ({
  GetHomeBoutiques: (...args: any[]) => GetHomeBoutiques(...args),
}));

const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...args: any[]) => LogError(...args),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/sy-en" }));

import { useAppStore } from "store";
import {
  HOME_STORIES_PATH,
  toHomeStory,
  useHomeGrid,
  useHomeStories,
} from "components/DemoApp1/useHomeData";
import type { HomeStore } from "components/DemoApp1/homeData";

const MEDIA = "https://media.test";

// One person of the stories backend's users_stories answer.
const person = (id: number, stories: any[], extra: Record<string, unknown> = {}) => ({
  id,
  name: `Person ${id}`,
  photo_path: `/people/${id}.jpg`,
  stories,
  ...extra,
});
const photo = (n: number, seen: boolean) => ({
  id: n,
  photo_path: `${MEDIA}/upload/story-${n}.jpg`,
  is_seen: seen,
});
const video = (n: number, seen: boolean) => ({
  id: n,
  full_video_path: `${MEDIA}/video-${n}.mp4`,
  is_seen: seen,
});

const resetStore = () =>
  useAppStore.setState({
    storiesData: [],
    userStories: null,
    userProfile: null,
    user: null,
    selectedStory: null,
    storiesRefreshing: false,
  } as any);

describe("toHomeStory (one person of the stories backend as a card)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_MEDIA_URL = MEDIA;
  });

  it("keeps the person's id as text", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)]), null)?.id,
      "the card lost the person's id from the stories backend",
    ).toBe("7");
  });

  it("shows the person's name", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)]), null)?.name,
      "the card does not show the name the stories backend sent",
    ).toBe("Person 7");
  });

  it("shows the first story not seen yet on another person's card", () => {
    expect(
      toHomeStory(person(7, [photo(1, true), photo(2, false)]), null)?.cover,
      "another person's card must show the first unseen story (story 2), as the live bar does",
    ).toContain("story-2");
  });

  it("shows the newest story on the shopper's own card", () => {
    expect(
      toHomeStory(person(7, [photo(1, false), photo(2, false)]), 7)?.cover,
      "the shopper's own card must show their newest story (story 2), as the live bar does",
    ).toContain("story-2");
  });

  it("shows a video's still frame for a video story", () => {
    expect(
      toHomeStory(person(7, [video(3, false)]), null)?.cover,
      "a video story's card must show the media host's still frame (?target=snapshot)",
    ).toBe(`${MEDIA}/video-3.mp4?target=snapshot`);
  });

  it("marks the shopper's own card", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)]), "7")?.mine,
      "the card of the shopper's own stories id must be marked as theirs",
    ).toBe(true);
  });

  it("does not mark another person's card", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)]), 8)?.mine,
      "a card of another person must not be marked as the shopper's",
    ).toBe(false);
  });

  it("is seen when every story of the person is seen", () => {
    expect(
      toHomeStory(person(7, [photo(1, true), photo(2, true)]), null)?.seen,
      "a person whose stories are all seen must give a seen card",
    ).toBe(true);
  });

  it("is not seen when one story is not seen", () => {
    expect(
      toHomeStory(person(7, [photo(1, true), photo(2, false)]), null)?.seen,
      "a person with an unseen story must give an unseen card",
    ).toBe(false);
  });

  it("gives the person's photo for the ring", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)]), null)?.avatar,
      "the ring must show the person's photo from the media host",
    ).toContain("/people/7.jpg");
  });

  it("gives no photo for a person with none", () => {
    expect(
      toHomeStory(person(7, [photo(1, false)], { photo_path: null }), null)
        ?.avatar,
      "a person with no photo must give avatar null (the ring shows the default picture)",
    ).toBeNull();
  });

  it("gives no card for a person with no stories", () => {
    expect(
      toHomeStory(person(7, []), null),
      "a person with no stories must give no card",
    ).toBeNull();
  });
});

describe("useHomeStories (the stories row)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_MEDIA_URL = MEDIA;
    fetchData.mockReset();
    resetStore();
  });

  it("reads page 1 from the stories backend through the proxy preload", async () => {
    fetchData.mockResolvedValue({ data: { data: [] } });
    renderHook(() => useHomeStories({ language: "en", country: "sy" }));
    await waitFor(() =>
      expect(fetchData, "the stories backend was never asked").toHaveBeenCalled(),
    );
    const call = fetchData.mock.calls[0][0];
    expect(
      { url: call.url, server: call.server, viaProxyGet: call.viaProxyGet },
      "page 1 must go to the stories backend, by the preloaded proxy address",
    ).toEqual({ url: HOME_STORIES_PATH, server: "stories", viaProxyGet: true });
  });

  it("gives null while page 1 is on its way", () => {
    fetchData.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() =>
      useHomeStories({ language: "en", country: "sy" }),
    );
    expect(
      result.current.stories,
      "before the stories backend answers the row must get null (its skeleton)",
    ).toBeNull();
  });

  it("gives one card per person the stories backend sent", async () => {
    fetchData.mockResolvedValue({
      data: { data: [person(1, [photo(1, false)]), person(2, [photo(2, false)])] },
    });
    const { result } = renderHook(() =>
      useHomeStories({ language: "en", country: "sy" }),
    );
    await waitFor(() =>
      expect(
        result.current.stories?.map((s) => s.id),
        "the row must show persons 1 and 2 from the stories backend",
      ).toEqual(["1", "2"]),
    );
  });

  it("gives the next page's address from the stories backend", async () => {
    fetchData.mockResolvedValue({
      data: { data: [person(1, [photo(1, false)])], next_page_url: "page-2" },
    });
    const { result } = renderHook(() =>
      useHomeStories({ language: "en", country: "sy" }),
    );
    await waitFor(() =>
      expect(
        result.current.nextPageUrl,
        "the row must get the stories backend's next_page_url for its paging",
      ).toBe("page-2"),
    );
  });

  it("seeds the store's shared list for the story viewer", async () => {
    fetchData.mockResolvedValue({ data: { data: [person(1, [photo(1, false)])] } });
    renderHook(() => useHomeStories({ language: "en", country: "sy" }));
    await waitFor(() =>
      expect(
        useAppStore.getState().storiesData?.map((s: any) => s.id),
        "page 1 must reach store.storiesData, which the viewer and the next pages use",
      ).toEqual([1]),
    );
  });

  it("gives an empty row when the stories backend fails", async () => {
    fetchData.mockRejectedValue(new Error("stories backend down"));
    const { result } = renderHook(() =>
      useHomeStories({ language: "en", country: "sy" }),
    );
    await waitFor(() =>
      expect(
        result.current.stories,
        "a failed stories backend must give an empty row, not an endless skeleton",
      ).toEqual([]),
    );
  });

  it("opens the story viewer on the tapped person", async () => {
    fetchData.mockResolvedValue({ data: { data: [person(1, [photo(1, false)])] } });
    const { result } = renderHook(() =>
      useHomeStories({ language: "en", country: "sy" }),
    );
    await waitFor(() => expect(result.current.stories?.length).toBeGreaterThan(0));
    act(() => result.current.open("1"));
    expect(
      (useAppStore.getState() as any).selectedStory?.id,
      "a tap on person 1's card must open the viewer on person 1 (store.selectedStory)",
    ).toBe(1);
  });

  it("stops the add-story spinner when the row gets its list", async () => {
    useAppStore.setState({ storiesRefreshing: true } as any);
    fetchData.mockResolvedValue({ data: { data: [] } });
    renderHook(() => useHomeStories({ language: "en", country: "sy" }));
    await waitFor(() =>
      expect(
        useAppStore.getState().storiesRefreshing,
        "the add-story spinner must stop once the row has its list",
      ).toBe(false),
    );
  });
});

describe("useHomeGrid (the store grid's next pages, S7-7)", () => {
  const store = (slug: string): HomeStore => ({
    slug,
    name: slug,
    logo: null,
    href: `/sy-en/filters/boutiques/${slug}`,
  });

  beforeEach(() => {
    GetHomeBoutiques.mockReset();
    LogError.mockReset();
  });

  it("starts with the boutiques the server read", () => {
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [store("a")], initialOffset: [1, "a"] }),
    );
    expect(
      result.current.stores.map((s) => s.slug),
      "the grid must start with the server's boutiques",
    ).toEqual(["a"]);
  });

  it("asks the search engine for the next 12 after the server's offset", async () => {
    GetHomeBoutiques.mockResolvedValue({ data: { boutiques: [], offset: null } });
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-ar", category: "women", initial: [], initialOffset: [1, "a"] }),
    );
    await act(() => result.current.loadMore());
    expect(
      GetHomeBoutiques.mock.calls[0][0],
      "the next read must ask for 12 boutiques of this country, language and category, after the server's offset",
    ).toEqual({
      language: "ar",
      country: "sy",
      category: "women",
      limit: 12,
      offset: JSON.stringify([1, "a"]),
    });
  });

  it("adds the next boutiques after the ones it has", async () => {
    GetHomeBoutiques.mockResolvedValue({
      data: { boutiques: [{ slug: "b" }], offset: [2, "b"] },
    });
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [store("a")], initialOffset: [1, "a"] }),
    );
    await act(() => result.current.loadMore());
    expect(
      result.current.stores.map((s) => s.slug),
      "the search engine's next boutique (b) must come after the server's (a)",
    ).toEqual(["a", "b"]);
  });

  it("uses the new offset for the read after", async () => {
    GetHomeBoutiques.mockResolvedValueOnce({
      data: { boutiques: [{ slug: "b" }], offset: [2, "b"] },
    });
    GetHomeBoutiques.mockResolvedValueOnce({ data: { boutiques: [], offset: null } });
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [], initialOffset: [1, "a"] }),
    );
    await act(() => result.current.loadMore());
    await act(() => result.current.loadMore());
    expect(
      GetHomeBoutiques.mock.calls[1][0].offset,
      "the second read must start after the first read's offset",
    ).toBe(JSON.stringify([2, "b"]));
  });

  it("ends when the search engine sends no offset", async () => {
    GetHomeBoutiques.mockResolvedValue({ data: { boutiques: [{ slug: "b" }], offset: null } });
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [], initialOffset: [1, "a"] }),
    );
    await act(() => result.current.loadMore());
    expect(result.current.ended, "no offset from the search engine must end the grid").toBe(true);
  });

  it("is ended from the start when the server's read had no offset", () => {
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [], initialOffset: null }),
    );
    expect(result.current.ended, "with no first offset there is nothing more to read").toBe(true);
  });

  it("asks nothing once it has ended", async () => {
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [], initialOffset: null }),
    );
    await act(() => result.current.loadMore());
    expect(GetHomeBoutiques, "an ended grid must not ask the search engine again").not.toHaveBeenCalled();
  });

  it("ends and reports to Sentry when the read fails", async () => {
    GetHomeBoutiques.mockRejectedValue(new Error("search engine down"));
    const { result } = renderHook(() =>
      useHomeGrid({ lang: "sy-en", category: null, initial: [], initialOffset: [1, "a"] }),
    );
    await act(() => result.current.loadMore());
    expect(result.current.ended, "a failed read must end the grid, not retry forever").toBe(true);
    expect(LogError, "a failed read of the next boutiques must reach Sentry (LogError)").toHaveBeenCalled();
  });
});
