// import GeneralUtils from '@/utils/generalUtils'
import { IBrandLogo } from '@/interfaces/brandkit'
import {
  GalleryImage,
  LogoRowData,
  RowData
} from '@/interfaces/gallery'
import store from '@/store'

export default class GalleryUtils {
  minHeight = 100
  margin = 0
  galleryWidth = 300

  constructor(galleryWidth: number, minHeight: number, margin: number) {
    this.galleryWidth = galleryWidth || this.galleryWidth
    this.minHeight = minHeight || this.minHeight
    this.margin = margin || this.margin
  }

  private resizeToMinHeight(images: (GalleryImage | IBrandLogo)[]): void {
    for (let idx = 0; idx < images.length; idx++) {
      const image = images[idx]
      image.preview = {
        width: image.width * this.minHeight / image.height,
        height: this.minHeight
      }
    }
  }

  setRegenerateGalleryFlag(bool: boolean): void {
    store.commit('file/SET_REGENERATE_GALLERY_FLAG', bool)
  }

  createRows(images: GalleryImage[]): RowData[] {
    const rows = []
    const rowData = { imgs: [], sumOfWidth: 0 } as RowData
    for (let i = 0; i < images.length; i++) {
      const current = images[i]
      const next = images[i + 1] || {}
      const nextWidth = next.preview?.width || 0
      rowData.sumOfWidth += current.preview?.width || 0
      rowData.imgs.push(current)
      const nextMargin = rowData.imgs.length * this.margin
      const excludeNext = !nextWidth || (rowData.sumOfWidth + nextWidth + nextMargin) > this.galleryWidth
      if (excludeNext) {
        rows.push({ ...rowData })
        rowData.imgs = []
        rowData.sumOfWidth = 0
      }
    }
    return rows
  }

  createRowsForLogos(images: IBrandLogo[]): LogoRowData[] {
    const rows = []
    const rowData = { imgs: [], sumOfWidth: 0 } as LogoRowData
    for (let i = 0; i < images.length; i++) {
      const current = images[i]
      const next = images[i + 1] || {}
      const nextWidth = next.preview?.width || 0
      rowData.sumOfWidth += current.preview?.width || 0
      rowData.imgs.push(current)
      const nextMargin = rowData.imgs.length * this.margin
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

  generateForLogo(logos: IBrandLogo[]): Array<IBrandLogo[]> {
    this.resizeToMinHeight(logos)
    return this
      .createRowsForLogos(logos)
      .map(row => {
        for (let idx = 0; idx < row.imgs.length; idx++) {
          const img = row.imgs[idx]
          const currentMargin = (row.imgs.length - 1) * this.margin
          const actualWidth = this.galleryWidth - currentMargin
          if (img.preview) {
            img.preview.width = img.preview.width * (actualWidth / row.sumOfWidth)
            img.preview.height = img.preview.height * (actualWidth / row.sumOfWidth)
          }
        }
        return row.imgs
      })
  }
}
