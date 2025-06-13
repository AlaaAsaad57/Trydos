
export interface ConfirmMobileChangePropsType {
    closeWindow: () => void,
    value: string,
    successCallbackFunction: (idToken: string) => void,
    forVerify: boolean
}