
export interface DeleteModalComponentPropsType {
        closeModal: () => void;
        slidePrev: () => void;
        deletedAddress: {
          id: number;
          address: string;
          region_details: {
            province?: string;
            city?: string;
            town?: string;
            street?: string;
            building?: string;
          };
          contact_info: {
            phone: string;
            name: string;
          };
        };
}
export interface OrderButtonsPropsType {
  setNext: () => void;
  setPrev: () => void;
  orderLoading: boolean;
}