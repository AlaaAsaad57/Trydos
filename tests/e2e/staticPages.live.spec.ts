// Static "trust" pages: About, Contact, Privacy Policy, Terms of Service.
//
// These pages carry no catalogue data and no user state, so they are the
// cheapest live journeys after the home-page smoke test. The whole point is to
// prove that a plain server-rendered page with translations and a back bar
// renders and hydrates without throwing, and that the shared layout behaves the
// same way on every static page.

import { expect, test } from "./fixtures";
import { gotoStaticPage } from "./actions/nav";
import { nav, staticPage } from "./selectors";

test.describe("static trust pages", () => {
  test("the about page renders its title and back bar", async ({ page }) => {
    const { title } = await gotoStaticPage(page, { slug: "about" });

    // English is seeded above and the English source string is the key, so
    // this is the exact copy the page should show.
    expect(title, "a different page loaded").toBe("About TryDos");
    await expect(staticPage.backButton(page)).toBeVisible();
    await expect(nav.logo(page)).toBeVisible();
  });

  test("the contact page renders without errors", async ({ page }) => {
    const crashes: string[] = [];
    page.on("pageerror", (error) => crashes.push(error.message));

    const { title } = await gotoStaticPage(page, { slug: "contact" });

    expect(title, "a different page loaded").toBe("Contact Us");
    await expect(staticPage.container(page)).toBeVisible();
    expect(crashes, "the page threw while rendering").toEqual([]);
  });

  test("the privacy policy page renders without errors", async ({ page }) => {
    const crashes: string[] = [];
    page.on("pageerror", (error) => crashes.push(error.message));

    // The locale-less path is the interesting one here: `/privacy-policy` used
    // to be read as country "privacy" + language "policy" and dropped, and the
    // route that guards that is GUEST-36 in `locale.live.spec.ts`.
    const { title } = await gotoStaticPage(page, { slug: "privacy-policy" });

    expect(title, "a different page loaded").toBe("Privacy Policy");
    await expect(staticPage.container(page)).toBeVisible();

    expect(crashes, "the page threw while rendering").toEqual([]);
  });

  test("the terms of service page renders without errors", async ({ page }) => {
    const crashes: string[] = [];
    page.on("pageerror", (error) => crashes.push(error.message));

    const { title } = await gotoStaticPage(page, { slug: "terms-of-service" });

    expect(title, "a different page loaded").toBe("Terms & Conditions");
    await expect(staticPage.container(page)).toBeVisible();
    expect(crashes, "the page threw while rendering").toEqual([]);
  });

  test("the back button on a static page keeps the visitor in the app", async ({
    page,
  }) => {
    await gotoStaticPage(page, { slug: "about" });

    const back = staticPage.backButton(page);
    await expect(back).toBeVisible();
    await back.click();

    // The back bar is given /[lang]/settings as its previous page, and a page
    // opened directly has no history to go back to, so that push is what runs.
    await expect(page).toHaveURL(/\/[a-z]{2}-[a-z]{2}\/settings$/);
  });
});
