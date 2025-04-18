"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "store";
function ProductToOldCart({ data }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enableCart } = useAppStore();
  const openCart = () => {
    window.history.pushState({ isPopup: true }, "open Cart");
    enableCart(true);

    const newParams = new URLSearchParams(searchParams);
    newParams.set("cart", "true");

    // Use router.push with pathname and updated query
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    router.push(`${pathname}?${newParams.toString()}`, { shallow: true });
  };
  return (
    <div className="flex-col" onClick={() => openCart()}>
      <div className="regular p-2">{data.showed_type}</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          <img width={20} height={20} src={"svg/CartIcon.svg"} />
        </div>
        <div className={`regular inline ml-2 boutique-desc-notification`}>
          {data.description}
        </div>
      </div>
    </div>
  );
}

export default ProductToOldCart;
