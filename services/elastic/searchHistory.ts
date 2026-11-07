// ---------------------------------------------------------------------------
// One shopper's own search history, read from the search log in Elasticsearch.
// This file reads the log, hides words in it, and adds the words a shopper
// settled on (see components/Home/Search/useSearchLog.ts).
//
// REMOVING A WORD
// Nothing is deleted. Other apps use the log, so a removed word only gets
// `is_deleted: true`, and this history skips those rows.
//
// WHO IS ASKING
// The market backend decides, from the token. A user id sent by a client is
// never used, so nobody can read or clear another shopper's history.
//
// SHORT-LIVED TOKENS
// An access token lives 60 seconds, and a refresh token works only once. So:
//   - This file never exchanges a token. An expired token is answered with
//     "expired", the route says 401, and the caller refreshes and retries.
//     The browser and the mobile app each own their refresh token. A second
//     owner on the server would race them and lose the session.
//   - Nothing here caches the answer by token. A cached answer could accept an
//     expired token, and the caller would never learn it must refresh.
//   - "unavailable" is kept apart from "expired". A backend failure must not
//     become a 401, because a 401 makes the caller spend its refresh token.
//
// The core backend answers `/customer/info` for guest and verified tokens with
// the same id, so one call covers both.
// ---------------------------------------------------------------------------

import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import { logSearchTerm } from "services/elastic/helpers";
import { search_log_index } from "services/elastic/INDEXES";
import { CUSTOMER_INFO_URL } from "utils/endpointConfig";
import { LogServerError } from "utils/serverErrorReporter";

/** How many different words the history shows. */
const HISTORY_LIMIT = 50;
const VERIFY_TIMEOUT_MS = 8000;

export type SearchHistoryIdentity =
  | { status: "verified"; userId: number }
  | { status: "expired" }
  | { status: "unavailable" };

/** Ask the core backend who owns this token. */
export async function verifySearchHistoryUser(
  token: string,
): Promise<SearchHistoryIdentity> {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}${CUSTOMER_INFO_URL}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      },
    );
    if (response.status === 401) return { status: "expired" };
    if (!response.ok) return { status: "unavailable" };

    const body = await response.json();
    const userId = Number(body?.data?.customer_info?.id);
    // Without a real id there is no owner to filter on: fail closed.
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return { status: "unavailable" };
    }
    return { status: "verified", userId };
  } catch (error) {
    LogServerError({
      scenario: "verifySearchHistoryUser could not reach the core backend",
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: "unavailable" };
  }
}

/**
 * The shopper's words, newest first, each word once. The same word can have
 * several log rows, one per device or address, so the rows are collapsed.
 */
export async function listSearchHistory(userId: number): Promise<string[]> {
  const response = await elasticSearchClient.search({
    index: search_log_index,
    size: HISTORY_LIMIT,
    _source: ["search_term"],
    query: {
      bool: {
        filter: [
          { term: { user_id: userId } },
          { exists: { field: "search_term.keyword" } },
        ],
        must_not: [{ term: { is_deleted: true } }],
      },
    },
    collapse: { field: "search_term.keyword" },
    sort: [{ timestamp: { order: "desc" } }],
  });

  return response.hits.hits
    .map((hit) => (hit._source as { search_term?: unknown })?.search_term)
    .filter(
      (term): term is string => typeof term === "string" && term.length > 0,
    );
}

/** Add a word the shopper settled on to the search log, under this shopper. */
export async function logSearchHistoryWord(
  userId: number,
  term: string,
  productsCount: number,
): Promise<void> {
  await logSearchTerm({
    searchText: term,
    userData: { id: userId },
    productsCount,
    client: elasticSearchClient,
  });
}

/**
 * Flag one word, or every word when `term` is left out, on this shopper's rows
 * only. The refresh makes the change visible to the next read at once.
 */
export async function removeSearchHistory(
  userId: number,
  term?: string,
): Promise<void> {
  const filter: object[] = [{ term: { user_id: userId } }];
  if (term !== undefined) {
    filter.push({ term: { "search_term.keyword": term } });
  }

  await elasticSearchClient.updateByQuery({
    index: search_log_index,
    refresh: true,
    conflicts: "proceed",
    script: { source: "ctx._source.is_deleted = true", lang: "painless" },
    query: { bool: { filter, must_not: [{ term: { is_deleted: true } }] } },
  });
}
