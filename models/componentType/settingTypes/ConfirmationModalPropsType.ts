
export interface ConfirmationModalPropsType {
    closeWindow: () => void,
    value: string,
    successCallback: (idToken: string) => void,
    forVerify: boolean
}