export interface ProductSliderPropsType {
    product_name: string,
    setActiveColor: Function,
    activeColor: { 
         index: number;
         images: string[];
         }
}