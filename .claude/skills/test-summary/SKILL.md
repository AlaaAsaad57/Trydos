---
name: test-summary
description: Use when tests have just been written, changed, or finished and the user asks for a test summary, a test report, a list of what the tests check, how much of the app is covered, or something a non-technical person (a manager, a client) can read. Covers both the unit tests and the browser (e2e) suite. Triggers on "test summary", "summarise the tests", "what do our tests cover", "coverage report", "e2e summary", "report for the manager", or running the skill after a testing ticket.
---

# test-summary

Every run writes **two files**, both dated, both new:

| File | Reader | What it holds |
|---|---|---|
| `docs/testing/summaries/TEST-SUMMARY-<date>.md` | a manager, a client | the **unit** tests written since the last summary, and how much of the whole app is checked |
| `docs/testing/summaries/E2E-SUMMARY-<date>.md` | an engineer, a tester | the **browser** cases added since the last summary, in the shape of `docs/testing/E2E_SCENARIOS.md` |

They are written for different people, so they read differently. Do not merge
them, and do not copy the voice of one into the other.

**Never edit or overwrite a summary.** The skill may run several times in one
day. The day's second run writes `-2`, the third `-3`. Both collectors work the
free name out for you and print it — use the name they give, never one you
guessed. The previous run is simply the newest file on disk, today's earlier runs
included.

Write the browser file **only when the browser suite has cases that are not yet
written up**. If the collector reports `new cases 0`, say so and write only the
unit file.

## Golden rules (non-negotiable)

Rules 1 to 8 govern **the unit summary**. Rules 9 to 14 govern **the browser
summary**. Rule 15 governs both.

1. **Write for someone who has never seen the code.** No file paths, no function
   names, no `AC-1`, no `vi.mock`, no "reducer", "middleware", "fixture", "mock",
   "store". If a word only makes sense to a developer, it does not belong.
2. **Never dress up the numbers.** If tests fail, the first line says so. If
   coverage is low, the file says it plainly. A summary that reads better than
   reality is worthless.
3. **Only what the digest says.** Every number and every test line comes from
   `digest.md`. Never estimate, round up, or add a test you think exists.
4. **One `When … then …` line per new test of the app.** Every new test gets its
   own line, in that shape, on one line. Do not merge two tests into one line,
   and do not drop the boring ones.
5. **Never list the tests that check the testing tools.** The sample data, the
   stand-ins, the fake network and the render helper protect the other tests, not
   the app. The digest counts them separately. Give them **one line** in the
   summary stating the count, and nothing more.
6. **Only the new tests get lines.** Tests already listed in an earlier summary
   are counted, not relisted. The coverage section is always the whole app.
7. **Keep it short.** No paragraph explaining an area, no sub-headings inside an
   area, no commentary between lines. If an area needs sub-headings, it is really
   two areas — split it.
8. **English, short sentences, one idea per sentence** — plain B2-level wording,
   no jargon.

9. **The browser file copies the shape of `E2E_SCENARIOS.md`** — the same four
   columns, in the same order: `ID`, `Case`, `Spec`, `What it proves`. That file
   is the model; look at it before you write.
10. **The browser file keeps the spec path.** Rule 1 does not apply here. Its
    reader is an engineer or a tester who has to open the file, so the `Spec`
    column carries `<file>:<line>` exactly as the collector reports it, and
    "What it proves" may name `proxy.ts` or a cookie.
11. **One row per new case, and only new cases.** Cases already in
    `E2E_SCENARIOS.md` are counted, never relisted.
12. **Ids continue the family.** Use the next free number the collector prints. A
    case belonging to a journey that has no section yet starts a new family at
    `01` and gets its own section heading.
13. **The same rows go into `docs/testing/E2E_SCENARIOS.md`.** Append them under
    the right section, word for word, so the master list stays complete.
14. **Never claim a browser result you did not see.** The collector reads the
    spec files; it does not run Playwright and knows nothing about pass or fail.
    Give a result only if the suite was actually run in this session and you read
    the output. Otherwise say the file lists what the suite covers, not how it
    last ran.

15. **Never edit an older summary of either kind**, and never reuse a name that
    exists. They are the record of how things looked that day.

## Procedure

### Part A — the unit summary

#### 1. Run the tests with coverage

```bash
pnpm exec vitest run --coverage \
  --coverage.reporter=json-summary --coverage.reporter=text-summary \
  --reporter=json --outputFile=<scratchpad>/vitest-results.json
```

Use the session scratchpad, never the repo, for `vitest-results.json` — it is
several megabytes.

**Do not read `vitest-results.json`.** It is far too big. The next step reduces
it for you.

#### 2. Collect the numbers

