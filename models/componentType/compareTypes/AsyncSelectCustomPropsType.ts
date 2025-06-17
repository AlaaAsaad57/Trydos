

export interface AsyncSelectProps {
    placeholder: string;
    onSearch: (value: string) => Promise<void>;
    options: Array<{
      label: string;
      value: string;
  
      images: { file_path: string };
      price?: number;
    }>;
    onChange: (
      option: {
        label: string;
        value: string;
        images: { file_path: string };
        price?: number;
      } | null
    ) => void;
    onClear?: () => void;
    isLoading?: boolean;
    className?: string;
    selectedOption?: {
      label: string;
      value: string;
      images: { file_path: string };
      price?: number;
    } | null;
  }