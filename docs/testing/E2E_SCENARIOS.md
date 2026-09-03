# E2E scenarios

Every case the browser suite runs — **63** of them today. Add a row whenever a
case is added, and keep the count above in step.

| Section | Cases | Signs in? | Writes to staging? |
|---------|-------|-----------|--------------------|
| Guest journeys | GUEST-01 to GUEST-42 | no | only the guest registrations in GUEST-32 to GUEST-34 |
| Signed-in journeys | AUTH-01 to AUTH-03 | yes, once, shared | no |
| Signed-in profile journeys | PROF-01 to PROF-08 | yes, twice, shared | yes — the shared test account |
| Signed-in session recovery | RECOV-01 | yes, its own — a third real code per run | no |
| Scripted auth branches | SCRIPT-01 to SCRIPT-05 | no | no — only the real one-time-code send |
| Scripted profile branches | SCRIPT-07 to SCRIPT-12 | **yes — each case signs in for itself** | **no** — every leg is faked, but each sign-in and one change-number send are real |

Design: `docs/testing/E2E_TEST_DESIGN.md`. How to run: `tests/e2e/README.md`.

## Guest journeys

Real staging. Nobody in this section signs in — the signed-in cases are in
**Signed-in journeys** below. Everything here is read-only except GUEST-32 to
GUEST-34, which register guests on staging because that is the behaviour they
test — about five per run, and they are not cleaned up (see rule 6 in
`tests/e2e/README.md`).

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| GUEST-01 | The root path redirects to a country-and-language path | `guest.live.spec.ts:16` | Locale routing in `proxy.ts` sends `/` to a `/xx-xx` path |
| GUEST-02 | The home page renders and stays up | `guest.live.spec.ts:37` | The app renders and hydrates with no uncaught exception |
| GUEST-03 | Search finds products | `guest.live.spec.ts:50` | The search opens, accepts typing, and returns results from staging |
| GUEST-04 | A listing leads to a product page | `guest.live.spec.ts:60` | A product card navigates to a real product page that has a title |
| GUEST-05 | The cart drawer opens for a guest | `guest.live.spec.ts:75` | The cart opens for someone who never logged in |
| GUEST-06 | A guest from a country we serve goes straight there | `locale.live.spec.ts:51` | A known country is used as-is, with no popup |
| GUEST-07 | A guest from a country we do not serve is asked to pick one | `locale.live.spec.ts:66` | An unknown country falls back to the default and shows the picker |
| GUEST-08 | A browser asking for a language we have gets it | `locale.live.spec.ts:80` | `Accept-Language` picks the language, and does not move the country |
| GUEST-09 | A browser asking for a language we do not have gets English | `locale.live.spec.ts:95` | An unknown language falls back to English, and does not move the country |
| GUEST-10 | A saved country beats the country the visitor is in | `locale.live.spec.ts:110` | The saved choice wins over detection, so travel or a VPN cannot undo it |
| GUEST-11 | An address for a different country than the saved one asks which to keep | `locale.live.spec.ts:130` | A shared link neither switches the country silently nor is ignored |
| GUEST-12 | An address with no country falls back to the saved one, keeping the path | `locale.live.spec.ts:152` | A bookmark with no locale is fixed up without losing the page asked for |
| GUEST-13 | An address matching the saved country and language is served untouched | `locale.live.spec.ts:200` | The ordinary page view is not redirected, and the cookies are not rewritten |
| GUEST-14 | A valid address with nothing saved is served, and the choice is saved | `locale.live.spec.ts:221` | A first-time shared link is honoured and remembered |
| GUEST-15 | An address carrying the pick-a-country marker is served, not bounced again | `locale.live.spec.ts:237` | The picker's own address does not loop |
| GUEST-16 | An address carrying the country-change marker is served, not bounced again | `locale.live.spec.ts:254` | The answer to GUEST-11 does not re-trigger GUEST-11 |
| GUEST-17 | A saved country with no saved language is ignored | `locale.live.spec.ts:275` | Half a saved pair does not half-apply; detection decides |
| GUEST-18 | A gb address with a different saved country goes to the saved country | `locale.live.spec.ts:325` | Nobody who has chosen is left on the default country |
| GUEST-19 | A crawler on a valid address is served it, and given no cookies | `locale.live.spec.ts:345` | Indexed pages carry no `Set-Cookie` |
| GUEST-20 | A crawler with no country gets a permanent redirect to one | `locale.live.spec.ts:363` | 308, not 307, so a crawler remembers the answer |
| GUEST-21 | A crawler is never asked to pick a country | `locale.live.spec.ts:373` | The picker is never indexed in place of a page |
| GUEST-22 | Answering the picker is remembered, and the next visit is not asked | `locale.live.spec.ts:394` | The choice sticks, even from another country |
| GUEST-23 | An answer arriving with other query values still remembers the choice | `locale.live.spec.ts:422` | The fixed bug at `proxy.ts:428` — the choice was lost and the picker re-asked |
| GUEST-24 | An answer with no country in the address still lands on a proper address | `locale.live.spec.ts:444` | The bypass does not strand a visitor on an address with no country |
| GUEST-25 | Too many bounces stops on a default address and asks | `locale.live.spec.ts:463` | The loop guard fires |
| GUEST-26 | A bounce within the limit still behaves normally | `locale.live.spec.ts:480` | The loop guard is a limit, not always-on |
| GUEST-27 | The timestamp marker is dropped on the way to a redirect | `locale.live.spec.ts:495` | `_t` does not survive onto the visitor's address |
| GUEST-28 | `robots.txt` is served as text, never locale-redirected | `locale.live.spec.ts:516` | Crawl rules are reachable |
| GUEST-29 | The site sitemap is served as XML | `locale.live.spec.ts:527` | The matcher excludes it |
| GUEST-30 | A sitemap under a country prefix is served as XML even when the saved country disagrees | `locale.live.spec.ts:535` | The bypass at `proxy.ts:278` — otherwise a crawler gets a redirect instead of XML |
| GUEST-31 | An address written in capitals is permanently redirected to lower case | `locale.live.spec.ts:559` | One page, one address, so it is not indexed twice |
| GUEST-32 | A first visit registers the guest and leaves them able to act | `session.live.spec.ts:141` | The app issues a working credential and the means to renew it, and can name who the guest is |
| GUEST-33 | A refused credential is exchanged, and the guest stays the same guest | `session.live.spec.ts:168` | The pair rotates and the identity survives, so a lapsed credential never interrupts browsing |
| GUEST-34 | A refused pair issues a new guest, and never asks anyone to sign in | `session.live.spec.ts:213` | When renewal cannot work the app issues a new guest silently — a guest has no account to sign in to |
| GUEST-35 | A global address with a saved country but no saved language still goes to that country | `locale.live.spec.ts:293` | `gb` is the global bucket, not a market — losing one cookie must not strand a visitor there with the picker up |
| GUEST-36 | A hyphenated address with no country keeps its path | `locale.live.spec.ts:174` | The fixed bug at `proxy.ts:114` — `/privacy-policy` was read as country `privacy` and language `policy`, and the page was dropped for the home page |
| GUEST-37 | The about page renders its title and back bar | `staticPages.live.spec.ts:14` | A server-rendered page with translations and a back bar loads and shows its own copy |
| GUEST-38 | The contact page renders without errors | `staticPages.live.spec.ts:24` | The shared static layout is the same on every page it carries |
| GUEST-39 | The privacy policy page renders without errors | `staticPages.live.spec.ts:35` | The address on app stores and in payment paperwork reaches the page, not the home page |
| GUEST-40 | The terms of service page renders without errors | `staticPages.live.spec.ts:50` | The shared static layout survives a path with more than one hyphen |
| GUEST-41 | The back button on a static page keeps the visitor in the app | `staticPages.live.spec.ts:61` | The back bar goes to settings rather than dead-ending or leaving the site |
| GUEST-42 | The home page comes back where it was after a product opens and closes | `guest.live.spec.ts:93` | An intercepted overlay shares one window scroll with the page under it, so the page's position is saved and put back by hand — the fixed bug in `components/ModalRoute/overlayScroll.ts`, where it was saved after the page body was already hidden and read back as 2px |
| GUEST-43 | The home page comes back where it was after a product opens and closes | `guest.live.spec.ts:94` | The intercepted product overlay restores the home page's scroll position, guarding `components/ModalRoute/overlayScroll.ts` against the browser overwriting it |

