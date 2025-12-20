export const runtime = "nodejs";
import { Elysia, t } from "elysia";

export const app = new Elysia({ prefix: "/api" })
  .get("/home/mainCategories", async ({ headers: { language, country } }) => {
    // let start = process.hrtime.bigint();

    return {
      data: {
        mainCategories: [].map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          flat_photo_path: category.flat_photo_path,
          outline_photo_path: category.outline_photo_path,
          fill_photo_path: category.fill_photo_path,
        })),
      },
    };
  })
  .get("/home/boutiques", async ({ headers: { language, country }, query }) => {
    let limit = 20;
    let category_slug = null;
    let boutiquesResponse = {
      boutiques: [],
      limit: 10,
      searchAfter: null,
      category_slug: null,
    };
    return {
      data: {
        total: boutiquesResponse.boutiques?.length || 0,
        limit,
        searchAfter: boutiquesResponse.searchAfter,
        offset: boutiquesResponse.searchAfter, // Use searchAfter as offset, like home page
        boutiques: boutiquesResponse.boutiques || [],
        category_slug,
      },
    };
  })
  .get(
    "/products/recomended",
    async ({ headers: { language, country }, query }) => {
      let result = {};
      return {
        data: result,
      };
    }
  )
  .get(
    "/products/featured",
    async ({ headers: { language, country }, query }) => {
      let result = {},
        filters = {};
      return {
        data: result,
        appliedFilters: filters,
      };
    }
  )
  .get(
    "/products/flashdeal",
    async ({ headers: { language, country }, query }) => {
      let result = {},
        filters = {};

      return {
        data: result,
        appliedFilters: filters,
      };
    }
  )
  .get(
    "/auth/login",
    async ({
      headers: { language, country, Authorization },
      query,
      set,
      cookie,
    }) => {
      let finalResponse = {};
      return finalResponse;
    }
  );

export const GET = app.fetch;
export const POST = app.fetch;
export type AppType = typeof app;
