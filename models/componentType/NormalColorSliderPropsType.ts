export interface NormalColorSliderPropsType {
    active: boolean;
    colors: ColorType[];
    activeColor: ColorType;
    setActiveColor: (e: ColorType) => void;
    ProductColorsArray: ProductColorsArrayType[];
    close: () => void;
}
export interface ColorType {
    color_name: string
    color_trend: boolean
    images: string[]
  }
  export interface ProductColorsArrayType {
    name: string
    color: string
  }