
export interface OrderDetailsPropsType {
    resetOrderDetails: () => void;
    goBack: () => void;
}
export interface OrderDateCardProps {
    time: string;
  }

export  interface OrderNumberCardProps {
    number: string;
  }

export interface OrderInvoiceCardProps {
    amount: number;
    payments: {
      value: string;
      label: string;
    };
  }