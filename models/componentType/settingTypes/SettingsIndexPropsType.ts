export interface SettingOption {
  id: string;
  title: string;
  component: () => React.ReactNode;
  parentId?: string;
  isOption?: boolean;
  options?: SettingOption[];
  onBack?: () => void;
}

export interface SettingsIndexPropsType {
  lang: string;
  userCookiesData: any;
  order_id?: string;
  tab?: string;
}
