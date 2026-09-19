// The seed's failure messages.
//
// Separate from `qaSeed.ts` for one reason: `qaSeed.ts` imports Playwright, and
// a unit test cannot load Playwright. These functions are the part `AC-21`
// proves, so they live where the unit project can reach them. Nothing here
// imports anything.
//
// **They throw. They never return a flag and they never skip.**
//
// That is the whole point of the rule. A seed that finds its product missing and
// *skips* reports a green run in which nothing was checked — the silent pass this
// suite exists to prevent. A seed that throws reports a red run that names what
// was wrong with the product, which is a five-second answer instead of an
// afternoon.
//
// Every message names the QA product by **slug**, never by numeric id: the slug
// carries the `trydos-qa-` mark, so a reader of a public CI log can see at a
// glance that the failing row is test data and not a real seller's.

/** The three ways the QA product can be there but unusable. */
export type QaProductFault = "missing" | "inactive" | "out-of-stock";

/** Throw, naming the fault, the slug and what to do about it.
 *
 *  Never called with a real seller's slug — the seed only ever holds its own. */
export const failQaProduct = (
  fault: QaProductFault,
  shopSlug: string,
): never => {
  const where = `QA shop "${shopSlug}"`;

  switch (fault) {
    case "missing":
      throw new Error(
        [
          `The QA product was not found in ${where}.`,
          "",
          "The seed builds it on an environment that has none. Reaching this",
          "message means the seed decided the shop already existed and then",
          "could not find its product — so the shop is half-built.",
          "Look at the shop in the seller dashboard before running again.",
        ].join("\n"),
      );

    case "inactive":
      throw new Error(
        [
          `The QA product in ${where} exists but is not active.`,
          "",
          "An inactive product cannot be bought, so every BUY case would fail",
          "with a different and more confusing message.",
          "Activation needs: seller approved, an `en` translation, stock, a",
          "boutique, and colour images that have finished syncing.",
        ].join("\n"),
      );

    case "out-of-stock":
      throw new Error(
        [
          `The QA product in ${where} is active but has no stock.`,
          "",
          "The BUY cases each place a real order, so the stock runs down over",
          "time. Raise it in the seller dashboard.",
        ].join("\n"),
      );
  }
};

/** The message for a seed step that ran out of time.
 *
 *  Returns the text rather than throwing, because the caller adds it to an
 *  error it is already building around its own step name. */
export const qaDeadlineMessage = (step: string, seconds: number): string =>
  [
    `The QA seed gave up at step "${step}" after ${seconds}s.`,
    "",
    "The seed has a hard deadline so a stuck step fails the run with a name",
    "instead of being killed by the job timeout with none.",
  ].join("\n");

/** The message for an index that never caught up.
 *
 *  Kept here beside the others because it is the failure most often blamed on
 *  the wrong thing: an unset `QA_VIEW_SECRET` looks exactly like a slow index. */
export const qaIndexSyncMessage = (shopSlug: string, seconds: number): string =>
  [
    `The QA product from ${shopSlug} never appeared in the search index after ${seconds}s.`,
    "",
    "Two different causes look identical here:",
    "  1. the index really is behind — it usually takes 5 to 10 minutes;",
    "  2. QA mode is off, so the app is hiding the row from its own poll.",
    "",
    "Check the second first: QA mode needs QA_VIEW_SECRET set, at least 32",
    "characters, on the app being tested AND in the suite's environment.",
    "When it is unset the app logs `[qa-mode] QA mode is OFF` once at startup.",
  ].join("\n");
