import "styles/stories.css";
import dynamic from "next/dynamic";
import StoryElement from "./StoryElement";
import { useAppStore } from "store";
const AddStory = dynamic(() => import("../AddStory"), { ssr: false });

function Index() {
  const { storiesData, user } = useAppStore();
  return (
    <>
      {
        <div className="stories-bar-container flex h-[200px] items-center justify-start">
          <div id="stories-bar" className="stories-bar">
            <div className="stories-bars justify-start flex cursor-pointer items-center gap-[15px]">
              {user?.id && <AddStory />}

              {storiesData.map((story, index) => (
                <StoryElement
                  key={index}
                  index={index}
                  story={story}
                  userData={user}
                />
              ))}
            </div>
          </div>
        </div>
      }
    </>
  );
}

export default Index;
