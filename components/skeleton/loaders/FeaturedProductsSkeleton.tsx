import Skeleton from "react-loading-skeleton";

function FeaturedProductsSkeleton() {
  return (
    <div className="flex-col px-[12px] flex items-start max-w-full w-full mt-[10px]">
      <a
        className="flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-xs rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d]"
        data-cy=""
        href="/sy-en/featured"
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            width="20px"
            height="20px"
            viewBox="0 0 30 30"
          >
            <path d="M22.005 0c-.194-.002-.372.105-.458.276l-2.197 4.38-4.92.7c-.413.06-.578.56-.278.846l3.805 3.407-.953 4.81c-.07.406.363.715.733.523L22 12.67l4.286 2.273c.37.19.8-.118.732-.522l-.942-4.81 3.77-3.408c.3-.286.136-.787-.278-.846l-4.916-.7-2.2-4.38C22.368.11 22.195.002 22.005 0zM22 1.615l1.863 3.71c.073.148.216.25.38.273l4.168.595-3.227 2.89c-.12.112-.173.276-.145.436l.813 4.08-3.616-1.927c-.147-.076-.322-.076-.47 0l-3.59 1.926.823-4.08c.028-.16-.027-.325-.145-.438l-3.262-2.89 4.166-.594c.165-.023.307-.125.38-.272zM16.5 18c-.822 0-1.5.678-1.5 1.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5zM1.5 3C.678 3 0 3.678 0 4.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5zm0 14c-.822 0-1.5.678-1.5 1.5v9c0 .822.678 1.5 1.5 1.5h9c.822 0 1.5-.678 1.5-1.5v-9c0-.822-.678-1.5-1.5-1.5zm0 1h9c.286 0 .5.214.5.5v9c0 .286-.214.5-.5.5h-9c-.286 0-.5-.214-.5-.5v-9c0-.286.214-.5.5-.5z"></path>
          </svg>
        </span>
        <span className="ml-[12px]  ">
          <Skeleton width={60} height={13} />
        </span>
      </a>
      <div
        id="featured-products-container"
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] horizntal-scroll overflow-x-scroll overflow-y-hidden whitespace-nowrap [&amp;&gt; *]: select-none [&amp;::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        data-cy="featured-products-container"
      >
        {Array.from({ length: 6 }).map((s, key) => (
          <div className="relative flex" key={key}>
            <div
              className="max-h-[377px] relative"
              data-cy="product-card-flash-deal"
            >
              <a
                className="product-container  align-center flex-col relative pb-[12px]"
                data-cy="product_link"
                href="/sy-en/products/women-pleated-1?color=Black"
              >
                <Skeleton width={200} borderRadius={15} height={377} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedProductsSkeleton;
