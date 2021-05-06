export interface IStyle {
  [key: string]: number | string | undefined,
  x: number,
  y: number,
  scale: number
  scaleX: number,
  scaleY: number,
  rotate: number,
  width: number | string,
  height: number | string,
}
export interface ITextStyle extends IStyle {
  fontFamily?: string,
  fontWeight?: string,
  textAlign?: string,
  lineHeight?: number,
  color?: string,
  fontSize?: number
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
  text: string
}
export interface IShape extends ILayer<IStyle> {
  radius?: string | number,
}
export interface IImage extends ILayer<IStyle> {
  src: string
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
export interface ITmp extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage>
}
