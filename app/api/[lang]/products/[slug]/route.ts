import { NextRequest, NextResponse } from "next/server";
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}
export async function GET(
  req: NextRequest,
  { params }: { params: { lang: string; slug: string } }
) {
  const [country, lang] = params.lang.split("-");
  const slug = params.slug;
  let [resp1, resp2] = await Promise.all([
    getProductSimpleDetails({ slug, lang, country }),
    getProductExtendedDetails({ slug, lang, country }),
  ]);
  return NextResponse.json(
    { ...resp1.data, ...resp2.data },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Cache on the edge for 1hr
      },
    }
  );
}
const getProductSimpleDetails = async ({
  slug,
  lang,
  country,
}: {
  slug: string;
  lang: string;
  country: string;
}) => {
  let response;
  try {
    response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/product/globalDetails" +
        `/${slug}?lang=${lang}`,
      {
        method: "GET",

        next: {
          revalidate: parseInt(
            process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS
          ),
          tags: [
            `product-details product-simple-details-${slug}-${country}-${lang}`,
          ],
        },
        headers: new Headers({
          lang: lang,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );
    let data = await response.json();

    return data;
  } catch (error) {
    console.log(error, "getProductSimpleDetails", response);
    return {};
  }
};
const getProductExtendedDetails = async ({
  slug,
  lang,
  country,
}: {
  slug: string;
  lang: string;
  country: string;
}) => {
  let response;
  try {
    response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/web/product/qtyPriceDetails" +
        `/${slug}?lang=${lang}`,
      {
        method: "GET",

        next: {
          revalidate: parseInt(
            process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS
          ),
          tags: [`product-details product-details-${slug}-${country}-${lang}`],
        },
        headers: new Headers({
          lang: lang,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );
    let data = await response.json();

    return data;
  } catch (error) {
    console.log(error, "getProductExtendedDetails", response);
    return {};
  }
};
