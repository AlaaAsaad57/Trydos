export const runtime = "nodejs";
import { Elysia, t } from "elysia";

// Initialize Elysia app with prefix /api
export const app = new Elysia({ prefix: "/api" })
  .get("/home/mainCategories", async ({ headers }) => {
    const { language = "en", country = "US" } = headers;

    // Replace [] with real categories from DB later
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
  .get("/home/boutiques", async ({ headers, query }) => {
    const { language = "en", country = "US" } = headers;

    const limit = 20;
    const category_slug = null;

    const boutiquesResponse = {
      boutiques: [],
      limit: 10,
      searchAfter: null,
      category_slug: null,
    };

    return {
      data: {
        total: boutiquesResponse.boutiques.length,
        limit,
        searchAfter: boutiquesResponse.searchAfter,
        offset: boutiquesResponse.searchAfter,
        boutiques: boutiquesResponse.boutiques,
        category_slug,
      },
    };
  })
  .get("/products/recommended", async ({ headers, query }) => {
    const result = {};
    return { data: result };
  })
  .get("/products/featured", async ({ headers, query }) => {
    const result = {};
    const filters = {};
    return { data: result, appliedFilters: filters };
  })
  .get("/products/flashdeal", async ({ headers, query }) => {
    const result = {};
    const filters = {};
    return { data: result, appliedFilters: filters };
  })
  .post("/auth/login", async ({ headers, body, cookie, set }) => {
    // Example login logic placeholder
    const finalResponse = {};
    return finalResponse;
  });

// Export Elysia fetch handlers for Next.js App Router
export const GET = app.fetch;
export const POST = app.fetch;

// Export app type for treaty
export type AppType = typeof app;
