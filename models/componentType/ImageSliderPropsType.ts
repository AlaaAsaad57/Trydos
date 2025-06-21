export interface ImageSliderPropsType {
    product_name?: string,
    priority?: boolean,
    active?: boolean,
    activeColor?: { 
         index: number;
         images: {
            file_path: string;
         }[];
         }
    setActiveColor?: Function,
    colors?: { 
         index: number;
         images:{
            file_path: string;
         }[];
         }[],
    getIndex?: number,
    setActiveImage?: Function,
    setColor?: Function,
    renderVar: boolean,
    isColorSelected: boolean,
    setActiveTopSlide: Function,
    isActiveTopSlide: boolean,
}