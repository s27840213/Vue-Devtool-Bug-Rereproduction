export interface IModalButton {
  msg: string,
  action: () => void
}
export interface IModalInfo {
  [key: string]: string | Array<string> | IModalButton
  title: string,
  content: Array<string>,
  confirmButton: IModalButton,
  cancelButton: IModalButton
}
