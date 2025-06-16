export interface SizeListPropsType {
    sizes: {
        name: string;
    }[];
    setSize: (e: string) => void;
    currentSize: string;
    newSize: string;
    image: string;
}