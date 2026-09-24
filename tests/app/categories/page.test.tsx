// The category page and its metadata. The slug shape gate itself is tested in
// ../categoryRoute.test.ts; this file checks the page applies it.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../../mocks/nextNavigation";

const spies = vi.hoisted(() => ({ GetHomeMetaData: vi.fn(), LogServerError: vi.fn() }));

vi.mock("next/root-params", () => ({ lang: async () => "sy-en" }));
vi.mock("serverRequests/meta/home", () => ({
  GetHomeMetaData: (...a: unknown[]) => spies.GetHomeMetaData(...a),
  isValidCategorySlug: (slug: string) => /^[a-z-]+$/.test(slug),
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: (...a: unknown[]) => spies.LogServerError(...a) }));
vi.mock("components/Home/CategoryHomeView", () => ({ default: () => null }));

import CategoryHomeView from "components/Home/CategoryHomeView";
import CategoryPage, { generateMetadata } from "app/(client)/[lang]/categories/[slug]/page";

const args = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.clearAllMocks();
  spies.GetHomeMetaData.mockResolvedValue({ title: "Shoes" });
});

describe("the category page metadata", () => {
  it("asks for the category metadata for a valid slug", async () => {
    expect(await generateMetadata(args("shoes")), "the category metadata was not returned").toEqual({ title: "Shoes" });
    expect(spies.GetHomeMetaData, "the metadata was not asked for this category").toHaveBeenCalledWith({
      local: "sy-en",
      category: "shoes",
    });
  });

  it("asks for no category when the slug has the wrong shape", async () => {
    await generateMetadata(args("../etc"));

    expect(spies.GetHomeMetaData.mock.calls[0][0].category, "a bad slug reached the metadata key").toBeNull();
  });

  it("returns empty metadata and reports when the build fails", async () => {
    spies.GetHomeMetaData.mockRejectedValue(new Error("meta down"));

    expect(await generateMetadata(args("shoes")), "a failed build did not return empty metadata").toEqual({});
    expect(spies.LogServerError.mock.calls[0][1], "the failure was not filed under the category").toBe(
      "/sy-en/categories/shoes",
    );
  });
});

describe("the category page", () => {
  it("renders the category view for a valid slug", async () => {
    const tree: any = await CategoryPage(args("shoes"));

    expect(tree.type, "the page did not render the category view").toBe(CategoryHomeView);
    expect(tree.props.slug, "the category view got the wrong slug").toBe("shoes");
  });

  it("answers not-found for a slug with the wrong shape", async () => {
    await expect(CategoryPage(args("../etc")), "a bad slug was rendered").rejects.toThrow();

    expect(navigationSpies.notFound, "a bad slug did not answer not-found").toHaveBeenCalled();
  });
});
