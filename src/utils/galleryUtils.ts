// import GeneralUtils from '@/utils/generalUtils'
import {
  GalleryImage,
  RowData
} from '@/interfaces/gallery'

export default class GalleryUtils {
  minHeight = 100
  margin = 0
  galleryWidth = 300

  constructor(galleryWidth: number, minHeight: number, margin: number) {
    this.galleryWidth = galleryWidth || this.galleryWidth
    this.minHeight = minHeight || this.minHeight
    this.margin = margin || this.margin
  }

  private resizeToMinHeight(images: GalleryImage[]): void {
    for (let idx = 0; idx < images.length; idx++) {
      const image = images[idx]
      image.preview = {
        width: image.width * this.minHeight / image.height,
        height: this.minHeight
      }
    }
  }

  createRows(images: GalleryImage[]) {
    const rows = []
    const rowData = { imgs: [], sumOfWidth: 0 } as RowData
    for (let i = 0; i < images.length; i++) {
      const current = images[i]
      const next = images[i + 1] || {}
      const nextWidth = next.preview?.width || 0
      rowData.sumOfWidth += current.preview?.width || 0
      rowData.imgs.push(current)
      const nextMargin = (rowData.imgs.length + 1) * this.margin
      const excludeNext = !nextWidth || (rowData.sumOfWidth + nextWidth + nextMargin) > this.galleryWidth
      if (excludeNext) {
        rows.push({ ...rowData })
        rowData.imgs = []
        rowData.sumOfWidth = 0
      }
    }
    return rows
  }

  generate(images: GalleryImage[]): Array<GalleryImage[]> {
    this.resizeToMinHeight(images)
    return this
      .createRows(images)
      .map(row => {
        for (let idx = 0; idx < row.imgs.length; idx++) {
          const img = row.imgs[idx]
          const currentMargin = (row.imgs.length - 1) * this.margin
          const actualWidth = this.galleryWidth - currentMargin
          img.preview.width = img.preview.width * (actualWidth / row.sumOfWidth)
          img.preview.height = img.preview.height * (actualWidth / row.sumOfWidth)
        }
        return row.imgs
      })
  }
}
