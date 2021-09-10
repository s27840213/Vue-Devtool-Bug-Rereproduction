export interface IModalInfo {
	[key: string]: string | Array<string> | IModalButton
	title: string,
	content: Array<string>,
	comfirmButton: IModalButton,
	cancelButton: IModalButton
}

export interface IModalButton {
	msg: string,
	action: () => void
}
