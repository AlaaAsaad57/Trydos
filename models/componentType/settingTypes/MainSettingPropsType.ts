
export interface MainSettingPropsType {
        swipeToScreen: (index: number) => void;
}

export interface ProfileCardPropsType {
    goToProfile: () => void;
    goToProfileSize: () => void;
    goToProfilePicture: () => void;
}
export interface MainSettingOptionPropsType {
    name: string;
    Icon: React.ReactNode;
}