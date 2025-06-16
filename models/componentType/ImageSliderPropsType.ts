export interface ImageSliderPropsType {
    product_name: string,
    priority: boolean,
    active: boolean,
    activeColor: { 
         index: number;
         images: string[];
         }
    setActiveColor: Function,
    colors: { 
         index: number;
         images:{
            file_path: string;
         }[];
         }[],
    getIndex: number,
    setActiveImage?: Function,
}