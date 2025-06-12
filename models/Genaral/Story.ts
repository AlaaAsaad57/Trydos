import { Story as StoryInstaType } from "utils/react-insta-stories-master/src/interfaces";
export interface FixedStory {
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

interface Story {
  readonly id: number;
  cut_video_name?: string;
  cut_video_path?: string;
  full_video_name?: string;
  full_video_path?: string;
  storage_video_path?: string;
  user_id: number;
  is_photo: number;
  is_video: number;
  photo_path?: string;
  file: any;
  is_seen: boolean;
  viewers_count: number;
  media: any[];
}

export interface StoriesInterface {
  readonly id: number;
  mobile_phone: string;
  photo_path?: string;
  name?: string;
  username?: string;
  original_user_id?: number;
  email?: string;
  stories: Story[];
  media: any[];
}
