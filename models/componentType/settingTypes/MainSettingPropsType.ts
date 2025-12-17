export interface MainSettingPropsType {
  swipeToScreen: (index: number) => void;
  userCookiesData: any;
}

export interface ProfileCardPropsType {
  goToProfile: () => void;
  goToProfileSize: () => void;
  goToProfilePicture: () => void;
  userCookiesData: any;
}
export interface MainSettingOptionPropsType {
  name: string;
  Icon: React.ReactNode;
  onClick?: () => void;
}
