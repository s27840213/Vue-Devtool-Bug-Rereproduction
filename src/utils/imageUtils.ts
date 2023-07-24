import imageApi from '@/apis/image-api'
import { IImageSize, IUserImageContentData } from '@/interfaces/api'
import { ICoordinate } from '@/interfaces/frame'
import { SrcObj } from '@/interfaces/gallery'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
import { IBounding, ISize } from '@/interfaces/math'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import { IShadowAsset } from '@/store/module/shadow'
import { AxiosPromise } from 'axios'
import { findLastIndex } from 'lodash'
import FrameUtils from './frameUtils'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'

const APP_VER_FOR_REFRESH_CACHE = 'v7174'

class ImageUtils {
  get imageSizeMap (): { [key: string]: number } {
    return {
      larg: 1600,
      full: 1200,
      midd: 766,
      smal: 510,
      tiny: 320,
      prev: 150
    }
  }

  async imgLoadHandler<T>(src: string, cb: (img: HTMLImageElement) => T, options?: { error?: () => void, crossOrigin?: boolean }) {
    const { error, crossOrigin = false } = options || {}
    return new Promise<T>((resolve) => {
      const image = new Image()
      if (crossOrigin) {
        image.crossOrigin = 'anonymous'
      }
      image.onload = () => resolve(cb(image))
      error && (image.onerror = error)
      image.src = src
    })
  }

  getImgIdentifier(srcObj: SrcObj, ...attrs: Array<string>): string {
    return [srcObj.type, srcObj.userId, srcObj.assetId, ...attrs].join(',')
  }

  isImgControl(pageIndex: number = LayerUtils.pageIndex): boolean {
    if (pageIndex === LayerUtils.pageIndex && LayerUtils.getCurrLayer) {
      const currLayer = LayerUtils.getCurrLayer
      switch (currLayer.type) {
        case 'image':
          return (currLayer as IImage).imgControl
        case 'group':
          return (currLayer as IGroup).layers
            .some(layer => {
              return layer.type === 'image' && layer.imgControl
            })
        case 'frame':
          return (currLayer as IFrame).clips
            .some(layer => {
              return layer.type === 'image' && layer.imgControl
            })
      }
    }
    return false
  }

  isSrcObj(srcObj: Partial<IImage> | SrcObj): srcObj is SrcObj {
    return typeof srcObj.assetId !== 'undefined' && typeof srcObj.userId !== 'undefined' && typeof srcObj.type !== 'undefined'
  }

  appendQuery(src: string, name: string, value: string) {
    if (src === '') return ''
    if (src.includes('data:image/')) return src
    if (src.includes('?')) {
      return src + `&${name}=${value}`
    } else {
      return src + `?${name}=${value}`
    }
  }

