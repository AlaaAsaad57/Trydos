export interface ReturnOrderItemConfirmationPropsType {
  close: Function;
  setShouldConfirmReturn: Function;
  confirmationData: any;
  callback: () => void;
  setReturnObj: (e: any) => void;
}