```bash
node .claude/skills/test-summary/collect.mjs <scratchpad>
```

This writes two files into that folder:

| File | What it is |
|---|---|
| `digest.md` | The brief you read: the file name to write, the run result, the **new** tests grouped by file, the coverage tables. |
| `index-block.txt` | A hidden list of every test. It goes at the end of the summary so the next run can tell what is new. |

Read `digest.md`. Its first lines give **the file name this run must write** and
the previous summary. If it says any test failed, that changes what you write —
see rule 2.

#### 3. Group the new tests by what a person would recognise

The digest groups by file. **You must regroup by the part of the app a reader
knows**, and give each group a heading in their words. Some examples of the move
you are making:

| Digest says | Heading a reader understands |
|---|---|
| `proxy.ts` | Landing on the right language and country |
| `store/Cart/reducer.ts` | What the basket remembers |
| `utils/functions.tsx` (prices) | Showing the right price |
| `services/auth.ts` | Signing in and staying signed in |

Aim for **6 to 20 lines per area**. Over 20 and the reader loses the thread —
split it into two areas with their own headings rather than adding sub-headings
inside one.

The digest lists **only** tests of the app. Tests of the testing tools are given
as a count at the top of that section — carry that count into the summary's
one-line note (step 5 of the template) and never expand it into bullets.

#### 4. Rewrite each test as one `When … then …` line

**The shape is `When <the situation>, then <what happens>.`** — one line, one
sentence, full stop at the end. Use `and` to join two conditions or two outcomes.
Drop the id, the file and the mechanism. Say what a person would notice if it
broke.

| Test title in the digest | Line in the summary |
|---|---|
| `keeps ar when the address already names it` | When a visitor is already on the Arabic site, then they stay on it. |
| `refuses a saved country it does not support and uses the default gb` | When a saved country is one we do not serve, then the visitor gets the United Kingdom instead. |
| `prefers the saved country over the one the request appears to come from` | When a visitor has chosen a country before and arrives from another, then the chosen one wins. |
| `multiplies without the usual decimal drift` | When a price is converted, then it multiplies exactly and never drifts by a penny. |
| `RECORDED FINDING: a pair with a capital letter is permanently redirected…` | ⚠️ When an address is typed in capitals, then it is permanently redirected to small letters — recorded as it is today, not as we want it. |

Keep each line under about 110 characters so it fits on one line on screen. If it
will not fit, the wording is too technical — cut the mechanism, not the meaning.

Mark anything the tests **recorded rather than approved** with ⚠️ and say so — a
reader must not mistake "we pinned today's odd behaviour" for "this behaves
correctly".

#### 5. Write the coverage section

Keep this section small: the whole-app table, one line of file counts, the short
list of parts that have their own tests, and three bullets. **Do not copy the
digest's area-by-area table** — it is there to inform you, not the reader.

Use the digest's numbers exactly. It must carry **both** of these, in this order,
or it misleads:

- **The whole-app share** — the honest headline (lines covered out of all lines).
- **Where the checking is deep** — the short list of the files that have a test
  of their own.

Then **three short bullets, no more**: what is properly checked, what has nothing
yet, and what "covered" does not mean (a covered line was run by a test — that
does not prove the behaviour is right, and it says nothing about how the app
looks or feels). Never leave the headline number out because it looks bad, and
never leave the deep areas out because the headline looks bad.

#### 6. Write the file, then append the hidden index

Write the file **at the name the digest gave you** (create the folder if it is
missing). Then append the index — **never paste it by hand**:

```bash
cat <scratchpad>/index-block.txt >> docs/testing/summaries/<the name the digest gave>
```

#### 7. Count the lines before you call it done

Merging two similar tests into one line is the easiest mistake to make and the
hardest to spot. Count them:

```bash
F=docs/testing/summaries/<the name the digest gave>
grep -c '^- \(⚠️ \)\?When ' $F                 # must equal `new app tests` from the collector
grep '^- ' $F | grep -cv '^- \(⚠️ \)\?When '   # only the bullets under "Reading these numbers"
grep '^- ' $F | awk 'length>112' | wc -l       # must be 0 — any line this long is too technical
```

If the first count is short, you merged or dropped tests — find them and split
them back out before reporting. The tests of the testing tools are deliberately
not in that number.

### Part B — the browser (e2e) summary

#### 8. Collect the browser cases

```bash
node .claude/skills/test-summary/collect-e2e.mjs <scratchpad>
```

**This does not run the browser suite**, on purpose. That suite does a real
`next build`, drives real staging, takes minutes and registers real guests, so it
is run by hand with `pnpm test:e2e`. The collector reads the spec files instead,
and reports what the suite *contains*.

