import Skeleton from "react-loading-skeleton";

function StoriesSkeleton() {
  return (
    <div
      data-pw="stories-skeleton"
      className=" stories-bar-container h-[183px] items-center flex w-full z-99999999 max-w-[1365px] justify-start"
    >
      <div
        id="stories-bar"
        className="stories-bar  w-full h-[183px] items-center flex justify-start false"
      >
        
        <div
          id="stories-bar-container"
          className="false flex h-full pl-[10px] gap-[15px] items-center horizntal-scroll overflow-x-scroll overflow-y-hidden whitespace-nowrap [&amp;&gt; *]: select-none [&amp;::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {[1, 1, 1, 1, 1, 1, 1, 1, 1].map((story, index) => (
            <div
              className="relative w-[100px] h-[150px] rounded-[20px] flex"
              key={index}
            >
              <div
                className="shadow-[0_3px_6px_rgba(0,0,0,0.2)] rounded-[20px]"
                data-pw="story-element"
              >
                <div className="relative w-[100px] h-[150px] rounded-[20px] flex">
                  <Skeleton
                    width={100}
                    key={index}
                    height={150}
                    borderRadius={20}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StoriesSkeleton;
