"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "store";
import { GetUnviewedStory, SelectStory } from "store/homepage/actions";
import StoryServiceClass from "services/story";
import { GetHomeBoutiques } from "serverRequests/home";
import { fetchData } from "utils/fetchData";
import { LogError } from "utils/functions";
import { REQUESTS_DATA } from "utils/Requests";
import { dropQaStories } from "utils/qaStoryFilter";
import { getConfiguredImage, GetImageUrl } from "utils/server/helpers";
import { takeEarlyStories } from "utils/earlyStories";
import {
  HOME_NEXT_READ,
  HOME_STORIES_PATH,
  toHomeStores,
  type HomeStore,
} from "./homeData";

/**
 * The browser side of the new home's real data (Stage 7, A-16): the stories
 * row and the next pages of the store grid. The screen gets plain values and
 * calls nothing itself.
 */

/** The one backend call of the stories row (the stories backend, through /api/proxy). */

/** A person's stories, as one card of the stories row draws them. */
export type HomeStory = {
  /** The person's id in the stories backend. */
  id: string;
  name: string;
  /** The picture of the story the card shows (a video's still frame for a video). */
  cover: string;
  /** The person's photo for the ring, or null for the default picture. */
  avatar: string | null;
  /** True when every story of this person is seen. */
  seen: boolean;
  /** True for the shopper's own card. */
  mine: boolean;
};

/**
 * One person of the stories backend's `users_stories` answer as a card, with
 * the same picks as the live bar (`components/Home/Stories/StoryElement.tsx`):
 * the shopper's own card shows their newest story, any other card shows the
 * first story not seen yet. Returns null for a person with no stories.
 */
export function toHomeStory(
  story: any,
  viewerStoryId: string | number | null | undefined,
): HomeStory | null {
  const items: any[] = Array.isArray(story?.stories) ? story.stories : [];
  if (story?.id === undefined || story?.id === null || items.length === 0)
    return null;
  const mine =
    viewerStoryId !== undefined &&
    viewerStoryId !== null &&
    String(viewerStoryId) === String(story.id);
  const media = mine ? items[items.length - 1] : items[GetUnviewedStory(story)];
  const isVideo = Boolean(media?.full_video_path);
  return {
    id: String(story.id),
    name: StoryServiceClass.authorName(story),
    cover:
      StoryServiceClass.getThumb(
        media?.full_video_path || media?.photo_path,
        isVideo,
      ) ?? "",
    avatar:
      typeof story.photo_path === "string" && story.photo_path
        ? getConfiguredImage({
            src: GetImageUrl(story.photo_path),
            // The ring's photo is 28 px; twice that for a sharp picture.
            width: 56,
            height: 56,
          })
        : null,
    seen: !items.some((s) => s?.is_seen === false),
    mine,
  };
}

/**
 * The stories row: the same data flow as the live bar (`StoriesBarClient` +
 * `StoriesWrapper`), with cards instead of the old tiles.
 *
 *  - Page 1 is read from the browser, through /api/proxy, so no token and no
 *    cookie reaches the cached home document. `buildProxyGetUrl` of the same
 *    path is preloaded by the screen, and `viaProxyGet` answers from it.
 *  - The page is kept as the backend sent it and filtered here, because the
 *    viewer (who may see a QA story) is known only after the sign-in fills the
 *    store, which is after this read starts.
 *  - The filtered page seeds the store's shared list (`storiesData`), which the
 *    story viewer and the next pages (`StoriesPaginationWrapper`) use. It is
 *    seeded only when the page changes, never on every render, or the next
 *    pages, the seen rings and the deletes in it are lost.
 *  - `stories` is null while page 1 is on its way (the screen shows its
 *    skeleton), and an empty list when the stories backend fails: a dead
 *    stories backend must not stop a shopper browsing.
 */
