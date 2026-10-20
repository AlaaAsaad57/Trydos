// Every index name can be set from the environment, so staging and production
// read different data. The fallback is the staging name, so nothing changes
// until the production variables are set. This file is server-only: the names
// are read at module load, and the client never imports it.
const indexName = (envName: string, fallback: string) =>
  process.env[envName] || fallback;

export const catalog_index = indexName(
  "ELASTIC_CATALOG_INDEX",
  "products_catalog_develop",
);
export const views_index = indexName(
  "ELASTIC_VIEWS_INDEX",
  "product_views_develop",
);
export const recommendation_index = indexName(
  "ELASTIC_RECOMMENDATION_INDEX",
  "recommended_system_develop",
);
export const recommendation_cold_index = indexName(
  "ELASTIC_RECOMMENDATION_COLD_INDEX",
  "cold_start_recommendations_develop",
);
export const comments_index = indexName(
  "ELASTIC_COMMENTS_INDEX",
  "comments_develop",
);
export const product_interactions_index = indexName(
  "ELASTIC_PRODUCT_INTERACTIONS_INDEX",
  "product_interactions_develop",
);
export const user_interactions_index = indexName(
  "ELASTIC_USER_INTERACTIONS_INDEX",
  "user_product_likes_develop",
);
export const comments_interactions_index = indexName(
  "ELASTIC_COMMENTS_INTERACTIONS_INDEX",
  "comments_reactions_develop",
);
export const share_index = indexName("ELASTIC_SHARE_INDEX", "shared_products");
export const search_log_index = indexName(
  "ELASTIC_SEARCH_LOG_INDEX",
  "search_logs_develop",
);