## Signed-in journeys

Real staging, with a real sign-in. Their own `AUTH-` range because these are not
guest journeys: a guest has no account, and none of the guest cases above ever
signs in.

The three share **one** browser context and **one** real sign-in. Each sign-in is
a real one-time code and a real sign-in that fans out to five backends, so three
independent sign-ins would be three codes per run against limits that are not
ours. They run in declaration order and **AUTH-03 must stay last**, because it
ends the shared session.

Per run they cost: one one-time code (a cooldown retry can cost more), one
sign-in, and two guest registrations on staging — one at boot and one after
signing out. Nothing is cleaned up, and nothing needs to be.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| AUTH-01 | A real sign-in lands on every backend it writes for | `auth.live.spec.ts:137` | One sign-in writes a session across five backends, and a part that did not land is named — the storefront, chat, stories, comments or wallet — instead of passing quietly |
| AUTH-02 | A signed-in session still works after a full page reload | `auth.live.spec.ts:209` | A backend still answers an ordinary authenticated request after the reload, so the credential is still accepted and not merely still stored |
| AUTH-03 | Signing out takes the whole session away | `auth.live.spec.ts:249` | Every backend's part of the session is gone, and the three the app also gives a guest come back belonging to somebody else |

## Signed-in profile journeys

Real staging, with a real sign-in, and the only cases in the suite that **write
to the shared test account**. Their own `PROF-` range because they prove the
opposite direction to `AUTH-`: not what signing in reads, but what pressing Save
writes.

