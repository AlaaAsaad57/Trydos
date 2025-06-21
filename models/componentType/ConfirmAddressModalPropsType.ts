export interface ConfirmAddressModalPropsType {
    close: Function;
    confirmationData: {
        newAddress: {
            address: string
            region_details: string
            contact_info:{
                phone: string;
                name: string;
            }
        }
        currentAddress: {
            address: string;
            region_details: any;
            contact_info:{
                phone: string;
                name: string;
            }
        }
        enable: boolean;
        
    };
    confirm: Function;
}