It writes:

| File | What it is |
|---|---|
| `e2e-digest.md` | The file name to write, the **new** cases with their `file:line`, the next free ids, the sections, and any recorded line numbers that have drifted. |
| `e2e-index-block.txt` | A hidden list of every case, for the end of the summary. |

Read `e2e-digest.md`. If it says `new cases 0`, stop here: report that the
browser suite has nothing new and write no browser file.

#### 9. Write one row per new case

Open `docs/testing/E2E_SCENARIOS.md` first and copy its shape. Each row is:

| Column | What goes in it |
|---|---|
| `ID` | The next free id the digest printed — `GUEST-36`, then `GUEST-37`, in order. |
| `Case` | The test title turned into a sentence: a capital letter at the start, no full stop, the situation and the outcome. |
| `Spec` | `` `<file>:<line>` `` exactly as the digest reports it — the current line, not the one in the doc. |
| `What it proves` | Why the case exists. Name the rule, the bug or the file it guards. This column is for an engineer. |

Turning a title into a `Case`:

| Title in the digest | `Case` |
|---|---|
| `the root path redirects to a country-and-language path` | The root path redirects to a country-and-language path |
| `a refused credential is exchanged, and the guest stays the same guest` | A refused credential is exchanged, and the guest stays the same guest |

Group the rows under the section the journey belongs to. If a new journey has no
section, add one with its own heading and start its ids at `01`.

If the digest lists **line numbers that no longer match**, report them to the
user. Do not rewrite them in `E2E_SCENARIOS.md` unless you are asked to.

#### 10. Write the browser file, then append the same rows to the doc

Write the file at the name `e2e-digest.md` gave you, then append the hidden
index:

```bash
cat <scratchpad>/e2e-index-block.txt >> docs/testing/summaries/<the name the digest gave>
```

Then add the **same rows, word for word** to `docs/testing/E2E_SCENARIOS.md`,
under the right section table. The two files must not disagree.

#### 11. Count the rows before you call it done

```bash
F=docs/testing/summaries/<the browser file>
grep -c '^| [A-Z]\+-[0-9]\+ |' $F              # must equal `new cases` from the collector
grep -c '^| [A-Z]\+-[0-9]\+ |' docs/testing/E2E_SCENARIOS.md   # must have grown by the same number
```

### 12. Report back

Say where **both** files are, how many unit tests and how many browser cases are
new, whether the unit run passed, and the coverage headline. Say plainly that the
browser file lists what the suite covers, and give a browser result only if the
suite was run and you saw it. Never commit unless asked.

## Template — the unit summary

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

## Template — the browser summary

````markdown
# New e2e scenarios — <19 August 2026>

The browser cases added since <the previous e2e summary, or "the scenarios doc was last written">.
The full list is `docs/testing/E2E_SCENARIOS.md`; these rows are already in it.

This file says what the suite covers. <It was last run on … and every case passed. |
It has not been run in this session, so it carries no result.>

## <Section heading, matching E2E_SCENARIOS.md>

| ID | Case | Spec | What it proves |
|----|------|------|----------------|
| <GUEST-36> | <Case in one line, no full stop> | `<file>:<line>` | <Why it exists> |
````

## Common mistakes

| Mistake | Fix |
|---|---|
| Overwriting today's earlier summary | Use the name the collector printed. A second run today is `-2`. |
| Copying test titles straight across into the unit file | Rewrite every one as `When … then …`. A title is written for a developer. |
| A line that states a fact but no situation | Every line needs both halves: the situation, then the result. |
| Sub-headings inside an area, or a paragraph explaining it | Cut them. Over 20 lines means split the area in two. |
| Headings named after files or folders | Name the part of the app a customer would recognise. |
| Leading with "92% covered" from one strong file | The headline is always the whole-app share. Depth comes after it. |
| Quietly leaving out a failing test | Failures go in the first line and in their own section. |
| Merging several tests into "we check the basket" | One line per test — that is what makes the file trustworthy. |
| Relisting tests or cases from an older summary | Only new ones get lines. The rest are a count. |
| Listing the checks on the sample data, the stand-ins or the fake network | Those are the testing tools. One line with the count, no bullets. |
| Writing the browser file in the manager's voice | Its reader opens the spec. Keep the path, the line and the rule it guards. |
| Saying the browser suite passed | The collector never ran it. Say what it covers, unless you ran it yourself. |
| Writing the browser rows and not adding them to `E2E_SCENARIOS.md` | The doc is the master list. Append the same rows there in the same edit. |
| Copying the drifted line number from the doc | The `Spec` column takes the line the collector found today. |
| Forgetting the hidden index | Without it the next run cannot tell what is new, and relists everything. |
