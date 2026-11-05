"use client";

import { useRef, useState } from "react";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";

/** How many cards the server's first page holds. A shorter page is the last one. */
const FIRST_PAGE = 5;

/** What a row needs to ask for its next page. */
export type RowMore = {
  loading: boolean;
  /** The last read failed. The row waits for a tap, and does not ask by itself. */
  failed: boolean;
  /** No page is left. */
  done: boolean;
  load: () => void;
};

/**
 * The next pages of a row of review or question cards (the old lists' rule):
 * the row ends on a page with no cards, or with no offset to go on from. A
 * failed read is not the end: the cards stay, the shopper is told, and a tap
 * on the row's end asks again.
 */
export function useCardPages<Card extends { id: string }>({
  first,
  offset,
  read,
  toCard,
  scenario,
}: {
  first: readonly Card[];
  /** Where the server's first page ended. */
  offset: unknown;
  read: (offset: unknown) => Promise<{ comments: any[]; offset: unknown }>;
  toCard: (comment: any) => Card;
  scenario: string;
}): { cards: Card[]; more: RowMore } {
  const [added, setAdded] = useState<Card[]>([]);
  const [done, setDone] = useState(first.length < FIRST_PAGE || !offset);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // Refs, not only state: Embla asks for more when it builds the row again,
  // which can come before React has given it the new `load`. An old `load`
  // must still see the newest offset, or it reads a page a second time.
  const paging = useRef({ busy: false, next: offset, done });

  const load = async () => {
    const now = paging.current;
    if (now.busy || now.done) return;
    now.busy = true;
    setLoading(true);
    setFailed(false);
    try {
      const page = await read(now.next);
      now.next = page.offset;
      if (page.comments.length === 0 || !page.offset) {
        now.done = true;
        setDone(true);
      }
      setAdded((cards) => [...cards, ...page.comments.map(toCard)]);
    } catch (error) {
      LogError({ error, scenario });
      setFailed(true);
      showErrorNotification(translateFunction("Something went wrong"));
    } finally {
      now.busy = false;
      setLoading(false);
    }
  };

  // A new review can push an old one onto the next page: show each card once.
  const seen = new Set(first.map((card) => card.id));
  const cards = [
    ...first,
    ...added.filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    }),
  ];
  return { cards, more: { loading, failed, done, load } };
}
