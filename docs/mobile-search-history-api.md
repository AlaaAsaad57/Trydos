# Search history API: guide for the app developer

Each shopper has one search history, and every device shows the same words.
Guests have a history too. It belongs to the guest's own user id.

The server keeps the words. Do not keep your own copy as the source of truth.

## The calls

| Call | Body | Answer |
|---|---|---|
| `GET /api/search/history` | none | `{ "success": true, "data": { "terms": ["red dress", "shoes"] } }` |
| `POST /api/search/history` | `{ "term": "shoes", "products_count": 4 }` | `{ "success": true }` |
| `DELETE /api/search/history` | `{ "term": "shoes" }` | `{ "success": true }` |
| `DELETE /api/search/history` | `{ "all": true }` | `{ "success": true }` |

**Host:** `https://dev.trydos.com`. This route is on the web app host, the same
host as the comments API. It is not on the market API host (`/api/v1`).

A 404 means the web build on that host does not have this route yet. Ask the web
team.

**Headers on every call:**

```
Authorization: Bearer <MARKET access token>
Content-Type: application/json
```

- `x-market-token: <token>` also works, if you use `Authorization` for something
  else.
- Guest tokens and signed-in tokens both work.
- Never send a user id. The server finds the user from the token, and it ignores
  any id in the request.

## What to build

### 1. Show the history when the search screen opens

1. Wait until the app has a token. A call with no token answers 401, and on a
   first launch the guest may not exist yet.
2. Call `GET` and show `data.terms` in the order they come.
3. Call `GET` again when the user changes, for example after a sign-in. The guest
   and the signed-in user have different ids, and the server does not merge their
   words.

`GET` gives up to 50 words, newest first, each word once.

### 2. Log a word only when the shopper settles on it

Do not send a word for each key. A half word in the log stays in the shopper's
history.

The web app does this, and the app should do the same:

1. The results for the word arrive.
2. Wait 1.5 seconds. If the word changes, drop the waiting word.
3. Send `POST` with that word.
4. If the shopper taps a result or leaves the search before the wait ends, send
   the waiting word at once.

`products_count` is the number of results. It is optional and defaults to 0. A
search with no results still counts, so log it too.

### 3. Do not log twice when the shopper submits

`GET /api/products/searchInCatalog` also logs its `search_text`. So when the
shopper presses Search and you open the listing:

- Cancel the waiting word. The listing call logs it.
- **Send the `uid` header on that call.** Without `uid`, the row has no owner, and
  the word never shows in this history.

Because this call logs every `search_text` it gets, do not use it for live results
on each key. If you do, half words go into the log.

See `docs/mobile-searchInCatalog-api-guide.md` for that call.

### 4. Remove a word, or clear all

1. Take the word off the screen at once.
2. Send `DELETE`.
3. If the answer is not 200, show an error and call `GET` to bring back the real
   list.

Send the word **exactly as `GET` gave it**. See "Rules to know" below.

## Status codes

| Status | `message` | Meaning | What the app does |
|---|---|---|---|
| 200 | none | Done | Use the answer |
| 400 | `Send a term of 1 to 256 characters.` | Bad `POST` body | Fix the call. Do not retry |
| 400 | `Send a term, or all: true.` | Bad `DELETE` body | Fix the call. Do not retry |
| 401 | `Missing market token.` | No token was sent | Get a token first |
| 401 | `Token expired.` | The token has expired | Refresh the token, then send the same call again |
| 429 | `Too many requests. Try again in 9s.` | Over the limit | Wait for the seconds in `message`. There is no `Retry-After` header |
| 503 | `Search history is not available.` | A backend failed. The token may still be good | Try again later. **Do not refresh the token** |

Limits for each user, each minute:

| Call | Limit |
|---|---|
| `GET` | 60 |
| `POST` | 30 |
| `DELETE` | 20 |

## Tokens: the 401 and 503 rule

An access token lives 60 seconds, so a 401 here is normal. A refresh token works
only once.

**This route never refreshes a token.** The app owns its refresh token, so the app
does the refresh, with the same step as every other market call:

1. A call answers 401.
2. The app refreshes the token.
3. The app sends the same call again. That answer is the real one.

**Never refresh on a 503.** A 503 says nothing about the token. If the app refreshes
on a 503, it spends its single-use refresh token for no reason. Two refreshes at
the same time can lose the session, because only one of them can win.

## Rules to know

**Words are stored in lower case.** The server trims the word and changes it to
lower case before it logs it. So `POST "Red Dress"` shows as `red dress` in `GET`.

**`DELETE` must match the stored word exactly.** `DELETE { "term": "Red Dress" }`
matches nothing, and it still answers 200. So a 200 does not prove that a word was
removed. Always send the word from `GET`.

**If you send both fields, only the word is removed.** `{ "term": "shoes", "all": true }`
removes `shoes` only. `all` must be the JSON value `true`, not the string `"true"`.

**`DELETE` carries a JSON body.** Check that your HTTP client really sends it. A
`DELETE` with no body answers 400.

**Words under 3 characters are not logged.** The `POST` still answers 200. So skip
the call for these words. The limit for a word is 256 characters, and a longer word
answers 400.

**A new word is not in `GET` right away.** `POST` does not wait for the search log
to update, so a `GET` straight after it can miss the word. Add the word on the
screen yourself. A `DELETE` shows in the next `GET` at once.

**Searching a word again does not always move it to the top.** The server skips the
log when a row for that word already matches two of these three: user id, IP, user
agent. The old row keeps its old time, so the word keeps its old place. On the same
phone and network, expect the word to stay where it is.

**Two shoppers on one network can affect each other.** The same check can match on
IP and user agent alone, with a different user id. Then the second shopper's word
may not be logged. For example, a guest searches `shoes`, signs in on the same
phone, and searches `shoes` again. The signed-in history may not show the word.

**A removed word can come back.** Removal only sets `is_deleted: true` on the
shopper's rows, and nothing is deleted. If the shopper searches the word again, the
server writes a new row, and the word returns to the history.

**A removed word can still show under Popular Search.** The popular words count
every row, also the removed ones.

**The server checks the token on each call.** Each call asks the core backend who
owns the token, and that step can take up to 8 seconds before it gives up. So do not
block the search screen while you wait for `GET`.
