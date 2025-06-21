export interface ColorSliderPropsType {
    product_name: string,
    priority: boolean,
    active: boolean,
    activeColor: { 
         index: number;
         images: string[];
         }
    setActiveColor: Function,
    colors:any ,
    getIndex: number,
    setActiveImage?: Function,
}