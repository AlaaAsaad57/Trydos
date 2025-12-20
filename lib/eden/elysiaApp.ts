import { Elysia, t } from "elysia";
import {
  NormalizeSearchParamsForSearchRequest,
  parseNumberArray,
} from "lib/searchParamsNormilze";
import {
  getProductsAndFiltersFromElastic,
  GetRecomendationsForUser,
} from "services/elastic/elasticSearch";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import {
  LOG_IN_CHAT_ENDPOINT,
  LOG_IN_COMMENTS_ENDPOINT,
  LOG_IN_STORIES_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
} from "utils/fetch/Endpoints";

export const app = new Elysia({ prefix: "/api" })
  .get("/home/mainCategories", async ({ headers: { language, country } }) => {
    // let start = process.hrtime.bigint();
    let Reader = new ElasticsearchReader();
    let a = await Reader.getCategories({ country: country, size: 4000 });
    // @ts-ignore

    let mainCategories = a.hits.hits.map((s) => {
      // @ts-ignore
      return s._source?.custom_categories?.find(
        (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase()
      );
    });
    mainCategories = mainCategories.filter((c) => c !== undefined);
    mainCategories = Array.from(
      new Map(mainCategories.map((c: any) => [c.id, c])).values()
    );
    return {
      data: {
        mainCategories: mainCategories.map((category: any) => ({
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
    let limit = parseInt((query.limit as string) || "10");
    let offset = query.offset as string;
    let category_slug = query.category_slugs as string;
    if (typeof category_slug === "string") {
      let categorySlg = JSON.parse(category_slug);
      if (Array.isArray(categorySlg) && categorySlg.length > 0) {
        category_slug = categorySlg?.[0];
      }
    }
    let Reader = new ElasticsearchReader();
    const boutiquesResponse = await Reader.getBoutiques({
      country,
      language,
      limit,
      category: category_slug as any,
      searchAfter: offset ? JSON.parse(offset.toString()) : null,
    });

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
      const userId = query.user_id as string;
      const limit = parseInt((query.limit as string) || "20");
      const offset = query.offset as string;
      let result = await GetRecomendationsForUser({
        country: country,
        language: language,
        limit: limit,
        userId: userId,
        search_after: parseNumberArray(offset),
      });
      return {
        data: result,
      };
    }
  )
  .get(
    "/products/featured",
    async ({ headers: { language, country }, query }) => {
      const limit = parseInt((query.limit as string) || "20");
      const offset = query.offset as string;
      let filters = NormalizeSearchParamsForSearchRequest({
        searchParams: query,
        isFeatured: true,
        isFlashDeal: false,
      });
      const params = {
        limit: Number(limit),
        search_after: parseNumberArray(offset),
        filters,
        filters_offset: Number(query.filters_offset) || 1,
        country,
        language_code: language,
      };
      let result = await getProductsAndFiltersFromElastic(params);
      return {
        data: result,
        appliedFilters: filters,
      };
    }
  )
  .get(
    "/products/flashdeal",
    async ({ headers: { language, country }, query }) => {
      const limit = parseInt((query.limit as string) || "20");
      const offset = query.offset as string;
      let filters = NormalizeSearchParamsForSearchRequest({
        searchParams: query,
        isFeatured: false,
        isFlashDeal: true,
      });
      const params = {
        limit: Number(limit),
        search_after: parseNumberArray(offset),
        filters,
        filters_offset: Number(query.filters_offset) || 1,
        country,
        language_code: language,
      };
      let result = await getProductsAndFiltersFromElastic(params);
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
      const verificationId = query.verificationId as string;
      const otp = query.otp as string;
      const name = query.name as string;
      if (!verificationId || !otp) {
        set.status = 422;
        return {
          error: "Bad Request",
          message: "Missing required query parameters",
        };
      }
      let newSearchParams = new URLSearchParams();
      newSearchParams.append("verificationId", verificationId);
      newSearchParams.append("otp", otp);
      if (name && name?.length > 0) {
        newSearchParams.append("name", name);
      }
      let url =
        process.env.NEXT_PUBLIC_BACKEND_URL +
        VERIFY_OTP_ENDPOINT +
        `?${newSearchParams.toString()}`;
      let fetch_req = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Authorization}`,
          country: country,
          language: language,
        },
        credentials: "omit",
      });
      let otp_response = await fetch_req.json();

      if (fetch_req.status !== 200) {
        set.status = 422;
        return { ...(otp_response ?? {}), request: VERIFY_OTP_ENDPOINT };
      }
      let MainToken = otp_response.data.token;
      let idToken = otp_response?.data?.id_token;
      let InventoryUser = {
        ...otp_response.data.user,
        already_exists: otp_response.data.already_exists,
      };

      const [chatLoginResponse, StoriesLoginResponse, CommentLoginResponse] =
        await Promise.all([
          fetch(
            process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + LOG_IN_CHAT_ENDPOINT,
            {
              method: "POST",
              body: JSON.stringify({
                otp_id_token: idToken,
                mobile_phone: InventoryUser.phone,
                name: name || InventoryUser.name,
                original_user_id: InventoryUser.id,
              }),
              credentials: "omit",
            }
          ),
          fetch(
            process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
              LOG_IN_STORIES_ENDPOINT,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                otp_id_token: idToken,
                mobile_phone: InventoryUser.phone,
              }),
              credentials: "omit",
            }
          ),
          fetch(
            process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL +
              LOG_IN_COMMENTS_ENDPOINT,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: String(InventoryUser.id),
                phone: String(InventoryUser.phone),
                id_token: idToken,
              }),
              credentials: "omit",
            }
          ),
        ]);
      let is_failed = [];
      let [chat_response, stories_response, comment_response] =
        await Promise.all([
          chatLoginResponse.json(),
          StoriesLoginResponse.json(),
          CommentLoginResponse.json(),
        ]);

      if (chatLoginResponse.status !== 200) {
        is_failed.push({
          ...(chat_response ?? {}),
          request: LOG_IN_CHAT_ENDPOINT,
          status: StoriesLoginResponse.status,
        });
      }
      if (StoriesLoginResponse.status !== 200) {
        is_failed.push({
          ...stories_response,
          request: LOG_IN_STORIES_ENDPOINT,
          status: chatLoginResponse.status,
        });
      }
      if (CommentLoginResponse.status !== 200) {
        is_failed.push({
          ...comment_response,
          request: LOG_IN_COMMENTS_ENDPOINT,
          status: CommentLoginResponse.status,
        });
      }

      let ChatUser = chat_response?.data ?? null;
      let StoriesUser = stories_response?.data ?? null;
      let ChatToken = chat_response?.data?.access_token ?? null;
      let StoriesToken = stories_response?.data?.access_token ?? null;
      let CommentToken = comment_response?.comments_token ?? null;
      let finalResponse = {
        ...otp_response,
        ChatUser,
        StoriesUser,
      };
      if (is_failed?.length) {
        finalResponse = { ...finalResponse, is_failed };
      }
      const tokenCookies = [
        { name: COOKIE_NAMES.MARKET_TOKEN, value: MainToken },
        { name: COOKIE_NAMES.CHAT_TOKEN, value: ChatToken },
        { name: COOKIE_NAMES.STORIES_TOKEN, value: StoriesToken },
        { name: COOKIE_NAMES.USER_ID_HASH, value: CommentToken },
      ];
      tokenCookies.forEach((token) => {
        const c = cookie[token.name];

        c.value = token.value;
        c.httpOnly = false;
        c.sameSite = "strict";
        c.secure =
          process.env.VERCEL_ENV === "production" ||
          process.env.VERCEL_ENV === "preview";
        c.path = "/";
        c.maxAge = 60 * 60 * 24 * 365; // 1 year
      });
      return finalResponse;
    }
  );

// .post(
//   "/",
//   ({ body }) => {
//     // Echo back parsed JSON body
//     return { received: body };
//   },
//   {
//     // Validate body: require a JSON object with a string `name` property
//     body: t.Object({ name: t.String() }),
//   }
// );

// Export handlers so Next’s app router invokes Elysia

export type AppType = typeof app;
