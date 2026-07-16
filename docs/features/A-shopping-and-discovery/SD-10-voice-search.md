# SD-10 — Voice Search

| | |
|---|---|
| **Feature ID** | SD-10 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Home/Search/SearchVoice.tsx`, `app/api/speech-recognition/route.ts` |

---

## What it is

Search by speaking: the shopper taps the microphone in the search box, speaks, and the spoken
words are transcribed into a search query.

## Where it appears

- Inside the search box (SD-07), shown when the field is empty/unfocused, next to image search.

## Who uses it

Shoppers who prefer speaking to typing — particularly on mobile.

## How it works (verified behaviour)

- **Recording:** tapping the mic records audio (mono, 16 kHz) for **up to 8 seconds**, with a
  circular countdown ring and a pulsing "recording" indicator. The shopper can tap again to
  stop early.
- **Transcription:** the audio is sent to `POST /api/speech-recognition`, which uses the
  **AssemblyAI** service (upload → request transcript → poll until complete, up to ~60s).
  **Automatic language detection** is enabled (`language_detection: true`, no fixed
  `language_code`): AssemblyAI detects the spoken language and transcribes it. Covers the
  app's English, Arabic, and Turkish users. **Kurdish is not supported by AssemblyAI** — a
  Kurdish speaker is transcribed as the nearest supported language.
- **Result:** the transcribed text is placed in the search box and a search runs automatically.
- **Browser fallback:** the moment recording starts, the browser's live **Web Speech API**
  (`SpeechRecognition`) runs in parallel on the mic (Chrome/Edge/Safari; en/ar/tr only — it
  has no Kurdish). If AssemblyAI returns text it wins and the fallback is discarded; if
  AssemblyAI fails or returns nothing, the live fallback's transcript is used **before** the
  give-up toast. Fully guarded — it can never break the primary AssemblyAI path.
- **Error handling:** clear messages for microphone-permission denied, unsupported browser
  (the mic icon is greyed out), and empty/failed transcription ("try again with clear voice")
  — the last only after the browser fallback also produced nothing.

## Data source

| Item | Value |
|------|-------|
| Client | `components/Home/Search/SearchVoice.tsx` (browser `MediaRecorder`) |
| API | `app/api/speech-recognition/route.ts` |
| Provider | **AssemblyAI** — base URL and key both read from env (`ASSEMBLYAI_BASE_URL`, `ASSEMBLYAI_API_KEY`); route returns 500 if the key is unset |
| Language | **Auto-detect** (`language_detection: true`); model `best`. Detects en/ar/tr; **ku unsupported by provider** |
| Max record | 8 seconds; transcription poll timeout ~60 seconds |

## Cost

Billed by **audio duration submitted** on the `best` model (**≈ $0.21 / audio hour**,
[AssemblyAI pricing](https://www.assemblyai.com/pricing)). Recordings are capped at **8 s**,
so each voice search costs at most:

| Volume | Cost (8 s max clip) | Cost (~4 s typical) |
|--------|--------------------|---------------------|
| 1 search | ~$0.00047 | ~$0.00023 |
| 1,000 searches | ~$0.47 | ~$0.23 |
| 10,000 searches | ~$4.70 | ~$2.30 |
| 100,000 searches | ~$47 | ~$23 |

- **Free tier:** new accounts get **$50 in signup credits** (no card) — ≈ **107,000**
  max-length (8 s) voice searches, or more for shorter clips, before any paid usage.
- Auto-detect does **not** change the price (same per-hour rate as fixed-language).
- Switching the model to `nano` (≈ $0.15/hr) would cut cost ~30% at some accuracy loss —
  not currently done.

## Current status & maturity

**Live and functional.** The AssemblyAI credentials were moved out of source into environment
variables (`ASSEMBLYAI_API_KEY` / `ASSEMBLYAI_BASE_URL`) — the earlier hardcoded-key issue is
resolved.

## Known gaps / notes


- **Kurdish (`ku`) unsupported by AssemblyAI.** Auto-detect covers English, Arabic, and
  Turkish; a Kurdish speaker is transcribed as the nearest supported language. No provider
  fix available.
- **Short-clip detection risk.** AssemblyAI recommends **≥ 15 s** of speech for reliable
  language detection, but recording is capped at **8 s**. Detection may misfire on very short
  or noisy clips. Raising the cap (or setting a fallback language) would improve reliability.

## Related features

SD-07 (Search overlay — hosts this) · SD-11 (Image search — the other alternative input).
