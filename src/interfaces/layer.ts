export interface IStyle {
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  rotate: number,
  width: number,
  height: number
}

export interface ITextStyle extends IStyle {
  fontFamily: string,
  fontWeight: string,
  textAlign: string,
  lineHeight: number,
  color: string,
  fontSize: number
}
export interface ILayer<T extends IStyle = IStyle> {
  type: string,
  styles: T
}
export interface IText extends ILayer<ITextStyle> {
  text: string
}

export interface IShape extends ILayer<IStyle> {
  radius?: string,
}

export interface IImage extends ILayer<IStyle> {
  src: string
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage>
}
