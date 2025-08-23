export interface ReturnOrderItemConfirmationPropsType {
  close: Function;
  setShouldConfirmReturn: Function;
  confirmationData: any;
  callback: (e?: boolean) => void;
  setReturnObj: (e: any) => void;
}