  getSrc(config: Partial<IImage> | SrcObj, size?: string | number, ver?: number, forBgRemove?: boolean): string {
    // Documentation: https://www.notion.so/vivipic/Image-layer-sources-a27a45f5cff7477aba9125b86492204c
    let { type, userId, assetId, brandId, updateQuery, maxSize } = {} as SrcObj
    let ratio = 1
    if (this.isSrcObj(config)) {
      ({ type, userId, assetId, brandId, maxSize } = config)
    } else {
      if (!config.srcObj && !config.src_obj) return ''
      if (config.previewSrc) {
        return this.appendRefreshAppver(config.previewSrc)
      }
      const srcObj = config.srcObj || config.src_obj as SrcObj
      ({ type, userId, assetId, brandId, updateQuery, maxSize } = srcObj)
      if (typeof size === 'undefined' && config.styles) {
        const { imgWidth, imgHeight } = config.styles
        size = this.getSrcSize(
          srcObj,
          config.styles ? this.getSignificantDimension(imgWidth, imgHeight) * store.getters.getPageScaleRatio * 0.01 : 0
        )
      }
      ratio = config.styles ? config.styles.imgHeight / config.styles.imgWidth : 1
    }
    if (size === 'xtra' && maxSize && maxSize !== 'xtra') {
      size = maxSize
    }

    if (typeof size === 'string' && ['unsplash', 'pexels'].includes(type)) {
      size = this.imageSizeMap[size]
    }

    let res = ''

    switch (type) {
      case 'public': {
        if (typeof size === 'string' && (size as string).includes('ext')) {
          res = `https://template.vivipic.com/admin/${userId}/asset/image/${assetId}/${size}`
        } else {
          const query = forBgRemove ? `?rand_ver=${generalUtils.generateRandomString(6)}` : '?origin=true'
          res = `https://template.vivipic.com/admin/${userId}/asset/image/${assetId}/${size || 'midd'}${query + (updateQuery || '')}`
        }
        break
      }
      case 'private': {
        const editorImg = store.getters['file/getEditorViewImages']
        const query = forBgRemove ? `&rand_ver=${generalUtils.generateRandomString(6)}` : '&orPigin=true'
        res = editorImg(assetId) ? editorImg(assetId)[size as string] + query : ''
        break
      }
      case 'logo-public':
        if ((size as string).includes('ext')) {
          res = `https://template.vivipic.com/admin/${userId}/asset/logo/${brandId}/${assetId}/${size}?origin=true`
        } else {
          res = `https://template.vivipic.com/admin/${userId}/asset/logo/${brandId}/${assetId}/${size}?origin=true`
        }
        break
      case 'logo-private': {
        const editorLogo = store.getters['brandkit/getEditorViewLogos']
        res = editorLogo(assetId) ? editorLogo(assetId)[size as string] + '&origin=true' : ''
        break
      }
      case 'unsplash':
        res = `https://images.unsplash.com/${assetId}?cs=tinysrgb&q=80&${ratio >= 1 ? 'h' : 'w'}=${size || 766}&origin=true`
        break
      case 'pexels':
        res = `https://images.pexels.com/photos/${assetId}/pexels-photo-${assetId}.jpeg?auto=compress&cs=tinysrgb&${ratio >= 1 ? 'h' : 'w'}=${size || 766}&origin=true`
        break
      case 'background':
        res = `https://template.vivipic.com/background/${assetId}/${size || 'full'}?origin=true&ver=${store.getters['user/getVerUni']}`
        break
      case 'frame':
        res = require('@/assets/img/svg/frame.svg')
        break
      case 'shadow-private': {
        const shadowImgs = (store.getters['shadow/shadowImgs'] as Map<number, IShadowAsset>)
        if (typeof assetId === 'number') {
          if (shadowImgs.has(assetId)) {
            res = (shadowImgs as Map<any, any>).get(assetId)?.urls[size as string || 'midd'] || ''
            break
          }
        }
        res = ''
        break
      }
      case 'local':
        return assetId as string
      case 'svg':
        res = `https://template.vivipic.com/svg/${assetId}/${size || 'full'}?origin=true&ver=${store.getters['user/getVerUni']}`
        break
      case 'ios':
        res = `vvstk://${assetId}`
        break
      default:
        res = ''
    }
    /**
     * to solve the cross origin error cause by add crossOrigin='anonymous'
     * the cache img of the users would keep catching this error
     * use a universe query version can solve this problem
     */
    return this.appendRefreshAppver(res)
  }

  getSrcSize(srcObj: SrcObj, dimension: number | string, preload = '') {
    const { type } = srcObj
    if (!type) {
      return 0
    }
    const key = type === 'pexels' || type === 'unsplash' ? 'size' : 'key'
    const sizeMap = [...(store.state as any).user.imgSizeMap as Array<{ [key: string]: number | string }>]
    if (store.getters['user/getUserId'] === 'backendRendering') {
      sizeMap.unshift(...(store.state as any).user.imgSizeMapExtra)
    }
    if (sizeMap?.length) {
      let i = 0
      if (typeof dimension === 'number') {
        i = findLastIndex(sizeMap, s => dimension <= s.size)
        i = Math.max(i, 0) // For i === -1
      } else if (typeof dimension === 'string') {
        i = Math.max(sizeMap.findIndex(m => m[key] === dimension, 0))
      }
      return preload
        ? preload === 'pre' ? sizeMap[i + 1 >= sizeMap.length - 1 ? sizeMap.length - 1 : i + 1][key] : sizeMap[i - 1 <= 0 ? 0 : i - 1][key]
        : sizeMap[i][key]
    }
    return (type === 'pexels' || type === 'unsplash') ? 1080 : 'full'
  }

