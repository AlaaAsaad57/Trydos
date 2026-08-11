---
name: test-summary
description: Use when unit tests have just been written, changed, or finished and the user asks for a test summary, a test report, a list of what the tests check, how much of the app is covered, or something a non-technical person (a manager, a client) can read. Triggers on "test summary", "summarise the tests", "what do our tests cover", "coverage report", "report for the manager", or running the skill after a testing ticket.
---

# test-summary

Write one short dated file that tells a **non-technical reader** two things and nothing else:
**the tests written since the last summary**, and **how much of the whole app is checked**.
Anything that is not one of those two things does not belong in the file.

Output: `docs/testing/summaries/TEST-SUMMARY-<YYYY-MM-DD>.md` — a **new file every run**. Never
edit an older one; they are the record of how things looked that day.

## Golden rules (non-negotiable)

1. **Write for someone who has never seen the code.** No file paths, no function names, no
   `AC-1`, no `vi.mock`, no "reducer", "middleware", "fixture", "mock", "store". If a word only
   makes sense to a developer, it does not belong in this file.
2. **Never dress up the numbers.** If tests fail, the first line says so. If coverage is low, the
   file says it plainly. A summary that reads better than reality is worthless.
3. **Only what the digest says.** Every number and every test line comes from `digest.md`. Never
   estimate, round up, or add a test you think exists.
4. **One `When … then …` line per new test of the app.** Every new test gets its own line, in
   that shape, on one line. Do not merge two tests into one line, and do not drop the boring ones.
5. **Never list the tests that check the testing tools.** The sample data, the stand-ins, the
   fake network and the render helper protect the other tests, not the app. The digest counts
   them separately. Give them **one line** in the summary stating the count, and nothing more.
6. **Only the new tests get lines.** Tests already listed in an earlier summary are counted, not
   relisted. The coverage section is always the whole app.
7. **Keep it short.** No paragraph explaining an area, no sub-headings inside an area, no
   commentary between lines. If an area needs sub-headings, it is really two areas — split it.
   The lines carry the meaning; nothing else is needed.
8. **English, short sentences, one idea per sentence** — plain B2-level wording, no jargon.

## Procedure

### 1. Run the tests with coverage

```bash
pnpm exec vitest run --coverage \
  --coverage.reporter=json-summary --coverage.reporter=text-summary \
  --reporter=json --outputFile=<scratchpad>/vitest-results.json
```

Use the session scratchpad, never the repo, for `vitest-results.json` — it is several megabytes.

**Do not read `vitest-results.json`.** It is far too big. The next step reduces it for you.

### 2. Collect the numbers

```bash
node .claude/skills/test-summary/collect.mjs <scratchpad>
```

This writes two files into that folder:

| File | What it is |
|---|---|
| `digest.md` | The brief you read: the run result, the **new** tests grouped by file, the coverage tables. |
| `index-block.txt` | A hidden list of every test. It goes at the end of the summary so the next run can tell what is new. |

Read `digest.md`. If it says any test failed, that changes what you write — see rule 2.

### 3. Group the new tests by what a person would recognise

The digest groups by file. **You must regroup by the part of the app a reader knows**, and give
each group a heading in their words. Some examples of the move you are making:

| Digest says | Heading a reader understands |
|---|---|
| `proxy.ts` | Landing on the right language and country |
| `store/Cart/reducer.ts` | What the basket remembers |
| `utils/functions.tsx` (prices) | Showing the right price |
| `services/auth.ts` | Signing in and staying signed in |

Aim for **6 to 20 lines per area**. Over 20 and the reader loses the thread — split it into two
areas with their own headings rather than adding sub-headings inside one.

The digest lists **only** tests of the app. Tests of the testing tools are given as a count at the
top of that section — carry that count into the summary's one-line note (step 5 of the template)
and never expand it into bullets.

### 4. Rewrite each test as one `When … then …` line

**The shape is `When <the situation>, then <what happens>.`** — one line, one sentence, full stop
at the end. Use `and` to join two conditions or two outcomes. Drop the id, the file and the
mechanism. Say what a person would notice if it broke.

| Test title in the digest | Line in the summary |
|---|---|
| `keeps ar when the address already names it` | When a visitor is already on the Arabic site, then they stay on it. |
| `refuses a saved country it does not support and uses the default gb` | When a saved country is one we do not serve, then the visitor gets the United Kingdom instead. |
| `prefers the saved country over the one the request appears to come from` | When a visitor has chosen a country before and arrives from another, then the chosen one wins. |
| `multiplies without the usual decimal drift` | When a price is converted, then it multiplies exactly and never drifts by a penny. |
| `RECORDED FINDING: a pair with a capital letter is permanently redirected…` | ⚠️ When an address is typed in capitals, then it is permanently redirected to small letters — recorded as it is today, not as we want it. |

