import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import CategoryHomeView from "components/Home/CategoryHomeView";
import { GetHomeMetaData, isValidCategorySlug } from "serverRequests/meta/home";
import { LogServerError } from "utils/serverErrorReporter";

// The slug is checked by SHAPE only, never against the category list (finding 2,
// Amendment 2). Checking against a list cached for 60 seconds would 404 a
// category the backend added a moment ago, which AC-15 forbids. A slug-shaped
// name the catalog does not know simply returns no products.
//
// The check still matters: the slug joins the cache key, the Redis metadata key
// and the OpenGraph url. Without it, anyone can create as many cache entries as
// they can send requests.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const lang = await langParam();
  const category = isValidCategorySlug(slug) ? slug : null;
  try {
    return await GetHomeMetaData({ local: lang, category });
  } catch (error) {
    LogServerError({ error, type: "meta" }, `/${lang}/categories/${category}`);
    // An empty object, not a copy of the home page's 40-line fallback: Next
    // merges it with the layout's metadata, so the page keeps the site title.
    return {};
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  if (!isValidCategorySlug(slug)) notFound();
  return <CategoryHomeView slug={slug} />;
}
