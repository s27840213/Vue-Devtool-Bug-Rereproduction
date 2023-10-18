export interface IModalButton {
  msg: string,
  action?: () => void,
  style?: { [key: string]: number | string },
  class?: string | string[]
}
export interface IModalInfo {
  [key: string]: string | boolean | Array<string> | IModalButton | { [key: string]: number | string } | undefined | ((checked: boolean) => void)
  title: string,
  content: Array<string>,
  confirmButton: IModalButton,
  cancelButton: IModalButton,
  imgSrc: string,
  noClose: boolean,
  backdropStyle: { [key: string]: number | string },
  cardStyle: { [key: string]: number | string },
  checkboxText: string,
  checked: boolean,
  onCheckedChange: (checked: boolean) => void,
}
