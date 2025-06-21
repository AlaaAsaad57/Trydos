
export interface NormalSizesSliderPropsType {
    sizes: Size[];
    activeColor: string[];
    setActiveColor: (color: string) => void;
    close?: () => void;
    active?: boolean;
}
export interface Size {
    name: string;
    option: string;
}