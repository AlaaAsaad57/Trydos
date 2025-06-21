export interface CoverEffectSliderPropsType {
    isColorSelected: boolean,
    setColor: Function,
    images:{
        color_name: string,
        images:{
            file_path: string;
        }[];
    }[],
    product_name: string,
    priority: boolean,
    active: boolean,
    activeColor: { 
        color_name: string,
         index: number;
         images: string[];
         }
    setActiveColor: Function,
    setActiveImage?: Function,
}