import Skeleton from "react-loading-skeleton";

function MobileNavigationSkeleton() {
  return (
    <div
      id="categories-bar-container"
      className="categories-bar-container m-0 max-w-[900px] pl-2 pr-2 overflow-x-scroll overflow-y-hidden min-h-[47px] bg-white pt-2 z-10 whitespace-nowrap flex  false flex-row false horizntal-scroll  [&amp;&gt; *]: select-none  [&amp;::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      data-pw="categoryNavBar"
    >
      {Array.from({ length: 10 }).map((s, key) => (
        <div className="flex" key={key}>
          <a
            className="categories-bar-item   cursor-pointer flex flex-col relative w-auto max-w-full justify-start mx-[5px] items-center false"
            data-pw="category-Link"
          >
            <div
              className="categories-bar-item-icon flex h-auto w-full justify-center"
              data-pw="categoryIcons"
            >
              <Skeleton
                containerClassName="flex justify-center items-center"
                width={25}
                height={25}
                borderRadius={"50%"}
              />
            </div>
            <div className="categories-bar-item-description flex-row  items-end  justify-start w-auto mt-[4px] h-auto">
              <div className="categories-bar-item-name max-w-[60px] truncate items-center text-[#3c3c3c] text-[10px]  regular  capitalize block">
                <Skeleton width={46} height={12} borderRadius={4} />
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}

export default MobileNavigationSkeleton;
