
export interface PhoneInputPropsType {
    stepIndicator: number;
    isForCart: boolean;
    setStepIndicator: Function;
    wrongNumber: boolean | string;
    setWrongNumber: Function;
    operation: string;
    inputValue: string;
    setInputValue: Function;
}