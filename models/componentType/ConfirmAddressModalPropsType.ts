export interface ConfirmAddressModalPropsType {
    close: () => void;
    confirmationData: {
        newAddress: string;
        currentAddress: string;
        enable: boolean;
    };
    confirm: () => void;
}