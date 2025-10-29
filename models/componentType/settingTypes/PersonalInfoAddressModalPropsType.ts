export interface PersonalInfoAddressModalPropsType {
  swipeToScreen: (index: number) => void;
  goBack: () => void;
}
export interface AddAddressFormPropsType {
  isInSettings?: boolean;
  activeIndex: boolean;
  setOpenSelect: () => void;
  slidePrev: () => void;
  setAddressDetails: (details: any) => void;
  userName?: any;
}
export interface SelectRegionPropsType {
  closeSelect: () => void;
}
