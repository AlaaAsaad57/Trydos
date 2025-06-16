export interface TopSliderPropsType {
    product_name: string,
    active: boolean,
    activeColor:{ 
         index: number;
         images: string[];
         }
    setActiveColor: Function,
    images: string[],
}