Keep each line under about 110 characters so it fits on one line on screen. If it will not fit,
the wording is too technical — cut the mechanism, not the meaning.

Mark anything the tests **recorded rather than approved** with ⚠️ and say so — a reader must not
mistake "we pinned today's odd behaviour" for "this behaves correctly".

### 5. Write the coverage section

Keep this section small: the whole-app table, one line of file counts, the short list of parts
that have their own tests, and three bullets. **Do not copy the digest's area-by-area table** —
it is there to inform you, not the reader.

Use the digest's numbers exactly. It must carry **both** of these, in this order, or it misleads:

- **The whole-app share** — the honest headline (lines covered out of all lines).
- **Where the checking is deep** — the short list of the files that have a test of their own.

Then **three short bullets, no more**: what is properly checked, what has nothing yet, and what
"covered" does not mean (a covered line was run by a test — that does not prove the behaviour is
right, and it says nothing about how the app looks or feels). Never leave the headline number out
because it looks bad, and never leave the deep areas out because the headline looks bad.

### 6. Write the file, then append the hidden index

Write `docs/testing/summaries/TEST-SUMMARY-<YYYY-MM-DD>.md` (create the folder if it is missing;
use today's real date). Then append the index — **never paste it by hand**:

```bash
cat <scratchpad>/index-block.txt >> docs/testing/summaries/TEST-SUMMARY-<date>.md
```

### 7. Count the lines before you call it done

Merging two similar tests into one line is the easiest mistake to make and the hardest to spot.
Count them:

```bash
F=docs/testing/summaries/TEST-SUMMARY-<date>.md
grep -c '^- \(⚠️ \)\?When ' $F                 # must equal `new app tests` from the collector
grep '^- ' $F | grep -cv '^- \(⚠️ \)\?When '   # only the bullets under "Reading these numbers"
grep '^- ' $F | awk 'length>112' | wc -l       # must be 0 — any line this long is too technical
```

If the first count is short, you merged or dropped tests — find them and split them back out
before reporting. The tests of the testing tools are deliberately not in that number.

### 8. Report back

Say where the file is, how many tests are new, whether everything passed, and the coverage
headline. Never commit unless asked.

## Template

````markdown
# Test summary — <11 August 2026>

**<One sentence: what was checked this time and whether it all passes.>**

| | |
|---|---|
| **New checks added this time** | <n> |
| **Checks in the app in total** | <n> |
| **Result** | <✅ All passing / ❌ n failing — see below> |
| **How much of the app is checked** | <x.x%> of the code |
| **Date** | <YYYY-MM-DD> |

---

## What we checked this time

### <Plain-language area heading>

- When <the situation>, then <what happens>.
- When <the situation> and <another>, then <what happens>.
- ⚠️ When <…>, then <…> — recorded as it is today, not as we want it.

### <Next area…>

<After the last area, one line only:>
Another <n> checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | <n> | <n> | <x.x%> |
| Decision points | <n> | <n> | <x.x%> |
| Functions | <n> | <n> | <x.x%> |

### The parts we set out to test

| Part of the app | Share checked |
|---|---|
| <plain name — file> | <x.x%> |

### Reading these numbers

- **What is checked well:** <one line>
- **What has nothing yet:** <one line>
- **What "checked" does not mean:** a checked line is one a test ran. It does not prove the
  behaviour is what the business wants, and it says nothing about how the app looks or feels.
````

## Common mistakes

| Mistake | Fix |
|---|---|
| Copying test titles straight across | Rewrite every one as `When … then …`. A title is written for a developer. |
| A line that states a fact but no situation | Every line needs both halves: the situation, then the result. |
| Sub-headings inside an area, or a paragraph explaining it | Cut them. Over 20 lines means split the area in two. |
| Headings named after files or folders | Name the part of the app a customer would recognise. |
| Leading with "92% covered" from one strong file | The headline is always the whole-app share. Depth comes after it. |
| Quietly leaving out a failing test | Failures go in the first line and in their own section. |
| Merging several tests into "we check the basket" | One line per test — that is what makes the file trustworthy. |
| Relisting tests from an older summary | Only new tests get lines. The rest are a count. |
| Listing the checks on the sample data, the stand-ins or the fake network | Those are the testing tools. One line with the count, no bullets. |
| Editing yesterday's file | Always a new dated file. |
| Forgetting the hidden index | Without it the next run cannot tell what is new, and relists everything. |
