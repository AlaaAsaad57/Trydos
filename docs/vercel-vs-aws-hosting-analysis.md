# Trydos — What It Costs to Run the App Each Month


## 1. How to read this

Trydos is a busy, mostly-live e-commerce app. At full scale we assume roughly:

- **~4 million daily active users (DAU)** at peak.
- Most of them browse; a large share also chat, place orders, and some make calls.
- A **mobile app** uses the same APIs as the website.
- A small **seller dashboard** (~500 business users) — financially a rounding error, ignored below.

We use three scenarios throughout:

| Scenario | Daily active users | Think of it as |
|---|---|---|
| **A — Baseline** | ~1 M | Early growth / soft launch |
| **B — Expected** | ~2.5 M | Healthy steady state |
| **C — Peak** | ~4 M | Full scale / busy season |

Costs fall into two buckets:

1. **Hosting the website/app tier** (the Next.js app) — this is the one place where the
   *platform you pick* (Vercel vs AWS) changes the bill. Covered in §3.
2. **Everything else** — calls, AI, notifications, media. These cost roughly the **same no
   matter where the website is hosted**, because they're separate services billed on their
   own usage. Covered in §4–§7.

The all-in monthly total is in §8.

> **Note:** the separate backend services (inventory, chat, stories, wallet, comments,
> search) run on their own infrastructure and are **excluded from this document on
> request.** They are still mentioned where they affect *behavior* (e.g. what saturates
> first under load), but no cost is attributed to them here.

---

## 2. What we found in the code (the grounding)

A quick, jargon-free summary of how the app actually works, because it drives every number:

- **Every browser and mobile request to the backend goes through a "proxy" inside our
  app.** It reads the login token from a secure cookie and forwards it to the backend.
  This means *every* interaction costs us one extra hop on our own servers — the single
  biggest driver of the hosting bill. *(Code: `app/api/proxy/route.ts`.)*
- **The real business logic lives in 6 separate backend services** (inventory, chat,
  stories, wallet, comments, plus search). These run on their own infrastructure and their
  cost is **out of scope here** — but they're why the proxy hop exists.
- **The whole site is "dynamic" — nothing is cached.** Every page view is freshly
  generated, so we get no savings from caching. This is a major, currently-untapped
  cost lever (see §9). *(`force-dynamic` across home, product, listings, etc.)*
- **Live video/voice calls use Agora and are 1-to-1** (buyer ↔ seller, inside chat).
  The video itself goes directly between the two people — it never touches our servers —
  but Agora bills us per minute. *(Code: `components/Chat/components/ChatVideoCall.tsx`,
  `ChatVoiceCall.tsx`; tokens minted by the chat backend.)*
- **Search uses Google's Gemini AI in two places:** understanding typed search phrases,
  and "search by photo." Both are pay-per-use Google API calls. *(Code:
  `services/elastic/analyzeSearchText.ts` and `app/api/image-search/route.ts`.)*
- **Typing indicators / "online" status use Firebase**, and push notifications use
  Firebase Cloud Messaging. **Product images and story videos are served from a separate
  media server.**

---

## 3. Hosting the website/app (Vercel vs AWS)

This is the only cost where **the platform choice matters**. Everything else is the same
either way.

**Why it's expensive:** because nothing is cached, every page view and every API call is
handled live by our servers — *and* each one passes through the proxy hop, doubling the
work. Add the mobile app using the same APIs, and the volume roughly doubles again.

**The short version of Vercel vs AWS:**

- **Vercel** is the easiest to run (zero setup, scales itself instantly), but it's the most
  expensive at scale. Two reasons, in plain terms: **(1)** it charges a premium for
  *bandwidth* (data sent to users), which is our single biggest line at peak; and **(2)**
  it charges *per request*, and we have an enormous number of small requests.
- **AWS with always-on servers ("containers") + a cheap CDN (Cloudflare)** is the
  cheapest, because one running server quietly handles many requests at once instead of
  being billed per request, and Cloudflare doesn't charge much for bandwidth. The
  trade-off: **you have to build and operate it** (scaling, load balancers, monitoring).
- **AWS "serverless" (Lambda)** ends up about as expensive as Vercel without the
  convenience — not recommended for cost.

**Estimated monthly hosting cost:**

| Hosting option | A (1 M) | B (2.5 M) | C (4 M, peak) | Effort to run |
|---|---|---|---|---|
| **Vercel** (managed) | ~$18–22 K | ~$46–55 K | ~$73–90 K | Lowest |
| **AWS — always-on servers + CloudFront** | ~$11–14 K | ~$28–34 K | ~$44–52 K | High |
| **AWS — always-on servers + Cloudflare** | **~$5–8 K** | **~$12–17 K** | **~$18–25 K** | High |

