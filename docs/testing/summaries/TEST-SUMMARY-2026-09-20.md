# Test summary — 20 September 2026

**This summary covers one piece of work only: making the automated tests safe to run on a real environment. Everything in it passes.**

| | |
|---|---|
| **New checks added this time** | 51 |
| **Checks in the app in total** | 2926 |
| **Result** | ✅ All passing |
| **How much of the app is checked** | 30.8% of the code |
| **Date** | 2026-09-20 |

> **Scope note.** This file deliberately covers **only this piece of work**. Other
> work has added checks since the last summary on 3 September; those are counted
> in the total above but are not listed here and have not been written up yet.

---

## Why this work was needed

Every night our automated shopping tests picked **a real seller's product and bought it**. Real orders, on real products, that nobody asked for. And any test data we created would have shown to real customers like any other shop.

The tests now own their own shop and their own product, and the app hides that shop from customers everywhere they could find it.

---

## What we checked this time

### Keeping the test shop out of search and browsing

- When a customer searches the shop, then results from the test shop are left out.
- When our own tests search with their secret key, then the test shop's products are found.
- When nobody says either way, then the test shop is left out — the safe answer is the default.
- When the test shop's name was saved with capital letters, then it is still left out.
- When a real seller's shop looks similar, then it is still shown as normal.
- When a customer browses a category listing, then the test shop's products are left out.
- When the app suggests products you might like, then the test shop's products are left out.

### Keeping the test shop out of the shop list

- When the shop list is built for a customer, then the test shop is left out.
- When our own tests ask with their key, then the test shop appears.
- When nobody says either way, then the test shop is left out.
- When the rule is written, then it is written as "leave this out" and never as "show only this".
- When somebody opens a single shop's page, then a test shop is still left out.

### Keeping the test shop out of Google

- When the list of product pages for search engines is built, then test products are left out.
- When the list of country and language pages is built, then test products cannot add one.

### Keeping test stories out of the feed

- When a feed holds one test story among real ones, then only the test story is removed.
- When the feed is saved for the screen to read, then the saved copy has the test story removed too.
- When somebody's only story was a test one, then that person is removed from the bar entirely.
- When a story has a broken or missing web link, then it is kept and nothing breaks.
- When a real story's link merely mentions the test address, then it is kept.
- When the app reads stories on the phone-sized home bar, then a test story never appears.
- When more stories load as you scroll, then a test story never appears.
- When any of the four places that read stories is checked, then each one uses the shared filter.

### The secret key that lets our tests see their own data

- When the key is missing, then the app behaves exactly as it does for a customer.
- When the key is too short to be real, then the app ignores it.
- When an error report is sent, then the key is removed from it first.
- When the tests write anything to a log, then the key is replaced with its name, never its value.
- When a part of the app that saves its answers for speed is checked, then it never reads the key.
- When the saved-answers check runs on the second such part, then it never reads the key.
- When it runs on the third, then it never reads the key.

### Stopping the tests running against the wrong environment

- When the address of a known test environment is checked, then it is recognised.
- When an address nobody approved is checked, then it is refused.
- When the address is blank, then it is refused.
- When an address is written in different capitals or with extra spaces, then it is still recognised.
- When the environment is a known test one, then the whole test suite is allowed to run.
- When the environment is not recognised, then only the tests that cannot harm data run.
- When the address cannot be read at all, then only the safe tests run.
- When no address is set, then only the safe tests run.
- When an address mentions a test environment only in its path, then it is still treated as unknown.

### Telling us clearly when the test product is unusable

- When the test product is missing, then the run fails and says it is missing.
- When the test product is switched off, then the run fails and says it is switched off.
- When the test product has no stock, then the run fails and says it has run out.
- When any of those three happens, then each one gives a different message.
- When the message is written, then it names the shop so a reader can see it is test data.

### Two faults we found in the live app and fixed

- ⚠️ When a seller sign-up failed, then their password went to our error tracker readable — now removed first.
- When a password is sent for any other reason, then it is still removed, as it always was.
- When an ordinary piece of information is sent, then it is left readable so the report is still useful.
- ⚠️ When a seller typed too long a location name, then they got no warning until saving — now warned first.
- When a seller types a first name that is too long, then the form warns them.
- When a seller types a last name that is too long, then the form warns them.
- When a seller types a shop name that is too long, then the form warns them.
- When a seller types a shop address, then the form does not limit it, because the shop does not.

Another 188 checks keep the testing setup itself honest — they protect the tests, not the app,
so they are counted but not listed.

---

## How much of the app is checked

| Measure | Covered | Total | Share |
|---|---|---|---|
| Lines of code | 8697 | 28276 | 30.8% |
| Decision points | 6885 | 25590 | 26.9% |
| Functions | 1845 | 7156 | 25.8% |

### Reading these numbers

- **What is checked well:** the rules deciding what a customer can find, each checked on its own.
- **What has nothing yet:** most screens. These checks are about what the app decides, not how it looks.
- **What "checked" does not mean:** a checked line is one a test ran. It does not prove the behaviour is right.
