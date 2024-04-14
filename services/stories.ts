import axios from "axios";
import { StoriesInterface } from "models/Stories";
import { DataApiHeaders } from "store/homepage/cachedActions";
import { GET_USERS_STORIES, STORIES_URL } from "utils/endpointConfig";

class StoryService {
  http = axios.create({ baseURL: STORIES_URL });

  /* get stories */

  async getStories() {
    const res = await fetch(STORIES_URL + GET_USERS_STORIES, {
      headers: await DataApiHeaders(),
    });
    if (res.ok) {
      const result = await res.json();
      const data: StoriesInterface[] = result?.data?.data;
      return data;
    } else {
      throw new Error("Failed to fetch stories");
    }
  }

  /* add stories */

  async addStory() {
    const response = await this.http.post<StoriesInterface[]>(
      "api/v1/stories/users_stories",
      { data: "" }
    );
    return response.data;
  }
}

const StoryServiceClass = new StoryService();
export default StoryServiceClass;
