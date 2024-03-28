import { CloudinaryImage } from "@cloudinary/url-gen";

export type Product = { id: number };
export type Story = {
  id: number;
  name: string | null;
  photo_path: string | null;
  media: string[];
  mobile_phone: string;
  stories: {
    url: string;
    FixedUrl: CloudinaryImage;
    duration: number;
    type: string;
    is_seen: boolean;
    preloadResource: boolean;
  }[];
};
export type StoryType = {
  id: number;
  mobile_phone: string;
  photo_path: string | null;
  name: string;
  username: string | null;
  stories: {
    id: number;
    full_video_path: string | null;
    photo_path: string | null;
    is_video: boolean;
    is_seen: boolean;
  }[];
};
export type ConfiguredStory = { id: number };
export type Offer = { photos: number[] };
