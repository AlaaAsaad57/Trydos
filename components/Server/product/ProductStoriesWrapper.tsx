import ProductStories from "components/products/ProductStories";
import { GetProductStoriesData } from "serverRequests/product";

import { translateFunction } from "utils/server";

async function ProductStoriesWrapper({ globalPromise, language }) {
  let [product] = await Promise.all([globalPromise]);

  let stories = await GetProductStoriesData({ page: 1, productId: product?.id });
  if (stories.data.length === 0) return <></>;
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`product-colors pr-0 product-stories flex-col  align-start relative mt-[12px] bg-transparent ${
        isRtl && "items-end"
      }`}
    >
      <div
        className={`colors-label flex-col text-[#1d1d1d] regular text-[11px] gap-[4px] ${
          isRtl && "items-end"
        }`}
      >
        <img src="/icons/StoreisIcon.svg" className="w-[30px] h-[30px]" data-pw="StoriesIcon" />
        <div className="flex-row gap-[11px] items-baseline">
          <span>{translateFunction("Product Story", language)}</span>
          <svg
            id="Group_14553"
            data-name="Group 14553"
            xmlns="http://www.w3.org/2000/svg"
            width="9.996"
            height="9.996"
            viewBox="0 0 9.996 9.996"
          >
            <path
              id="Subtraction_1"
              data-name="Subtraction 1"
              d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
              transform="translate(0 1.969)"
              fill="#c4c2c2"
            />
            <path
              id="Path_21380"
              data-name="Path 21380"
              d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
              transform="translate(-0.332 0.375)"
              fill="#c4c2c2"
            />
            <rect
              id="Rectangle_4714"
              data-name="Rectangle 4714"
              width="9.61"
              height="9.996"
              transform="translate(0.386)"
              fill="none"
            />
          </svg>
        </div>
      </div>
      <ProductStories
        id={product?.id}
        InitialStoriesData={stories.data}
        initialStories={stories.stories}
      />
    </div>
  );
}

export default ProductStoriesWrapper;
