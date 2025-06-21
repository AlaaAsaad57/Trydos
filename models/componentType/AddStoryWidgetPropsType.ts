export interface AddStoryWidgetPropsType {
    onClose: () => void;
    selectMedia: ({ media, link }: { media: File; link: string }) => void;
}