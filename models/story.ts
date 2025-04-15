import { Story as StoryInstaType } from "utils/react-insta-stories-master/src/interfaces";
export interface Story {
  id: number;
  name: string | null;
  photo_path: string | null;
  media: string[];
  mobile_phone: string;
  stories: {
    url: string;
    FixedUrl: string;
    duration: number;
    type: string;
    is_seen: boolean;
    photo_path: string;
    preloadResource: boolean;
    full_video_path: string;
    id: number;
  }[];
}
export interface StoryType {
  id: number;
  mobile_phone: string;
  photo_path: string | null;
  name: string;
  username: string | null;
  stories: StoryInstaType[];
}
