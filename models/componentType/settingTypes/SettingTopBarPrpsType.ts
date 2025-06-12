
export interface SettingTopBarPropsType {
        Save?: () => void;
        hasOptions?: boolean;
        screenName: string | React.ReactNode;
        goBack: () => void;
        Icon?: React.ReactNode;
        DataCy?: string;
        hasChat?: boolean;
}