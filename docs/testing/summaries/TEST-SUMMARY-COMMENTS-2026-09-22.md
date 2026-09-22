# Test summary — Questions, answers and likes — 22 September 2026

What the tests cover for comments: a shopper asking and liking, the seller
answering from the dashboard, and the ratings feed behind order reviews.

| | |
|---|---|
| Unit checks | 36 |
| Browser cases | 8 |
| Unit result | ✅ all 36 passing (run 22 Sep 2026) |
| Browser result | not run in this session — this file says what the suite covers |

---

## Browser cases (real staging)

| ID | Case | Spec |
|----|------|------|
| CMT-01 | The shopper likes the product and asks a question from both places | `comments.live.spec.ts:209` |
| CMT-02 | Both questions are edited and liked, and the edits survive a reload | `comments.live.spec.ts:290` |
| CMT-03 | The seller finds the product card and sees the shopper's like | `comments.live.spec.ts:417` |
| CMT-04 | The seller answers both questions | `comments.live.spec.ts:459` |
| CMT-05 | Both answers reach the shopper, who likes them | `comments.live.spec.ts:501` |
| CMT-06 | A reload keeps every question, edit, answer and like | `comments.live.spec.ts:581` |
| CMT-07 | Every like is removed, and a reload keeps them off | `comments.live.spec.ts:669` |
| CMT-08 | Both questions are deleted and the product unliked, and it sticks | `comments.live.spec.ts:750` |

---

## Unit checks

### The seller's Comments section — the two lists

- Opens on the questions, not the reviews.
- Shows the customer's question and who asked it.
- Asks for the reviews when the seller switches sub-tab.
- Says when there is nothing to answer.
- Shows an empty list when the comments backend refuses.
- Offers no reply on a review, even for a seller who may reply.

### Answering a question

- Marks an unanswered question as waiting.
- Opens an empty reply box for a question with no answer.
- Sends a new answer to the comments backend.
- Shows the new answer on the card straight away.
- Keeps the box open when the comments backend refuses the answer.
- Will not send an empty answer.

### An answer that already exists

- Shows the answer under the question, named as the shop's.
- Opens the edit box with the current answer in it.
- Sends a change as an edit, not as a new answer.
- Asks before deleting an answer, and does nothing if the seller says no.
- Deletes the answer and puts the question back to waiting.
- Keeps the answer on the card when the delete is refused.

### The permission gates and paging

- Hides Reply without the reply permission.
- Hides Edit Reply without the edit permission.
- Hides Delete Reply without the delete permission.
- Offers no Load More when the backend says this is the last page.
- Adds the next page to the list instead of replacing it.

### What the app remembers about comments

- A new list of comments is merged into the ones already held.
- Single fields of one comment can be changed on their own.
- A deleted comment is marked as deleted.
- A new question is put at the top of the product's list.

### The service that talks to the comments backend

- Reading questions asks for questions, not reviews.
- Reading reviews asks for reviews.
- Replying to a question sends a reply.
- Removing a reply sends a delete.

### The order-rating feed

- An options request is answered with no content.
- A request with no order items is refused.
- A request with no user is refused.
- A good request returns the ratings from search.
- A search failure is logged and reported as a server error.
