export interface IModalButton {
  msg: string,
  action?: () => void,
  style?: { [key: string]: number | string },
  class?: string | string[]
}
export interface IModalInfo {
  [key: string]: string | Array<string> | IModalButton
  title: string,
  content: Array<string>,
  confirmButton: IModalButton,
  cancelButton: IModalButton
}
