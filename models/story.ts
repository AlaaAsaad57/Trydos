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
