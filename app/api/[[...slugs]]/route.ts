import { Elysia, t } from "elysia";
// import {
//   NormalizeSearchParamsForSearchRequest,
//   parseNumberArray,
// } from "lib/searchParamsNormilze";
// import {
//   getProductsAndFiltersFromElastic,
//   GetRecomendationsForUser,
// } from "services/elastic/elasticSearch";
// import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
// import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
// import {
//   LOG_IN_CHAT_ENDPOINT,
//   LOG_IN_COMMENTS_ENDPOINT,
//   LOG_IN_STORIES_ENDPOINT,
//   VERIFY_OTP_ENDPOINT,
// } from "utils/fetch/Endpoints";
// let Reader = new ElasticsearchReader();

export const app = new Elysia({ prefix: "/api" }).get("", () => {
  return "Trydos API is running";
});

export const GET = app.fetch;
export const POST = app.fetch;
export type AppType = typeof app;
