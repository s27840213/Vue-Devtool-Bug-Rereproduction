export interface Urls {
  full: string,
  raw: string,
  regular: string,
  small: string,
  thumb: string
}

export interface RawImage {
  width: number,
  height: number
}

export interface GalleryImage extends RawImage {
  preview: RawImage
}

export interface RowData {
  imgs: GalleryImage[],
  sumOfWidth: number
}

export interface SrcObj {
  type: string,
  userId: string,
  assetId: string
}