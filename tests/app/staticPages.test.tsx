// The four static pages (about, contact, privacy policy, terms) and the compare
// page: each builds translated metadata with its own alternates, and renders
// one component.
import { describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({
  buildAlternates: vi.fn((lang: string, path: string) => ({ canonical: `/${lang}${path}` })),
}));

vi.mock("next/root-params", () => ({ lang: async () => "iq-ar" }));
vi.mock("serverRequests/meta/buildAlternates", () => ({
  buildAlternates: (lang: string, path: string) => spies.buildAlternates(lang, path),
}));
vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
  getRobotsConfig: (opts: unknown) => ({ robots: opts }),
}));
vi.mock("components/static/StaticPage", () => ({ default: () => null }));
vi.mock("components/global/compare", () => ({ default: () => null }));
vi.mock("components/skeleton/loaders/CompareSkeleton", () => ({ default: () => null }));

import StaticPage from "components/static/StaticPage";
import ComparePage from "components/global/compare";
import * as about from "app/(client)/[lang]/about/page";
import * as compare from "app/(client)/[lang]/compare/page";
import * as contact from "app/(client)/[lang]/contact/page";
import * as privacy from "app/(client)/[lang]/privacy-policy/page";
import * as terms from "app/(client)/[lang]/terms-of-service/page";

describe.each([
  ["about", about, "/about", "About TryDos"],
  ["contact", contact, "/contact", "Contact Us"],
  ["privacy policy", privacy, "/privacy-policy", "Privacy Policy"],
  ["terms", terms, "/terms-of-service", "Terms & Conditions"],
] as const)("the %s page", (name, page, path, title) => {
  it("builds translated, indexable metadata with its own alternates", async () => {
    const metadata: any = await page.generateMetadata();

    expect(metadata.title, `the ${name} title is not translated`).toBe(`ar:${title}`);
    expect(metadata.description, `the ${name} description is not translated`).toMatch(/^ar:/);
    expect(metadata.alternates, `the ${name} alternates do not point at ${path}`).toEqual({ canonical: `/iq-ar${path}` });
    expect(metadata.robots, `the ${name} page is not indexable`).toEqual({ robots: { index: true, follow: true } });
  });

  it("renders the static page with its title and sections in the locale", async () => {
    const tree: any = await page.default();

    expect(tree.type, `the ${name} page does not render the static page`).toBe(StaticPage);
    expect(tree.props.lang, `the ${name} page is not in the locale`).toBe("iq-ar");
    expect(tree.props.title, `the ${name} page has the wrong title`).toBe(title);
    expect(tree.props.sections.length > 0, `the ${name} page has no sections`).toBe(true);
  });
});

describe("the compare page", () => {
  it("builds translated metadata with the compare alternates", async () => {
    const metadata: any = await compare.generateMetadata();

    expect(metadata.title, "the compare title is not translated").toBe("ar:Compare Products - TryDos");
    expect(metadata.alternates, "the compare alternates are wrong").toEqual({ canonical: "/iq-ar/compare" });
  });

  it("renders the compare view without the instant loader", async () => {
    const tree: any = await compare.default();

    expect(tree.props.children.type, "the compare page does not render the compare view").toBe(ComparePage);
    expect(tree.props.children.props.showInstantLoading, "the compare view shows the instant loader").toBe(false);
  });
});
