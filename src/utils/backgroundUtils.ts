import { IImage, IImageStyle } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import assetUtils from './assetUtils'
import editorUtils from './editorUtils'
import generalUtils from './generalUtils'
import imageUtils from './imageUtils'
import layerFactary from './layerFactary'
import layerUtils from './layerUtils'
import pageUtils from './pageUtils'
import shotcutUtils from './shortcutUtils'
import stepsUtils from './stepsUtils'

class BackgroundUtils {
  get inBgSettingMode(): boolean {
    return store.getters['mobileEditor/getInBgSettingMode']
  }

  get currPage(): IPage {
    return pageUtils.getPage(pageUtils.currFocusPageIndex)
  }

  get backgroundColor(): string {
    return this.currPage.backgroundColor
  }

  get backgroundOpacity(): number {
    const { styles: { opacity } } = this.currPage.backgroundImage.config
    return opacity
  }

  get backgroundAdjust(): any {
    const { styles: { adjust } } = this.currPage.backgroundImage.config
    return adjust
  }

  get backgroundLocked(): boolean {
    const { locked } = this.currPage.backgroundImage.config
    return locked
  }

  get backgroundImage(): any {
    return this.currPage.backgroundImage
  }

  get backgroundImgControl(): boolean {
    return this.currPage.backgroundImage.config?.imgControl ?? false
  }

  get backgroundImgFlip(): boolean[] {
    const { horizontalFlip = false, verticalFlip = false } = this.currPage.backgroundImage.config?.styles || {}
    return [horizontalFlip, verticalFlip]
  }

  handleImageFlip(flipIcon: string) {
    const [h, v] = this.backgroundImgFlip
    this.setBgImageStyles({
      pageIndex: pageUtils.currFocusPageIndex,
      styles: {
        horizontalFlip: flipIcon === 'flip-h' ? !h : h,
        verticalFlip: flipIcon === 'flip-v' ? !v : v
      }
    })
    stepsUtils.record()
  }

  handleChangeBgAdjust(adjust: any) {
    this.setBgImageStyles({
      pageIndex: pageUtils.currFocusPageIndex,
      styles: {
        adjust: { ...adjust }
      }
    })
  }

  setBgImage(props: { pageIndex: number, config: Partial<IImage> }) {
    store.commit('SET_backgroundImage', props)
  }

  setBgImageStyles(props: { pageIndex: number, styles: Partial<IImageStyle> }) {
    store.commit('SET_backgroundImageStyles', props)
  }

  detachBgImage() {
    const detachedBackgroundImage = generalUtils.deepCopy(this.backgroundImage)
    if (detachedBackgroundImage.config.srcObj.assetId) {
      /** get a tiny photo in order to get the aspectRatio of the image */
      const src = imageUtils.getSrc(detachedBackgroundImage.config, imageUtils.getSrcSize(detachedBackgroundImage.config.srcObj, 50))
      const img = new Image()
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight
        assetUtils.addImage(src, ratio, {
          pageIndex: layerUtils.pageIndex,
          ...detachedBackgroundImage.config.srcObj,
          styles: detachedBackgroundImage.config.styles
        })
        this.setBgImage({
          pageIndex: pageUtils.currFocusPageIndex,
          config: layerFactary.newImage({
            srcObj: {
              type: '',
              userId: '',
              assetId: ''
            },
            styles: {
              width: 0,
              height: 0,
              zindex: -1,
              opacity: 100
            }
          })
        })
      }
      img.src = src
    }
  }

  setBgImageSrc() {
    const image = layerUtils.getCurrLayer as IImage
    const { pageIndex } = layerUtils.currSelectedInfo
    const src = imageUtils.getSrc(image)
    imageUtils.getImageSize(src, image.styles.imgWidth, image.styles.imgHeight).then(({ width: imgWidth, height: imgHeight }) => {
      image.styles.imgWidth = imgWidth
      image.styles.imgHeight = imgHeight
      image.styles.width = imgWidth
      image.styles.height = imgHeight
      image.styles.initWidth = imgWidth
      image.styles.initHeight = imgHeight
      image.styles.rotate = 0
      image.styles.imgX = 0
      image.styles.imgY = 0
      store.commit('SET_backgroundImageSrc', {
        pageIndex: pageIndex,
        srcObj: image.srcObj,
        previewSrc: image.previewSrc
      })
      // this._setBackgroundImage({
      //   pageIndex: pageIndex,
      //   config: image
      // })
      const { width, height, posX, posY } = imageUtils.adaptToSize(image.styles, pageUtils.getPage(pageIndex))
      const { adjust, horizontalFlip, verticalFlip } = image.styles
      pageUtils.updateBackgroundImageStyles(pageIndex, {
        width,
        height,
        adjust,
        horizontalFlip,
        verticalFlip,
        imgWidth: width,
        imgHeight: height,
        scale: 1
      })
      pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
      pageUtils.updateBackgroundImageMode(pageIndex, true)
      shotcutUtils.del()
    })

    if (generalUtils.isTouchDevice()) {
      editorUtils.setInBgSettingMode(true)
    }
  }
}

const backgroundUtils = new BackgroundUtils()

export default backgroundUtils
