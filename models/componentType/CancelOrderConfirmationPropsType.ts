export interface CancelOrderConfirmationPropsType {
  close: () => void;
  setShouldConfirmCancel: (bool: boolean) => void;
  topic?: string;
  callback: any;
  setShouldConfirmChange: (bool: boolean) => void;
}