One "Save" fans out to stories, then chat, then the core backend, in sequence,
and can finish with two of the three written and the third refused. The shopper
is told once, in one sentence, whatever failed — so each leg is judged
separately here and named when it is missing. **The wallet is not a fourth leg:**
its call is commented out in `services/auth.ts`, so three legs is correct. If it
is ever re-enabled, these cases gain a fourth judgement in the same change.

A write landing is judged on the status the backend answered the settled request
with — never on the `success` field, which is stamped on client-side and would
put the account's name, phone and e-mail within reach of a public job log. A
reload proves something different and is asserted as such: `/api/auth/me` reads
cookies only, so a reload shows the app's **own stored copy** was updated, not
that a backend agrees.

The four share **one** browser context and **one** real sign-in, handed on
through a saved session under `tests/e2e/.auth/` (gitignored, never uploaded,
removed after the last case). PROF-01 signs in and saves it; PROF-02 to PROF-04
open it, so **PROF-01 must stay first**. Every value changed is put back in a
`finally`; a name left as `PROBE_NAME` means a case died mid-run.

Per run they cost: one one-time code, one sign-in, and eight saves against
staging. Nothing prints the account's name, phone or e-mail — comparisons happen
inside `actions/profile.ts` and come back as booleans.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| PROF-01 | The settings screens show the signed-in shopper, not a guest | `profile.live.spec.ts:234` | A real sign-in leaves a session the settings pages render from, and the profile card carries this account rather than a guest placeholder or the previous one |
| PROF-02 | A name change reaches every backend that keeps a copy | `profile.live.spec.ts:335` | One Save lands on stories, chat and the core backend — each named on its own — and the app's stored copy is updated too, checked separately by a reload |
| PROF-03 | Gender, e-mail and alternative phone save together | `profile.live.spec.ts:425` | The fix for a real defect: all three backends accepted the change, but only five fields were mirrored into the app's stored copy, so a changed gender was back to the old one after a reload. Seen red before the fix, green after |
| PROF-05 | A chosen picture is the account's, and removing it removes it | `profile.live.spec.ts:741` | The upload reaches the media store, the app's stored copy keeps it across a reload, and removing it takes it off both. Skips when the media store is not configured |
| PROF-06 | The profile card leads to the picture screen | `profile.live.spec.ts:816` | The card's link is found by address, not by accessible name — the links carry none, which is a real defect in 22 places and this ticket's out of scope |
| PROF-07 | An address the shopper adds is listed, and can be removed | `profile.live.spec.ts:854` | Read back by its details, not by its presence: an address listed without what was entered is a partial success, and a partial success is a failure |
| PROF-04 | The size screen saves a height and a weight | `profile.live.spec.ts:534` | The same fan-out from the size screen — and the control for PROF-03, because `tall` and `weight` were always mirrored, which is what ruled out the test rather than the app |
| PROF-08 | The backends' own copy carries the change after signing out and in | `profile.live.spec.ts:1000` | **Red on purpose — it found a live defect.** Every other profile case judges a save by the status it was answered with, which says the write was accepted, not that it was kept. This one changes the name and the picture, signs out, signs back in, and reads what the backends answer a fresh sign-in with. The core backend is fine. Stories and chat store the change in one row and answer the sign-in from another, so a shopper who renames themselves finds chat still holding their old name and no picture. The failure names both row numbers |

