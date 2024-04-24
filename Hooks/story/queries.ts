import { useQuery } from "@tanstack/react-query";
import StoryServiceClass from "services/story";

export async function useStory() {
  return useQuery({
    queryKey: ["story"],
    queryFn: await StoryServiceClass.getStories,
  });
}
