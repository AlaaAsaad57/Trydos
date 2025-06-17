
export interface ProfilePropsType {
    swipeToScreen: (index: number) => void;
    goBack: () => void;
}
export interface ProfilePicturePropsType {
    GoToProfilePhotoScreen: () => void;
    photo?: string;
}
export interface SettingOptionsProfileType {
    name: string;
    Icon: React.ReactNode;
    callback: () => void;
    dataCy: any;
}