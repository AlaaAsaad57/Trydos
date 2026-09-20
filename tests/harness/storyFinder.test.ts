import { describe, expect, it, vi } from "vitest";

import {
  findStoriesByPrefix,
  findStoryByLink,
  PAGE_LIMIT,
  POLL_ATTEMPTS,
  waitForStoryByLink,
} from "../e2e/harness/storyFinder";

// AC-11 lives here, not in the browser suite.
//
// The browser case cannot prove "found past page one": nothing makes a run's own
// story land on page three of real staging, so on a good day it would pass
// without ever paging and on a bad day it would fail on somebody else's data.
// The paging itself is a pure decision — which page to ask for, and when to stop
// — so it is driven here with a feed whose shape the test chooses, and the
// browser case is left to prove the story is really there.

const QA = "https://qa-test.trydos.tech/e2e/run-abc/";
const PHOTO = `${QA}photo`;
const VIDEO = `${QA}video`;

/** A feed where page `n` holds one author with one story. */
const feedOf = (pages: Record<number, string[]>) => {
  const reads: number[] = [];

  const readPage = async (page: number) => {
    reads.push(page);
    const links = pages[page];
    if (!links) return [];
    return [
      {
        id: 500 + page,
        stories: links.map((link, index) => ({ id: page * 100 + index, link })),
      },
    ];
  };

  return { readPage, reads };
};

describe("finding this run's own story in a paged feed", () => {
  it("finds the marked story when it is on page three", async () => {
    const feed = feedOf({
      1: ["https://trydos.com/a"],
      2: ["https://trydos.com/b"],
      3: [PHOTO],
      4: ["https://trydos.com/d"],
    });

    const found = await findStoryByLink(feed.readPage, { link: PHOTO });

    expect(
      found?.page,
      "the story was on page three of the feed and the finder did not reach it, so any case that needs its own story fails on a busy environment while passing on a quiet one",
    ).toBe(3);
    expect(
      found?.storyId,
      "the finder reached the right page but brought back the wrong story id",
    ).toBe(300);
  });

  it("stops at the page limit instead of walking the whole feed", async () => {
    const pages: Record<number, string[]> = {};
    for (let page = 1; page <= 20; page += 1) pages[page] = ["https://trydos.com/x"];
    pages[9] = [PHOTO];

    const feed = feedOf(pages);
    const found = await findStoryByLink(feed.readPage, { link: PHOTO });

    expect(
      found,
      "the finder read past its page limit. Every page is a real request to the stories backend, and an unbounded walk spends a whole case budget on a story that is not there",
    ).toBeNull();
    expect(
      Math.max(...feed.reads),
      `the finder asked for a page beyond ${PAGE_LIMIT}`,
    ).toBe(PAGE_LIMIT);
  });

  it("stops early when the feed runs out", async () => {
    const feed = feedOf({ 1: ["https://trydos.com/a"] });

    await findStoryByLink(feed.readPage, { link: PHOTO });

    expect(
      feed.reads,
      "the finder kept asking for pages after an empty one came back; an empty page means the feed has ended",
    ).toEqual([1, 2]);
  });

  it("never matches a story that merely shares the QA host", async () => {
    // The whole reason the link carries a run token. Another run's story, and a
    // leftover from last night, both live on the same host.
    const feed = feedOf({
      1: [
        "https://qa-test.trydos.tech/e2e/run-zzz/photo",
        "https://qa-test.trydos.tech/e2e/run-abc/photo-extra",
      ],
    });

    const found = await findStoryByLink(feed.readPage, { link: PHOTO });

    expect(
      found,
      "a story from a different run was matched. Reporting cannot be undone, so a loose match here files a report against somebody else's story",
    ).toBeNull();
  });

  it("collects every story this run uploaded, and none of another run's", async () => {
    const feed = feedOf({
      1: [PHOTO, "https://qa-test.trydos.tech/e2e/run-zzz/photo"],
      2: [VIDEO, "https://trydos.com/real"],
    });

    const found = await findStoriesByPrefix(feed.readPage, { prefix: QA });

    expect(
      found.map((story) => story.link),
      "the clean-up either missed one of this run's stories or reached for another run's",
    ).toEqual([PHOTO, VIDEO]);
  });
});

describe("waiting for a story the run has just uploaded", () => {
  it("asks page one only, and stops as soon as the story appears", async () => {
    let attempt = 0;
    const reads: number[] = [];
    const readPage = async (page: number) => {
      reads.push(page);
      attempt += 1;
      if (attempt < 3) return [];
      return [{ id: 501, stories: [{ id: 900, link: PHOTO }] }];
    };

    const sleep = vi.fn(async () => {});
    const found = await waitForStoryByLink(readPage, { link: PHOTO, sleep });

    expect(
      found?.storyId,
      "the story appeared on the third read and the poll did not pick it up",
    ).toBe(900);
    expect(
      new Set(reads),
      "the poll walked the feed while waiting. A story that was just created is the newest thing there, so paging multiplies the requests for nothing",
    ).toEqual(new Set([1]));
    expect(
      sleep.mock.calls.length,
      "the poll kept waiting after it had already found the story",
    ).toBe(2);
  });

  it("gives up after the configured attempts rather than hanging", async () => {
    const readPage = async () => [];
    const sleep = vi.fn(async () => {});

    const found = await waitForStoryByLink(readPage, { link: PHOTO, sleep });

    expect(
      found,
      "the poll returned a story that was never in the feed",
    ).toBeNull();
    expect(
      sleep.mock.calls.length,
      `the poll waited a different number of times than the ${POLL_ATTEMPTS} attempts it declares, so the case budget cannot be reasoned about`,
    ).toBe(POLL_ATTEMPTS - 1);
  });
});