export function useHomeStories({
  language,
  country,
}: {
  language: string;
  country: string;
}): {
  stories: HomeStory[] | null;
  nextPageUrl: string | undefined;
  open: (id: string) => void;
} {
  const [rawStories, setRawStories] = useState<any[] | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>();
  const viewerPhone = useAppStore(
    (s) => s.userProfile?.phone ?? s.user?.phone,
  );
  const viewerStoryId = useAppStore((s) => s.userStories?.id);
  const storiesData = useAppStore((s) => s.storiesData);
  const setStoryData = useAppStore((s) => s.setStoryData);
  const storiesRefreshing = useAppStore((s) => s.storiesRefreshing);
  const setStoriesRefreshing = useAppStore((s) => s.setStoriesRefreshing);
  const pathname = usePathname();

  // Kept with useMemo on purpose (React Compiler or not): the seeding below
  // keys on this list's identity, and a new list on every render would seed
  // the store again and throw away the pages loaded after the first.
  const firstPage = useMemo(
    () => (rawStories ? dropQaStories(rawStories, viewerPhone) : null),
    [rawStories, viewerPhone],
  );

  useEffect(() => {
    let cancelled = false;
    const read = () =>
      fetchData({
        url: HOME_STORIES_PATH,
        method: "GET",
        server: "stories",
        reqTitle: REQUESTS_DATA.GET_USER_STORIES,
        viaProxyGet: true,
        noMessage: true,
      });
    // A failed early read (a 401, say) goes the usual way, which can renew.
    const early = takeEarlyStories();
    (early ? early.then((body) => body ?? read()) : read())
      .then((response: any) => {
        if (cancelled) return;
        setRawStories(response?.data?.data ?? []);
        setNextPageUrl(response?.data?.next_page_url);
      })
      .catch(() => {
        if (!cancelled) setRawStories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [language, country]);

  useEffect(() => {
    if (firstPage) setStoryData(firstPage);
  }, [firstPage]);

  // The add-story card spins until the list or the page changes, the same
  // trigger the live bar uses (StoriesWrapper).
  useEffect(() => {
    if (storiesRefreshing) setStoriesRefreshing(false);
  }, [firstPage, pathname]);

  const list: any[] | null =
    storiesData?.length > 0 ? storiesData : firstPage;

  const open = (id: string) => {
    const shown: any[] =
      useAppStore.getState().storiesData?.length > 0
        ? useAppStore.getState().storiesData
        : (firstPage ?? []);
    const story = shown.find((s) => String(s?.id) === id);
    if (story) SelectStory(StoryServiceClass.configureStory(story));
  };

  return {
    stories: list
      ? list
          .map((s) => toHomeStory(s, viewerStoryId))
          .filter((s): s is HomeStory => s !== null)
      : null,
    nextPageUrl,
    open,
  };
}

/**
 * The store grid's next pages (S7-7). The grid starts with the boutiques the
 * server read after the first 9; when the shopper slides near its end, the
 * screen calls `loadMore`, which reads the next 12 with the same reader and
 * offset as the old home's infinite scroll (`components/global/InfinteScroll`).
 *
 * The read stops for good when the backend sends no offset or no boutique, or
 * when it fails (the error goes to Sentry). A second call while one is on its
 * way does nothing.
 */
export function useHomeGrid({
  lang,
  category,
  initial,
  initialOffset,
}: {
  lang: string;
  /** The category slug on `/categories/<slug>`, null on the home. */
  category: string | null;
  initial: HomeStore[];
  /** The offset of the server's first read (Elasticsearch `searchAfter`). */
  initialOffset: unknown;
}): {
  stores: HomeStore[];
  loadMore: () => Promise<void>;
  loading: boolean;
  ended: boolean;
} {
  const [more, setMore] = useState<HomeStore[]>([]);
  const [offset, setOffset] = useState<unknown>(initialOffset);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(!initialOffset);
  const [country, language] = lang.split("-");

  const loadMore = async () => {
    if (loading || ended) return;
    setLoading(true);
    try {
      const result: any = await GetHomeBoutiques({
        language,
        country,
        category,
        limit: HOME_NEXT_READ,
        offset: JSON.stringify(offset),
      });
      const next = toHomeStores(result?.data?.boutiques, lang);
      const nextOffset = result?.data?.offset;
      setMore((prev) => [...prev, ...next]);
      setOffset(nextOffset);
      if (next.length === 0 || !nextOffset) setEnded(true);
    } catch (error) {
      LogError({
        error,
        scenario: "get next boutiques for the home store grid",
        category,
      });
      setEnded(true);
    } finally {
      setLoading(false);
    }
  };

  return { stores: [...initial, ...more], loadMore, loading, ended };
}
