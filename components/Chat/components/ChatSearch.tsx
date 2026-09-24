import { useCallback, useEffect, useRef } from "react";
import { DebounceInput } from "react-debounce-input";
import Spinner from "components/global/Spinner";

import { getMessagesBetweenTwoMessages } from "store/chat/actions";

import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogError, translateFunction } from "utils/functions";

/**
 * Searching inside one conversation.
 *
 * WHAT THE CHAT BACKEND ANSWERS
 * `POST /api/v1/channels/channelSearch` answers `{ messages_ids, offset }`, and
 * `messages_ids` is **newest first**. Measured against staging on 2026-09-20,
 * channel 538, query "gggg":
 *
 *   { "messages_ids": [339277, 339276, 339275, 339274, 339262],
 *     "offset": "339262" }
 *
 * Message ids grow over time, so index 0 is the match closest to the bottom of
 * the conversation and the last index is the oldest one. Everything below reads
 * the list that way: the first jump lands on index 0, the up arrow walks
 * towards the end of the array (older), the down arrow back towards index 0.
 *
 * WHY THE JUMP IS SPLIT IN TWO
 * A match can sit outside the window of messages that is loaded. Asking for the
 * range and then scrolling in the same breath never worked: the store has the
 * new messages, but React has not painted the rows yet, so there is no element
 * to scroll to and the jump is silently dropped. So one effect makes sure the
 * match is loaded, and a second one jumps as soon as its row exists.
 */

/** How long the box waits after the last keystroke before it asks the backend. */
const TYPING_PAUSE_MS = 300;

/** The class a row wears while it is the match the reader is standing on. */
const HIT_CLASS = "chat-search-hit";

/**
 * The oldest message already loaded, by id.
 *
 * Message ids grow over time, so the smallest one is the oldest. The array
 * itself cannot be used for this: pagination puts older messages at the FRONT
 * of `activeChat.messages`, so neither end of it is reliably the oldest
 * message. Anchoring the range fetch anywhere newer than the true oldest leaves
 * a hole in the conversation between the anchor and the match.
 */
const oldestLoadedId = (messages: any[] | undefined): number | null => {
  let oldest: number | null = null;
  for (const message of messages ?? []) {
    const id = Number(message?.id);
    // A message that is still being sent has no backend id yet.
    if (!Number.isFinite(id)) continue;
    if (oldest === null || id < oldest) oldest = id;
  }
  return oldest;
};

const isLoaded = (messages: any[] | undefined, id: any) =>
  (messages ?? []).some((message) => String(message?.id) === String(id));