## Signed-in session recovery

Real staging, with a real sign-in, and the only case in the suite that
deliberately **breaks** a credential to see what the app does next.

`session.live.spec.ts` covers this for a **guest**, and a guest is the easy half:
one whose credentials are both refused is quietly re-registered as somebody new
and carries on shopping. That is correct for a guest and would be a disaster for
an account. This is the signed-in half — the shopper has to come back as the
**same** shopper.

**Only the access credential is spoiled.** Refusing both cannot produce a
recovery for a verified shopper: the server returns the refusal untouched and the
app asks them to sign in again. A case written that way would spend a real
one-time code on a guaranteed red every night while looking like a product
failure. The means to renew is left intact — that is what makes this a recovery
rather than a logout.

**The order of the checks is load-bearing.** The rotation poll sits *between* the
action and the identity read: move it after and "the same shopper" can pass
before the exchange has finished, which is the silent pass the whole case is
designed against. It compares against the **spoiled** snapshot, never the
original — the case spoiled that credential itself, so comparing against the
original is trivially true.

It signs in for itself and saves **no** session file: it leaves the account's
credentials rotated, and handing that on is how a profile case once dropped
silently to a guest and reported the account's own details as missing. That costs
a third real one-time code per run, which cannot be avoided — AUTH-03 signs the
shared session out and forgets the saved state.

Per run it costs: one one-time code, one sign-in, and no writes to the account.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| RECOV-01 | A signed-in shopper survives a credential refused mid-action | `session-recovery.live.spec.ts:118` | The action completes, the credentials really were exchanged, the app names the **same** shopper afterwards rather than a new guest, no sign-in prompt is ever shown, and the replacement credential is still kept from page scripts |

## Scripted auth branches

Real staging pages, with the **verify** answer faked. The one-time-code *send* is
still a real server action against staging using the allow-listed test numbers,
spread across two of them so a per-number throttle does not starve the run; only
`/api/auth/login` is scripted, from `tests/e2e/scenarios/index.ts`.