  getSignificantDimension(width: number, height: number) {
    return Math.max(width, height)
  }

  getSrcType(src: string) {
    if (src.includes('unsplash')) return 'unsplash'
    if (src.includes('pexels')) return 'pexels'
    if (src.includes('template.vivipic.com/background')) return 'background'
    if (src.includes('template.vivipic.com/svg')) return 'svg'
    if (src.includes('template.vivipic.com/admin')) {
      return src.includes('logo') ? 'logo-public' : 'public'
    }
    if (src.includes('vvstk')) return 'ios'
    if (src.includes('asset.vivipic')) {
      return src.includes('logo') ? 'logo-private' : 'private'
    }
    return ''
  }

  getUserId(src: string, type: string) {
    switch (type) {
      case 'logo-public':
      case 'public': {
        const keyStart = 'admin/'
        const keyEnd = '/asset'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
      }
      case 'pexels': {
        return src.includes('jpeg') ? 'jpeg' : 'png'
      }
      default:
        return ''
    }
  }

  getAssetId(src: string, type = this.getSrcType(src)) {
    switch (type) {
      case 'logo-public': {
        const keyStart = 'logo/'
        const keyEnd = '/full'
        const brandIdAndAssetId = src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
        return brandIdAndAssetId.split('/')[1]
      }
      case 'public': {
        const keyStart = 'image/'
        const keyEnd = '/full'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
      }
      case 'unsplash': {
        const keyStart = 'com/'
        const keyEnd = '?'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
      }
      case 'pexels': {
        const keyStart = 'photos/'
        const keyEnd = '/pexels'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
      }
      case 'background': {
        const keyStart = 'background/'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf('/prev') === -1 ? src.indexOf('/larg') : src.indexOf('/prev'))
      }
      case 'svg': {
        const keyStart = 'svg/'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf('/prev') === -1 ? src.indexOf('/larg') : src.indexOf('/prev'))
      }
      case 'ios': {
        const keyStart = 'vvstk://'
        return src.substring(keyStart.length)
      }
      case 'logo-private':
      case 'private':
        return src
      default:
        return ''
    }
  }

  getImgSize(srcObj: SrcObj, cache = true): AxiosPromise<IImageSize> | undefined {
    const { type: _type, assetId, userId } = srcObj
    switch (_type) {
      case 'private':
      case 'public':
      case 'logo-private':
      case 'logo-public': {
        const type = _type.includes('logo') ? 'logo' : 'image'
        if (!userId && typeof assetId === 'number') {
          return imageApi.getImgSize({
            token: '',
            type,
            asset_index: assetId as number,
            cache
          })
        } else if (typeof userId === 'string' && typeof assetId === 'string') {
          return imageApi.getImgSize({
            token: '',
            type,
            asset_id: assetId,
            team_id: userId,
            cache
          })
        }
        break
      }
      case 'background': {
        if (typeof assetId === 'string') {
          return imageApi.getImgSize({
            token: '',
            type: 'background',
            key_id: assetId,
            cache
          })
        }
        break
      }
      case 'svg': {
        if (typeof assetId === 'string') {
          return imageApi.getImgSize({
            token: '',
            type: 'svg',
            key_id: assetId,
            cache
          })
        }
      }
    }
  }

  getBrandId(src: string, type: string): string | undefined {
    if (type !== 'logo-public') return
    const tokens = src.split('/')
    return tokens[tokens.length - 3]
  }

  setImgControlDefault(deselect = true) {
    const { pageIndex, layerIndex, getCurrLayer: currLayer } = LayerUtils
    if (currLayer) {
      switch (currLayer.type) {
        case 'image':
          LayerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false })
          break
        case 'group': {
          const primaryLayer = currLayer as IGroup
          for (let i = 0; i < primaryLayer.layers.length; i++) {
            const props = {} as { [key: string]: boolean | string | number }
            if (primaryLayer.layers[i].type === 'image') {
              props.imgControl = false
            }
            if (deselect) {
              props.active = false
            }
            LayerUtils.updateSubLayerProps(pageIndex, layerIndex, i, props)
          }
          break
        }
        case 'frame': {
          const primaryLayer = currLayer as IFrame
          for (let i = 0; i < primaryLayer.clips.length; i++) {
            FrameUtils.updateFrameLayerProps(pageIndex, layerIndex, i, { active: false, imgControl: false })
          }
        }
      }
    }
  }

  initLayerSize: ISize = {
    width: 0,
    height: 0
  }

  initImgPos: ICoordinate = {
    x: 0,
    y: 0
  }

  initImgSize: ISize = {
    width: 0,
    height: 0
  }

  imgBuffer: IBounding = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }

  isHorizon = false
  xSign = 0
  ySign = 0

  resizeExceedLimit(width: number, height: number, offsetX: number, offsetY: number): boolean {
    const imgPos = {
      x: this.initImgPos.x,
      y: this.initImgPos.y
    }
    /**
     * Below is a conclusion of checking-if-the-Resizer-exceed-limit for the top/left resizer
     * The origin derived algorithm is described as in imgContorller.vue: moving section
     */
    if ((this.isHorizon && this.xSign < 0) || (!this.isHorizon && this.ySign < 0)) {
      imgPos.x += offsetX
      imgPos.y += offsetY
      if (imgPos.x > 0 || imgPos.y > 0) {
        return true
      }
    } else {
      width += offsetX
      height += offsetY
      if (this.isHorizon && width - imgPos.x > this.initImgSize.width) {
        return true
      }
      if (!this.isHorizon && height - imgPos.y > this.initImgSize.height) {
        return true
      }
    }
    return false
  }

  imgResizeHandler(width: number, height: number, offsetWidth: number, offsetHeight: number, updatePos = null as any, updateSize = null as any) {
    let offsetX
    let offsetY
    if ((this.isHorizon && this.xSign < 0) || (!this.isHorizon && this.ySign < 0)) {
      offsetX = offsetWidth
      offsetY = offsetHeight
    }
    if (this.resizeExceedLimit(this.initLayerSize.width, this.initLayerSize.height, offsetWidth, offsetHeight)) {
      if (this.imgBuffer.width === 0 && this.imgBuffer.height === 0) {
        this.imgScaling(width + offsetWidth, height + offsetHeight, 0, 0)
        this.imgBuffer.width = offsetWidth
        this.imgBuffer.height = offsetHeight
      }
      this.imgScaling(width, height, offsetWidth - this.imgBuffer.width, offsetHeight - this.imgBuffer.height, updatePos, updateSize)
    } else {
      this.imgClipping(width, height, offsetX, offsetY, updatePos, updateSize)
    }
  }

  imgScaling(layerWidth: number, layerHeight: number, offsetWidth: number, offsetHeight: number, updatePos = null as any, updateSize = null as any) {
    // ControlUtils.updateLayerInitSize(LayerUtils.pageIndex, LayerUtils.layerIndex, layerWidth, layerHeight, 1)
    let imgWidth = this.initImgSize.width
    let imgHeight = this.initImgSize.height
    const imgPos = {
      x: this.initImgPos.x,
      y: this.initImgPos.y
    }

    const ratio = imgHeight / imgWidth
    const width = layerWidth
    const height = layerHeight

    if (this.isHorizon) {
      imgWidth += offsetWidth
      imgHeight = imgWidth * ratio
    } else {
      imgHeight += offsetHeight
      imgWidth = imgHeight / ratio
    }
    /**
     * Below is us  ed to make sure the imgHW are always larger than (at least equal to) the layerHW,
     * This guarantee the exceedLimitation returns the expect value.
     * p.s. The reason of this the problem which the imgHW somehow smaller than the layerHW might
     * be caused by the 'rounding-number' of the ratio.
     */
    if (imgHeight < layerHeight) {
      imgHeight = layerHeight
      imgWidth = layerHeight / ratio
    } else if (imgWidth < layerWidth) {
      imgWidth = layerWidth
      imgHeight = layerWidth * ratio
    }
    if (this.isHorizon) {
      imgPos.y -= (imgHeight - this.initImgSize.height) / 2
      imgPos.x = this.xSign > 0 ? -(imgWidth - width) : 0
    } else {
      imgPos.x -= (imgWidth - this.initImgSize.width) / 2
      imgPos.y = this.ySign > 0 ? -(imgHeight - height) : 0
    }
    if (this.imgBuffer.x === 0 && this.imgBuffer.y === 0) {
      this.imgBuffer.x = -(imgWidth - this.initImgSize.width) / 2
      this.imgBuffer.y = -(imgHeight - this.initImgSize.height) / 2
    }

    if (updatePos) {
      updatePos(imgPos.x > 0 ? 0 : imgPos.x, imgPos.y > 0 ? 0 : imgPos.y)
    } else {
      this.updateImgPos(LayerUtils.pageIndex, LayerUtils.layerIndex, imgPos.x > 0 ? 0 : imgPos.x, imgPos.y > 0 ? 0 : imgPos.y)
    }

    if (updateSize) {
      updateSize(imgWidth, imgHeight)
    } else {
      this.updateImgSize(LayerUtils.pageIndex, LayerUtils.layerIndex, imgWidth, imgHeight)
    }
  }

  imgClipping(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined, updatePos = null as any, updateSize = null as any) {
    // ControlUtils.updateLayerInitSize(LayerUtils.pageIndex, LayerUtils.layerIndex, width, height, 1)
    const imgX = this.initImgPos.x
    const imgY = this.initImgPos.y

    if (updatePos) {
      updatePos((offsetX ?? 0) + imgX, (offsetY ?? 0) + imgY)
    } else {
      this.updateImgPos(LayerUtils.pageIndex, LayerUtils.layerIndex, (offsetX ?? 0) + imgX, (offsetY ?? 0) + imgY)
    }

    if (updateSize) {
      updateSize(this.initImgSize.width, this.initImgSize.height)
    } else {
      this.updateImgSize(LayerUtils.pageIndex, LayerUtils.layerIndex, this.initImgSize.width, this.initImgSize.height)
    }
  }

  updateImgPos(pageIndex: number, layerIndex: number, imgX: number, imgY: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        imgX,
        imgY
      }
    })
  }

  updateImgSize(pageIndex: number, layerIndex: number, imgWidth: number, imgHeight: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        imgWidth,
        imgHeight
      }
    })
  }

  async getImageSize(url: string, defaultWidth: number, defaultHeight: number, setAnonymous = true): Promise<{ width: number; height: number, exists: boolean }> {
    const loadImage = new Promise<HTMLImageElement>((resolve, reject) => {
      if (!url.includes('appver')) {
        url = this.appendQuery(url, 'appver', APP_VER_FOR_REFRESH_CACHE)
      }
      this.imgLoadHandler(url, (img) => resolve(img), {
        error: () => reject(new Error('Could not load image')),
        crossOrigin: true
      })
    })
    try {
      const img = await loadImage
      return { width: img.width, height: img.height, exists: true }
    } catch (error) {
      return { width: defaultWidth, height: defaultHeight, exists: false }
    }
  }

  adaptToSize(srcSize: { width: number, height: number }, targetSize: { width: number, height: number }): { width: number, height: number, posX: number, posY: number } {
    if (!srcSize.width || !srcSize.height) return { width: srcSize.width, height: srcSize.height, posX: 0, posY: 0 }
    const srcAspectRatio = srcSize.width / srcSize.height
    const targetAspectRatio = targetSize.width / targetSize.height
    let width = 0
    let height = 0
    if (srcAspectRatio > targetAspectRatio) {
      width = targetSize.height * srcAspectRatio
      height = targetSize.height
    } else {
      width = targetSize.width
      height = targetSize.width / srcAspectRatio
    }
    const posX = (targetSize.width - width) / 2
    const posY = (targetSize.height - height) / 2
    return { width, height, posX, posY }
  }

  /**
   * Adapt to size without bleeds if page is in pixel unit, or size with bleeds if page is in physical unit.
   * @param srcSize Source size
   * @param page Target page
   * @returns Adapted size and position
   */
  adaptToPage(srcSize: { width: number, height: number }, page: IPage): { width: number, height: number, posX: number, posY: number } {
    let { width, height, posX, posY } = this.adaptToSize(srcSize, page.unit === 'px' ? page : pageUtils.getPageSizeWithBleeds(page))
    if (page.unit && page.unit !== 'px' && page.bleeds) {
      posX -= page.bleeds.left
      posY -= page.bleeds.top
    }
    return { width, height, posX, posY }
  }

  async getClipImgDimension(clip: IImage, src: string) {
    return this.imgLoadHandler(src, (img: HTMLImageElement) => {
      const imgData = {
        srcObj: {
          type: this.getSrcType(src),
          userId: '',
          assetId: this.getAssetId(src)
        },
        styles: {
          width: img.width,
          height: img.height
        }
      }
      return mouseUtils.clipperHandler(imgData as IImage, clip.clipPath, clip.styles).styles
    })
  }

  getBgRemoveInfo(image: IUserImageContentData, initSrc: string) {
    const isAdmin = store.getters['user/isAdmin']
    const teamId = image.team_id ?? store.getters['user/getTeamId']
    const userId = store.getters['user/getTeamId']

    return {
      width: image.width,
      height: image.height,
      id: image.id,
      assetIndex: image.asset_index,
      teamId: image.team_id,
      urls: {
        prev: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/prev` : image.signed_url?.prev ?? '',
        full: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/full` : image.signed_url?.full ?? '',
        larg: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/larg` : image.signed_url?.larg ?? '',
        original: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/original` : image.signed_url?.original ?? '',
        midd: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/midd` : image.signed_url?.midd ?? '',
        smal: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/smal` : image.signed_url?.smal ?? '',
        tiny: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/tiny` : image.signed_url?.tiny ?? ''
      },
      initSrc
    }
  }

  async getBgRemoveInfoStk(url: string, initSrc: string) {
    const { width, height } = await this.getImageSize(url, 1000, 1000)
    url = this.appendRandomQuery(url)
    return {
      width: width,
      height: height,
      id: '',
      assetIndex: -1,
      teamId: '',
      urls: {
        prev: url,
        full: url,
        larg: url,
        original: url,
        midd: url,
        smal: url,
        tiny: url,
      },
      initSrc
    }
  }

  appendOriginQuery(src: string) {
    if (!src) return src
    if (src.includes('origin=true')) return src
    if (src.includes('?')) {
      return `${src}&origin=true`
    } else {
      return `${src}?origin=true`
    }
  }

  appendRandomQuery(src: string) {
    if (src.includes('?')) {
      return `${src}&rand_ver=${generalUtils.generateRandomString(6)}`
    } else {
      return `${src}?rand_ver=${generalUtils.generateRandomString(6)}`
    }
  }

  appendRefreshAppver(src: string) {
    return this.appendQuery(src, 'appver', APP_VER_FOR_REFRESH_CACHE)
  }

  appendCompQuery(src: string): string {
    if (src.includes('comp=0')) return src
    if (src.includes('?')) {
      return `${src}&comp=0`
    } else {
      return `${src}?comp=0`
    }
  }

  appendCompQueryForVivipic(src: string): string {
    if (src.includes('asset.vivipic.com') || src.includes('template.vivipic.com')) {
      return this.appendCompQuery(src)
    }
    return src
  }
}

export default new ImageUtils()
