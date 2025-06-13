
export interface SettingsModalPropsType {
    onClose: () => void;
    lang: string | string[];
}

export interface ProfileData {
    name: string;
    email: string;
    phone: string;
    photo?: string;
  }
  
export  interface ValidationErrors {
    name?: string;
    email?: string;
    phone?: string;
  }