> At peak, the gap is roughly **$73–90 K (Vercel) vs $18–25 K (cheapest AWS)** — about
> **3–4× cheaper on AWS**, almost entirely from bandwidth pricing. That ~$50–60 K/month
> saving is real, but it pays for an infrastructure team to build and babysit it.

**Recommendation for hosting:** stay on **Vercel through Baseline and into Expected**
(up to ~2–2.5 M DAU) while the team iterates — the convenience is worth the premium and
the absolute dollars are still moderate. **Plan a move to AWS (always-on servers +
Cloudflare) before sustained Peak**, where the savings become too large to ignore.

**What breaks first under load:**
- On **Vercel**, the bill is effectively the failure mode — it just keeps rising; and a
  default per-account request ceiling can start rejecting traffic until raised (needs an
  Enterprise plan).
- On **AWS servers**, the risk is **scaling lag** — adding servers takes 1–3 minutes, so a
  sudden flash-sale spike can overwhelm what's running. Mitigated by keeping spare capacity
  or pre-scaling known events.
- On **both**, the realistic first thing to buckle is one of the **backend services or
  their databases**, not the website tier — that infrastructure is out of scope here, but
  worth validating it can sustain ~12,000 requests/second (web + mobile) at peak.

---

## 4. Live video & voice calls (Agora)

Calls are **1-to-1 between a buyer and a seller**, inside chat (max 30 minutes, typically a
few minutes). The video/audio streams **directly between the two people**, so they don't
load our servers — but **Agora charges per participant per minute.**

**Agora's rates** (post-paid): **~$3.99 per 1,000 minutes of HD video**,
**~$0.99 per 1,000 minutes of audio**, with the **first 10,000 minutes/month free**
(negligible at our scale). A 1-to-1 video call burns minutes for *both* people.

**The big assumption:** how many users actually call, and for how long. This is the most
volatile line in the whole document. Our **base case** assumes **~1% of daily users make a
~4-minute call**, ~60% of those on video:

| | A (1 M) | B (2.5 M) | C (4 M, peak) | Confidence |
|---|---|---|---|---|
| Agora calls (base case) | ~$5–9 K | ~$12–20 K | **~$20–35 K** | Medium — depends entirely on call adoption |

**How sensitive is it?** This line scales directly with *(call rate × minutes × video
share)*. At peak (4 M DAU):

| If this share of users calls daily (~4 min) | Approx. monthly cost |
|---|---|
| 0.5% | ~$13 K |
| 1% (base case) | ~$27 K |
| 2% | ~$55 K |
| 5% | ~$135 K |

> **Takeaway:** if calling becomes a popular feature, Agora can rival or exceed the entire
> hosting bill. **Instrument real call volume before committing a budget**, and consider
> defaulting to audio (4× cheaper) or capping call length.

---

## 5. AI search (Google Gemini)

Two separate Gemini features, both pay-per-use Google API calls. Gemini is billed by
"tokens" (chunks of text/image); the relevant rates are
**~$0.10 / $0.40 per million input/output tokens for `gemini-2.5-flash-lite`** (text) and
roughly **~$0.075 / $0.30 per million for `gemini-1.5-flash`** (image). These are cheap
per call — cost comes from *volume*.

**(a) Understanding typed searches** (`analyzeSearchWord`). When a user types a search
phrase with more than one word (e.g. "white large t-shirt"), we send it to Gemini to pull
out the product name, color, and size. Fires **once per multi-word search.**

**(b) Search by photo** (image search). When a user uploads a product photo, Gemini
describes it in ~5 words to turn into a search. Fires **only when someone uses the camera
feature** — much rarer.

| | A (1 M) | B (2.5 M) | C (4 M, peak) | Confidence |
|---|---|---|---|---|
| Gemini — typed search | ~$1–2 K | ~$3–5 K | ~$5–8 K | Medium |
| Gemini — image search | <$0.5 K | ~$0.5 K | ~$0.5–1 K | Medium |
| **Gemini total** | **~$1–2 K** | **~$3–6 K** | **~$6–9 K** | |

*(Assumes ~30% of daily users run ~2 multi-word searches/day, and ~3% use photo search
once/day.)*

> **Cheap fix worth noting:** the typed-search feature re-sends the *entire* list of
> allowed colors and sizes to Gemini on **every** search. Trimming that list or using
> Gemini's context caching could cut this line meaningfully for almost no effort.
> Note: image search ("by photo") is cheap — image inputs are only a few hundred to a
> couple thousand tokens each, not millions.

---

## 6. Notifications & realtime status (Firebase)

