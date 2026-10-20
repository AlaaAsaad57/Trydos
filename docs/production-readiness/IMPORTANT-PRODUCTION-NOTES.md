# IMPORTANT — Production notes

Settings that must be in place before the site goes to production. The owner handles these. They are not listed in the section files.

## Elasticsearch index names

The app reads every Elasticsearch index name from an environment value (`services/elastic/INDEXES.ts`). When a value is empty, the app falls back to the **staging** index. So production reads and writes staging data until all ten values are set.

| Environment value | Staging fallback | Used by |
|---|---|---|
| `ELASTIC_CATALOG_INDEX` | `products_catalog_develop` | home, search, listing and filters, compare search, sitemaps |
| `ELASTIC_VIEWS_INDEX` | `product_views_develop` | product page (view counts) |
| `ELASTIC_RECOMMENDATION_INDEX` | `recommended_system_develop` | home (recommended products) |
| `ELASTIC_RECOMMENDATION_COLD_INDEX` | `cold_start_recommendations_develop` | home (recommendations for new shoppers) |
| `ELASTIC_COMMENTS_INDEX` | `comments_develop` | reviews and questions, seller comments tab |
| `ELASTIC_PRODUCT_INTERACTIONS_INDEX` | `product_interactions_develop` | product likes and counts, seller social counts |
| `ELASTIC_USER_INTERACTIONS_INDEX` | `user_product_likes_develop` | product likes |
| `ELASTIC_COMMENTS_INTERACTIONS_INDEX` | `comments_reactions_develop` | comment likes, seller comments tab |
| `ELASTIC_SHARE_INDEX` | `shared_products` | product share counts |
| `ELASTIC_SEARCH_LOG_INDEX` | `search_logs_develop` | search history and trending searches (written on every search) |

- [ ] Set all ten values in the Vercel **production** environment. `.env.example` lists them.
- [ ] The production indexes must exist and be filled by a production backend first. The cluster has plain-name copies (`comments`, `comments_reactions`, `product_interactions`), but they are months old: the staging backends write only to the `_develop` names.
- [ ] Check the mapping of each production index against the `_develop` index it replaces.
- [ ] After the first production deploy, open a product, a listing and the search, and check that the data is production data.