function ChatSearch({ close }) {
  const {
    searchChat,
    activeChat,
    setChatSearchLoading,
    setChatSearchValue,
    setChatSearchRequest,
    setChatSearchId,
  } = useAppStore();

  /**
   * Which query the reader is actually waiting for.
   *
   * Every request carries the number it was started with. When the answer comes
   * back and the number has moved on, the reader has typed more and this answer
   * belongs to text that is already gone — so it is dropped instead of being
   * written into the store. Without this, a slow answer to "gg" lands after the
   * fast answer to "gggg" and puts the reader on a match for deleted text.
   */
  const latestQueryRef = useRef(0);
  /** The request still in the air, so the next keystroke can cancel it. */
  const inFlightRef = useRef<AbortController | null>(null);
  /** The match already scrolled to, so an incoming message does not re-scroll. */
  const scrolledForRef = useRef<string | null>(null);

  const clearResults = useCallback(() => {
    setChatSearchRequest({ messages: [], offset: null });
  }, [setChatSearchRequest]);

  const runSearch = useCallback(
    async (value: string) => {
      // Whatever is still running was asked for text the reader has changed.
      inFlightRef.current?.abort();
      inFlightRef.current = null;

      const query = value.trim();
      const queryId = ++latestQueryRef.current;

      if (!query || !activeChat?.id) {
        // An empty box has no results and nothing to wait for. This is the path
        // that used to leave the spinner turning for good.
        clearResults();
        return;
      }

      const controller = new AbortController();
      inFlightRef.current = controller;
      setChatSearchLoading(true);

      try {
        const response: any = await fetchData({
          url: "/api/v1/channels/channelSearch",
          server: "chat",
          method: "POST",
          body: JSON.stringify({
            query,
            channel_id: parseInt(activeChat.id),
            limit: 100,
            // Every new query starts from the top of its own result list.
            offset: 0,
          }),
          reqTitle: REQUESTS_DATA.CHANNEL_SERACH,
          signal: controller.signal,
          // A cancelled search is not a failure the reader has to be told about.
          noMessage: true,
        });

        // Cancelled, or a newer keystroke won while this was in the air.
        if (controller.signal.aborted || queryId !== latestQueryRef.current) {
          return;
        }
        if (!response?.success) {
          throw new Error(response?.message);
        }

        setChatSearchRequest({
          messages: response.data?.messages_ids ?? [],
          offset: response.data?.offset,
        });
      } catch (err) {
        if (controller.signal.aborted || queryId !== latestQueryRef.current) {
          return;
        }
        LogError({
          error: err,
          scenario: "getMessagesForSearch in chat search - chat widget",
        });
        clearResults();
      } finally {
        if (inFlightRef.current === controller) inFlightRef.current = null;
      }
    },
    [
      activeChat?.id,
      clearResults,
      setChatSearchLoading,
      setChatSearchRequest,
    ],
  );

  /* ------------------------------------------------------------------ */
  /* Step 1: make sure the match is loaded                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const target = searchChat.activeMessage;
    if (!target || !activeChat?.id) return;
    if (isLoaded(activeChat?.messages, target)) return;

    const anchor = oldestLoadedId(activeChat?.messages);
    if (anchor === null) return;

    let alive = true;
    setChatSearchLoading(true);
    getMessagesBetweenTwoMessages({
      first: anchor,
      second: Number(target),
      channel_id: activeChat.id,
    })
      .catch((err) =>
        LogError({
          error: err,
          scenario:
            "get messages between two messages in chat search - chat widget",
        }),
      )
      .finally(() => {
        if (alive) setChatSearchLoading(false);
      });

    return () => {
      alive = false;
    };
    // Deliberately keyed on the match only: `activeChat.messages` changes on
    // every incoming message, and re-running this then would re-fetch a range
    // that is already here.
  }, [searchChat.activeMessage, activeChat?.id]);

  /* ------------------------------------------------------------------ */
  /* Step 2: jump to it, once its row is on the page                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const target = searchChat.activeMessage;
    if (!target) {
      scrolledForRef.current = null;
      return;
    }

    const row = document.getElementById(`main-container-${target}`);
    // Not painted yet. Step 1 is fetching it, and this effect runs again the
    // moment the store holds it, because `activeChat.messages` is a dependency.
    if (!row) return;

    row.classList.add(HIT_CLASS);
    if (scrolledForRef.current !== String(target)) {
      scrolledForRef.current = String(target);
      row.scrollIntoView({ block: "center" });
    }

    return () => row.classList.remove(HIT_CLASS);
  }, [searchChat.activeMessage, activeChat?.messages]);

  /* ------------------------------------------------------------------ */
  /* Results belong to one conversation, and die with the bar            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    setChatSearchValue("");
    clearResults();
  }, [activeChat?.id]);

  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      latestQueryRef.current += 1;
      setChatSearchValue("");
      setChatSearchRequest({ messages: [], offset: null });
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Where the reader is standing in the result list                     */
  /* ------------------------------------------------------------------ */
  const matches = searchChat.messages ?? [];
  const position = matches.findIndex(
    (id) => String(id) === String(searchChat.activeMessage),
  );
  // Newest first, so a lower index is a newer message.
  const hasNewer = position > 0;
  const hasOlder = position >= 0 && position < matches.length - 1;
  const busy = searchChat.loading;

  const goTo = (index: number) => {
    const id = matches[index];
    if (id === undefined) return;
    setChatSearchId(id);
  };

  const arrowClass = (enabled: boolean) =>
    `flex ml-1 ${
      enabled ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
    }`;

  return (
    <div className=" z-999999 absolute h-[50px] top-[48px] items-center left-0 w-full bg-[#fafafa] py-2 px-3 flex-row justify-between">
      <div className="flex relative w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="z-20"
          width="25.5"
          height="25.5"
          viewBox="0 0 25.5 25.5"
        >
          <g id="search-3" transform="translate(0.25 0.25)">
            <g
              id="Group_3684"
              data-name="Group 3684"
              transform="translate(17.819 5.414)"
            >
              <g id="Group_3683" data-name="Group 3683">
                <path
                  id="Path_15701"
                  data-name="Path 15701"
                  d="M77.249,111.247a.926.926,0,0,1,1.31,0,6.33,6.33,0,0,1,1.811,5.131.926.926,0,0,1-.921.834c-.031,0-.062,0-.093,0a.926.926,0,0,1-.83-1.014,4.485,4.485,0,0,0-1.277-3.637A.926.926,0,0,1,77.249,111.247Z"
                  transform="translate(-76.978 -110.976)"
                  fill="#388cff"
                />
              </g>
            </g>
            <g
              id="Group_3686"
              data-name="Group 3686"
              transform="translate(3.819 0)"
            >
              <g id="Group_3685" data-name="Group 3685">
                <path
                  id="Path_15702"
                  data-name="Path 15702"
                  d="M10.59,0A10.59,10.59,0,1,1,0,10.59,10.6,10.6,0,0,1,10.59,0Zm0,19.328A8.738,8.738,0,1,0,1.853,10.59,8.747,8.747,0,0,0,10.59,19.328Z"
                  fill="none"
                  stroke="#388cff"
                  strokeWidth="0.5"
                />
              </g>
            </g>
            <g
              id="Group_3688"
              data-name="Group 3688"
              transform="translate(0 16.417)"
            >
              <g id="Group_3687" data-name="Group 3687">
                <path
                  id="Path_15703"
                  data-name="Path 15703"
                  d="M336.98,343.712l6.731-6.731a.926.926,0,0,1,1.31,1.31l-6.731,6.731a.926.926,0,1,1-1.31-1.31Z"
                  transform="translate(-336.708 -336.71)"
                  fill="none"
                  stroke="#388cff"
                  strokeWidth="0.5"
                />
              </g>
            </g>
          </g>
        </svg>
        {busy && <Spinner className=" absolute right-2 top-3 z-99 " />}
        <DebounceInput
          className="w-full text-[#1d1d1d] h-full border-none outline-hidden absolute top-0 left-0 pl-11 z-10 light rounded-[15px] bg-[#fafafa]"
          minLength={1}
          placeholder={translateFunction("Search")}
          value={searchChat.searchValue}
          onChange={(e) => {
            setChatSearchValue(e.target.value);
            runSearch(e.target.value);
          }}
          debounceTimeout={TYPING_PAUSE_MS}
        />
      </div>
      <div className="flex ml-2">
        <button
          type="button"
          data-pw="chat-search-newer"
          disabled={busy || !hasNewer}
          className={arrowClass(!busy && hasNewer)}
          onClick={() => goTo(position - 1)}
        >
          <img
            src="/icons/arrow-down.svg"
            alt=""
            style={{ transform: "scale(0.8)" }}
          />
        </button>
        <button
          type="button"
          data-pw="chat-search-older"
          disabled={busy || !hasOlder}
          className={arrowClass(!busy && hasOlder)}
          onClick={() => goTo(position + 1)}
        >
          <img
            src="/icons/arrow-up.svg"
            alt=""
            style={{ transform: "scale(0.8)" }}
          />
        </button>
        <button
          type="button"
          data-pw="chat-search-close"
          className="flex ml-1 cursor-pointer"
          onClick={() => close()}
        >
          <img
            src="/icons/settings/Xicon.svg"
            alt=""
            style={{ transform: "scale(0.8)" }}
          />
        </button>
      </div>
    </div>
  );
}

export default ChatSearch;