They exist because staging cannot produce these branches on demand: the
allow-listed number is already registered, so signup can never be reached live,
and a wrong code, a throttled verify and a backend error are not ours to cause.
No real session is created, so these are the specs allowed to upload traces.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| SCRIPT-01 | A new phone is taken through signup to the name screen | `auth.scripted.spec.ts:42` | The signup branch runs to the point where a name is asked for — the branch a live run can never reach |
| SCRIPT-02 | An existing account logs in and reaches the success screen | `auth.scripted.spec.ts:58` | The ordinary login branch ends on the welcome screen, or on a widget that closed itself |
| SCRIPT-03 | Logging in with an unregistered number shows the not-registered screen | `auth.scripted.spec.ts:74` | Someone with no account is told so, instead of being left on the code screen |
| SCRIPT-04 | Signing up with a registered number shows the registered screen | `auth.scripted.spec.ts:89` | Someone who already has an account is sent to sign in, instead of being walked through signup again |
| SCRIPT-05 | Verify errors are surfaced on the PIN screen | `auth.scripted.spec.ts:103` | Three refusals in a row — a wrong code, a throttled verify and a backend error — each reach the shopper as a visible message rather than a silent no-op |
| SCRIPT-13 | The code boxes stop taking a fourth code | `auth.scripted.spec.ts:153` | The three-attempt cap holds in a real browser, not only in the hook — the boxes lock rather than sending a fourth code to the OTP backend |


## Scripted profile branches

**Faked, and signed in.** This is the only faking spec that holds a real session,
and it is the reason `SCRIPT-` no longer means "no sign-in, no writes" — read the
summary row above rather than assuming the older one still applies.

These are the branches staging will not perform on request: it accepts everything
it is asked, so a refused leg, a credential refused half way through a save, or a
refused upload have never run anywhere. Two defects were already found in that
code by reading it; these make it observable by running it.

**They run closed.** Unlike `auth.scripted.spec.ts`, a call this spec did not name
is refused and recorded rather than passed through to staging, and each case
asserts at the end that nothing was refused. The account is shared and signed in,
so a call nobody thought about would otherwise be a real write nobody finds out
about — which is what four review rounds of this ticket kept discovering one route
at a time.

**No session is ever shared.** Each case signs in for itself and throws its own
copy away — several damage their own session on purpose, and none may pass that
on. A shared session was tried and measured: nothing renews it, because these
cases also fake `/api/auth/refresh`, so it aged out mid-run. The identities
alternate to spread the per-number one-time-code cooldown.

**They keep no trace**, because a trace is the request headers and this spec has a
real credential in them. Video is kept instead, and the pipeline encrypts the
whole artifact directory before uploading it.

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| SCRIPT-07 | One backend refuses a save, and the shopper is told once | `profile.scripted.spec.ts:173` | With the core leg refusing, every leg was asked and the save is not reported as done. A 500, not a 401 — a 401 starts credential recovery, which is a different branch |
| SCRIPT-08 | An absent chat record is skipped, and is not reported as a failure | `profile.scripted.spec.ts:211` | The account's own profile answer is handed back with only the chat identity removed, so nothing synthetic reaches the account. Chat is never written; the save still completes |
| SCRIPT-09 | A refused picture upload is reported, and saves nothing | `profile.scripted.spec.ts:271` | The ticket succeeds and only the upload refuses, so the case reaches the thing it names. The shopper is told, and no leg is written |
| SCRIPT-10 | A credential refused mid-save is renewed, and the save completes | `profile.scripted.spec.ts:324` | The core leg answers 401 then 200. The second write is shown to be the retry by the value it carried — counting cannot tell a retry from a rollback |
| SCRIPT-11 | When renewal also fails, the shopper is asked to sign in again | `profile.scripted.spec.ts:377` | The renewal answers "eligible but not refreshed" and the sign-out route answers "expired" — an answer carrying `renewed` would short-circuit before the shopper is ever asked |
| SCRIPT-12 | Changing the number asks for a confirmation before it saves | `profile.scripted.spec.ts:410` | No leg is written until the new number is confirmed. The number typed is the second configured identity, never an invented one, because the code that follows is a real send |
