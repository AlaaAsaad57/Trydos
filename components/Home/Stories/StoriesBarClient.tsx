"use client";

import { useEffect, useState } from "react";
import AddStory from "components/Home/AddStory";
import AddStoryWidget from "components/Home/Stories/AddStoryWidgetLazy";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import StoriesWrapper from "components/clientWrapper/StoriesWrapper";
import { fetchData } from "utils/fetchData";
import { buildProxyGetUrl } from "utils/proxyGetUrl";
import { REQUESTS_DATA } from "utils/Requests";
import { useAppStore } from "store";

/** The one backend call this bar makes. */
const STORIES_PATH = "/api/v1/stories/users_stories?page=1";

/**
 * The stories bar, fetched from the browser.
 *
 * It used to be a Server Component, and it read two cookies to do it —
 * STORIES_TOKEN to authenticate and USER_STORIES for the visitor's own tile.
 * The home document is becoming a shared cache entry, and a cookie read there
 * would put one shopper's session into markup served to everybody else.
 *
 * So the request moves to the browser and goes through /api/proxy, like every
 * other client-side call in the app. The proxy runs on the server, so it — and
 * only it — attaches the HttpOnly stories token (D-6). Nothing here ever sees a
 * token, and nothing here sets an Authorization header.
 *
 * The visitor's own tile comes from the store, which the auth flow already
 * keeps up to date (D-7).
 *
 * The trade this makes: the bar costs one round trip more than a server render
 * and paints later, and the rest of the page paints from cache. That is the
 * trade recorded in docs/homepage-cache-phase-2.md.
 */
export default function StoriesBarClient({
  language,
  country,
}: {
  language: string;
  country: string;
}) {
  const [stories, setStories] = useState<any[] | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>();
  const userData = useAppStore((state) => state.userStories);
  const isRtl = language === "ar" || language === "ku";

  useEffect(() => {
    let cancelled = false;

    fetchData({
      url: STORIES_PATH,
      method: "GET",
      server: "stories",
      reqTitle: REQUESTS_DATA.GET_USER_STORIES,
      // Address the proxy by query string, so the <link rel="preload"> below
      // starts this exact request during HTML parse and this call is answered
      // from it rather than opening a second one (D-5).
      viaProxyGet: true,
      // A dead stories service must not stop a shopper browsing, and must not
      // pop a message over a page that is otherwise fine.
      noMessage: true,
    })
      .then((response: any) => {
        if (cancelled) return;
        // Same filter the server helper applied: a person with no stories left
        // has no tile. Without it the bar shows empty circles.
        setStories(
          (response?.data?.data ?? []).filter(
            (person: any) => person?.stories?.length > 0,
          ),
        );
        setNextPageUrl(response?.data?.next_page_url);
      })
      .catch(() => {
        // Nothing to say and nothing to do. `stories` stays null, so the
        // skeleton stays on screen.
      });

    return () => {
      cancelled = true;
    };
  }, [language, country]);

  return (
    <>
      {/* Starts the stories request while the browser is still parsing, instead
          of after hydration (D-5). The effect above then reads the answer from
          this preload rather than opening a second request — which only holds
          while both build the address the same way, so both call
          buildProxyGetUrl(). `anonymous` is the credentials mode the fetch uses
          too; a mismatch there is enough to make the browser fetch twice. */}
      <link
        rel="preload"
        as="fetch"
        crossOrigin="anonymous"
        href={buildProxyGetUrl({
          server: "stories",
          url: STORIES_PATH,
          country,
          language,
        })}
      />
      <AddStoryWidget />
      <div className="stories-bar-container h-[183px] items-center flex w-full z-99999999 max-w-[1365px] justify-start">
        <div
          id="stories-bar"
          className={`stories-bar w-full h-[183px] items-center flex justify-start ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <AddStory />
          {stories ? (
            <StoriesWrapper
              stories={stories}
              userData={userData}
              next_page_url={nextPageUrl}
              isRtl={isRtl}
            />
          ) : (
            <StoriesSkeleton />
          )}
        </div>
      </div>
    </>
  );
}
