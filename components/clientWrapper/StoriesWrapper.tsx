import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";

function StoriesWrapper({ next_page_url, children, isRtl, stories }) {
  return (
    <HortiznalScrollBar
      id="stories-bar-container"
      className={`${
        isRtl && "flex-row-reverse"
      } flex h-full pl-[10px] gap-[15px] items-center`}
    >
      {children}
      {next_page_url && (
        <StoriesPaginationWrapper
          userData={null}
          next_page_url={next_page_url}
          initialStories={stories}
        />
      )}
    </HortiznalScrollBar>
  );
}

export default StoriesWrapper;
