import { ProductDetails } from "./ModifyOrderWidgetPropsType";

export interface ColorListPropsType {
    colors: {
        color_name: string;
        images: string[];
    }[];
    setColor: (e: string) => void;
    currentColor: string;
    newColor: string;
}