- **Push notifications (Firebase Cloud Messaging)** — **free.**
- **Typing indicators & "online" status (Firebase Realtime Database)** — billed by data
  transferred and number of simultaneous connections. The payloads are tiny but very
  frequent across millions of users.

| | A (1 M) | B (2.5 M) | C (4 M, peak) | Confidence |
|---|---|---|---|---|
| Firebase (realtime status; push is free) | ~$0.5–2 K | ~$1–4 K | ~$2–8 K | Low–Medium |

> Note: the dollars are modest, but Firebase Realtime DB has a hard limit of ~200,000
> simultaneous connections per database. At millions of concurrent users this likely needs
> splitting across several databases — an **operational** concern more than a cost one.

---


## 7. All-in monthly total

Bringing the in-scope sections together. The hosting row shows **both** platform options so
you can see the platform decision in the context of the whole bill. **PostHog, Google
Analytics, and the backend services are excluded per request.**

**At Peak (~4 M DAU):**

| Cost area | Monthly cost | Confidence |
|---|---|---|
| Website/app hosting — **Vercel** | ~$73–90 K | High |
| Website/app hosting — **AWS (servers + Cloudflare)** | ~$18–25 K | High |
| Live calls (Agora, base case) | ~$20–35 K | Medium |
| AI search (Gemini) | ~$6–9 K | Medium |
| Notifications & realtime status (Firebase) | ~$2–8 K | Low–Med |
| **Grand total — on Vercel** | **~$100–140 K** | |
| **Grand total — on cheapest AWS** | **~$45–75 K** | |

**Roughly across all three scenarios:**

| Scenario | On Vercel (all-in) | On cheapest AWS (all-in) |
|---|---|---|
| **A — Baseline (1 M)** | ~$18–35 K | ~$5–20 K |
| **B — Expected (2.5 M)** | ~$50–90 K | ~$25–60 K |
| **C — Peak (4 M)** | ~$100–140 K | ~$45–75 K |

> Two honest caveats about these totals: **(1)** the wide spread comes mostly from the
> low-confidence lines (Agora call adoption, media) that need real usage data; and
> **(2)** at peak the platform choice (Vercel vs AWS) is no longer the only big swing —
> **Agora call adoption and media delivery each matter a lot too.** Remember the backend
> services are excluded — the true total bill will be higher once they're added.

---

## 8. Biggest ways to cut the bill (in priority order)

1. **Turn on caching for the website.** Today nothing is cached, so every page is rebuilt
   on every view. Even ~1 hour of caching on busy, non-personalized pages (home, listings,
   featured) could cut the website's compute and bandwidth by a large margin — likely the
   **single biggest hosting saving available**, on any platform. *(Trade-offs: prices/stock
   can lag up to the cache window — solve with event-based cache refresh, which the repo
   already supports via `/api/revalidate`.)*
2. **Let the mobile app call the backend services directly** instead of routing through our
   website's proxy. Mobile traffic is a big chunk of the website bill purely because it
   passes through us; native apps don't need the proxy. Removing it shrinks the hosting
   tier substantially. *(Trade-off: the backends then need standard cross-origin and
   CSRF protections added first.)*
3. **Move to AWS (always-on servers + Cloudflare) before sustained peak** — ~3–4× cheaper
   hosting once volume is high enough to justify the operations work.
4. **Tune Agora** — default calls to audio where possible, cap call length, and confirm
   the video quality tier. Call adoption is the most volatile cost in the whole app.
5. **Trim the Gemini search payload** — stop re-sending the full color/size list on every
   search (use caching or a shorter list).

> Items 1 and 2 together can cut the **hosting** line by roughly 60% and also flatten the
> Vercel-vs-AWS difference (once compute is cached away, you're mostly paying for
> bandwidth, where Cloudflare wins).

---

## 9. Key assumptions & risks (read before trusting any number)

- **Call adoption (Agora) is the biggest single unknown** — see the sensitivity table in
  §4. Instrument real call volume before budgeting.
- **Media delivery can't be sized from this repo** — it's the largest low-confidence line
  still in scope. Get a real figure from its owner.
- **Usage rates** (searches/user, calls/user, photo-search adoption, page sizes) are
  near-linear knobs — measure actuals before signing any contract.
- **Vercel Enterprise pricing is negotiated**; list/Pro rates roughly **double** the Vercel
  hosting figures — always get a quote.
- **AWS savings assume competent operations** — misconfigured auto-scaling during a
  flash-sale spike is the realistic way the savings evaporate.
- **The likely real bottleneck under load is the backend services / databases** (excluded
  from cost here) — validate they can sustain ~12,000 requests/second before optimizing the
  front end.
- **Excluded by request:** PostHog, Google Analytics, and the backend services. The seller
  dashboard is excluded as immaterial.

---