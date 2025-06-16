import { Story } from "./StoryElementPropsType";

export interface StoryPropsType {
      media: { photo_path: string; full_video_path: string; id: number };
      Name: string;
      index: number;
      mobile_phone?: string;
      photo_path?: string;
      name?: string;
      story: Story[];
}