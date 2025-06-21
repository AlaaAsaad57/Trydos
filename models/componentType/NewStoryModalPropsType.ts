export interface NewStoryModalPropsType {
    close: () => void;
    HandleUploadedVideo: (event: React.ChangeEvent<HTMLInputElement>) => void;
    send: (dataUrl: string) => void;
}