import "styles/stories.css";
import dynamic from "next/dynamic";
import StoryElement from "./StoryElement";
const AddStory = dynamic(() => import("../AddStory"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { SelectStory } from "store/homepage/actions";
import { Story } from "models/story";
import Skeleton from "react-loading-skeleton";
import { Sendevent } from "utils/functions";

function Index() {
  const storiesData = useSelector(
    (state: StateInterface) => state.homepage.storiesData
  );
  const dispatch = useDispatch();

  const user = useSelector((state: StateInterface) => state.auth.user);

  return (
    <>
      {
        <div className="stories-bar-container">
          <div id="stories-bar" className="stories-bar">
            <div className="stories-bars">
              {user?.id && <AddStory />}

              {storiesData.map((story, index) => (
                <StoryElement key={index} index={index} story={story} />
              ))}
            </div>
          </div>
        </div>
      }
    </>
  );
}

export default Index;
