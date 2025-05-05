import NextLink from "components/global/NextLink";
import search from "services/search";

function Category({ data }) {
  return (
    <NextLink
      data={{
        is_category: true,
        ...data,
        href: `/boutique/listing${search.getPageUrl({
          term: "categories",
          value: [{ slug: data.category_slug }],
        })}`,
      }}
      ariaLabel={`notification Category ${data.category_slug}`}
      className="flex-col"
      href={`/boutique/listing${search.getPageUrl({
        term: "categories",
        value: [{ slug: data.category_slug }],
      })}}`}
      prefetch
    >
      <div className="regular p-2">{data?.showed_type}</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          <img width={20} height={20} src={data.image} />
        </div>
        <div
          className={`regular flex ml-2 boutique-desc-notification-${data.category_slug}`}
        >
          {data.description}
        </div>
      </div>
    </NextLink>
  );
}

export default Category;
