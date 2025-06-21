export interface StoryAvatarPropsType {
      avatar: string | StaticImageData;
      isSeen: boolean;
}
export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
}