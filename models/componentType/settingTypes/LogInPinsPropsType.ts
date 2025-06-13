
export interface LogInPinsPropsType {
    inputValue: string;
    rendere: boolean;
    setStepIndactor: Function;
    stepIndicator: number;
    init: any;
    expired: boolean;
    resend: Function;
    setPin: Function;
    setDisabled: Function;
    Submit: Function;
    pin: string;
    MessageMethod: string;
    wrongNumber: boolean | string;
    failedLogin: boolean;
    successLogin: boolean;
    disabled: boolean;
    loadingPin: boolean;
    forChanging?: boolean;
}