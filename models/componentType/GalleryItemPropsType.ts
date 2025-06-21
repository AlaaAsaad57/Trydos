export interface GalleryItemPropsType {
    onClick: () => void;
    extended: boolean;
    name: string;
    avatar: string;
    image: string[];
    text: string;
    date: string;
    likes: string;
}