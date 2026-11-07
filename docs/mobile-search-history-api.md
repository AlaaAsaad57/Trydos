# Search history API

Each shopper can read and clear their own search history on any device. The
words come from the search log in Elasticsearch. Guests have a history too: it
belongs to the guest's own user id.

Base path: `/api/search/history`

## Sign-in

- **Mobile:** send the MARKET access token as `Authorization: Bearer <token>`.
  `x-market-token: <token>` also works.
- **Web:** send nothing. The route reads the HttpOnly `MARKET-TOKEN` cookie.

The server finds the user from the token. Never send a user id. The route
ignores it.

## Calls

### `GET /api/search/history`

Answers up to 50 words, newest first, each word once.

```json
{ "success": true, "data": { "terms": ["red dress", "shoes"] } }
```

### `POST /api/search/history`

Adds a word to the log. Send it only for the word the shopper settled on, never
for each key. The web app waits 1.5 seconds after the results arrive, and sends a
waiting word at once if the shopper leaves the search.

```json
{ "term": "shoes", "products_count": 4 }
```

Answer: `{ "success": true }`. A missing word, or one over 256 characters,
answers 400. Words under 3 characters answer 200 and are not logged.

### `DELETE /api/search/history`

Send one of these JSON bodies:

```json
{ "term": "shoes" }
```

```json
{ "all": true }
```

Answer: `{ "success": true }`. Any other body answers 400.

## Status codes

| Status | Meaning | What the caller does |
|---|---|---|
| 200 | Done | Use the answer |
| 400 | The POST or DELETE body is not valid | Fix the call |
| 401 | The token is missing or has expired | Refresh the token, then send the same call again |
| 429 | Over the limit: 60 reads, 30 logged words or 20 removals a minute | Wait for the seconds in `message` |
| 503 | The core or search backend failed. The token may still be good | Try again later. **Do not refresh the token** |

## Short-lived tokens

An access token lives 60 seconds, so a 401 here is normal. A refresh token works
only once.

**This route never refreshes a token.** The client that owns the refresh token
does it, then retries. Two owners would race for the same refresh token, and the
loser would lose the session.

- **Web:** `utils/fetchData.ts` treats this route as a market call. A 401 goes
  through the shared `RefreshSession`, then the call is sent again.
- **Mobile:** use the same refresh step as every other market call.

## What removal does

A removal does not delete anything. It sets `is_deleted: true` on the shopper's
rows in the search log, so other apps can still use them. The trending words and
the search sitemap keep counting those rows.

The history hides flagged rows. If the shopper searches the same word again,
`logSearchTerm` writes a new row, and the word comes back.
