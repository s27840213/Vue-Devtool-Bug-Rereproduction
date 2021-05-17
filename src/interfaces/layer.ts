export interface IStyle {
  [key: string]: number | string | undefined,
  x: number,
  y: number,
  scale: number
  scaleX: number,
  scaleY: number,
  rotate: number,
  width: number,
  height: number,
  initWidth: number,
  initHeight: number,
  zindex: number
}

export interface ITextStyle extends IStyle {
  font: string,
  weight: string,
  align: string,
  lineHeight: number,
  color: string,
  size: number,
  initSize: number
}

export interface ITmpStyle extends IStyle {
  initX: number,
  initY: number,
}

export interface IGroupStyle extends IStyle {
  initX: number,
  initY: number,
}
export interface ILayer<T extends IStyle = IStyle> {
  [key: string]: unknown,
  type: string,
  pageIndex: number,
  active: boolean,
  shown: boolean,
  styles: T
}
export interface IText extends ILayer<ITextStyle> {
  text: string,
  textEditable: boolean
}
export interface IShape extends ILayer<IStyle> {
  radius?: string | number,
}
export interface IImage extends ILayer<IStyle> {
  src: string,
  clipPath?: string,
  imgX: number,
  imgY: number,
  imgWidth: number,
  imgHeight: number,
  imgControll: boolean
}
export interface IGroup extends ILayer<IGroupStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
export interface ITmp extends ILayer<ITmpStyle> {
  layers: Array<IShape | IText | IImage>
}
