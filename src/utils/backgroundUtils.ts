import i18n from '@/i18n'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { IBackgroundImage, IPage } from '@/interfaces/page'
import store from '@/store'
import { notify } from '@kyvg/vue3-notification'
import assetUtils from './assetUtils'
import editorUtils from './editorUtils'
import generalUtils from './generalUtils'
import imageUtils from './imageUtils'
import layerFactary from './layerFactary'
import layerUtils from './layerUtils'
import pageUtils from './pageUtils'
import shortcutUtils from './shortcutUtils'
import stepsUtils from './stepsUtils'

class BackgroundUtils {
  get inBgSettingMode(): boolean {
    return store.getters['mobileEditor/getInBgSettingMode']
  }

  get hasBgImage(): boolean {
    return this.backgroundImage.config.srcObj?.assetId !== ''
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

  get backgroundImage(): IBackgroundImage {
    return this.currPage.backgroundImage
  }

  get backgroundImageControl(): boolean {
    return this.backgroundImage.config.imgControl
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

  handleLockBackground() {
    this.setBgImage({
      pageIndex: pageUtils.currFocusPageIndex,
      config: {
        locked: !this.backgroundLocked
      }
    })
    this.setBgImageControl({
      pageIndex: pageUtils.currFocusPageIndex,
      imgControl: false
    })
    stepsUtils.record()
  }

  handleDeleteBackground() {
    if (this.backgroundLocked) return this.handleLockedNotify()
    store.commit('REMOVE_background', { pageIndex: pageUtils.currFocusPageIndex })
    pageUtils.updateBackgroundImageStyles(pageUtils.currFocusPageIndex, { adjust: {} })
    stepsUtils.record()
  }

  handleLockedNotify() {
    notify({ group: 'copy', text: i18n.global.tc('NN0804') })
  }

  setBgImage(props: { pageIndex: number, config: Partial<IImage> }) {
    store.commit('SET_backgroundImage', props)
  }

  setBgImageStyles(props: { pageIndex: number, styles: Partial<IImageStyle> }) {
    store.commit('SET_backgroundImageStyles', props)
  }

  setBgImageControl(props: { pageIndex: number, imgControl: boolean }) {
    store.commit('SET_backgroundImageControl', props)
  }

  setAllBackgroundImageControlDefault(): void {
    store.commit('SET_allBackgroundImageControl', false)
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
    const pageIndex = layerUtils.pageIndex
    const image = layerUtils.getCurrConfig as IImage
    console.log(image.previewSrc)
    store.commit('SET_backgroundImageSrc', {
      pageIndex: pageIndex,
      srcObj: image.srcObj,
      previewSrc: image.previewSrc,
      panelPreviewSrc: image.panelPreviewSrc
    })
    const _image = generalUtils.deepCopy(image)
    _image.styles.width = _image.styles.imgWidth
    _image.styles.height = _image.styles.imgHeight
    _image.styles.initWidth = _image.styles.imgWidth
    _image.styles.initHeight = _image.styles.imgHeight
    _image.styles.rotate = 0
    _image.styles.imgX = 0
    _image.styles.imgY = 0
    const { width, height, posX, posY } = imageUtils.adaptToPage(_image.styles, store.getters.getPage(pageIndex))
    const { adjust, horizontalFlip, verticalFlip } = _image.styles
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
    shortcutUtils.del()

    if (generalUtils.isTouchDevice()) {
      editorUtils.setInBgSettingMode(true)
    }
  }

  fitPageBackground(pageIndex: number) {
    const page = pageUtils.getPage(pageIndex)
    const { width, height, posX, posY } = imageUtils.adaptToPage({
      width: page.backgroundImage.config.styles.initWidth || page.backgroundImage.config.styles.width,
      height: page.backgroundImage.config.styles.initHeight || page.backgroundImage.config.styles.height
    }, page)
    pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
    pageUtils.updateBackgroundImageStyles(
      pageIndex,
      {
        width,
        height,
        imgWidth: width,
        imgHeight: height
      })
  }
}

const backgroundUtils = new BackgroundUtils()

export default backgroundUtils
