"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { encode_utf8 } from "utils/functions";

function Boutique({ data }) {
  useEffect(() => {
    encode_utf8({
      element: document.querySelectorAll(
        `.boutique-desc-notification-${data.boutique_slug}`
      ),
      s: data.description,
    });
  }, []);
  const { lang } = useParams();
  return (
    <NextLink
      data={{
        is_boutique: true,
        ...data,
        href: `/${lang}/boutique/${data.boutique_slug}`,
      }}
      ariaLabel={`Boutique ${data.boutique_slug} ${lang}`}
      className="flex-col"
      href={`/${lang}/boutique/${data.boutique_slug}`}
      prefetch
    >
      <div className="regular p-2">{data?.showed_type}</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          {data.boutique_icon?.file_path && (
            <img width={20} height={20} src={data.boutique_icon?.file_path} />
          )}
        </div>
        <div
          className={`regular flex ml-2 boutique-desc-notification-${data.boutique_slug}`}
        ></div>
      </div>
    </NextLink>
  );
}

export default Boutique;
