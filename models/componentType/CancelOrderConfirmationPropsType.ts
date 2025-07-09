export interface CancelOrderConfirmationPropsType {
  close: () => void;
  setShouldConfirmCancel: (bool: boolean) => void;
  topic?: string;
  callback: any;
  shouldConfirmCancel: any;
}
