import store from '@/store'
import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
import { IBounding, ISize } from '@/interfaces/math'
import ControlUtils from './controlUtils'
import LayerUtils from './layerUtils'
import FrameUtils from './frameUtils'
import { IAssetPhoto, IUserImageContentData } from '@/interfaces/api'
import generalUtils from './generalUtils'
class ImageUtils {
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

  getSrc(config: IImage, size?: string | number): string {
    if (config.previewSrc) {
      return config.previewSrc
    }

    const { type, userId, assetId } = config.srcObj || config.src_obj || {}
    if (typeof size === 'undefined' && config.styles) {
      const { imgWidth, imgHeight } = config.styles
      size = this.getSrcSize(
        type,
        config.styles ? this.getSignificantDimension(imgWidth, imgHeight) * store.getters.getPageScaleRatio / 100 : 0
      )
    }
    switch (type) {
      case 'public':
        return `https://template.vivipic.com/admin/${userId}/asset/image/${assetId}/${size}?origin=true&ver=03302022`
      case 'private': {
        const editorImg = store.getters['file/getEditorViewImages']
        return editorImg(assetId) ? editorImg(assetId)[size as string] + '&origin=true&ver=03302022' : ''
      }
      case 'unsplash':
        return `https://images.unsplash.com/${assetId}?cs=tinysrgb&q=80&w=${size}&origin=true`
      case 'pexels':
        return `https://images.pexels.com/photos/${assetId}/pexels-photo-${assetId}.${userId}?auto=compress&cs=tinysrgb&w=${size}&origin=true`
      case 'background':
        return `https://template.vivipic.com/background/${assetId}/full?origin=true&ver=03302022`
      case 'frame':
        return require('@/assets/img/svg/frame.svg')
      default:
        return ''
    }
  }

  getSrcSize(type: string, dimension: number, preload = '') {
    const key = type === 'pexels' || type === 'unsplash' ? 'size' : 'key'
    const sizeMap = (store.state as any).user.imgSizeMap
    if (sizeMap?.length) {
      let i = 0
      while (dimension <= sizeMap[i].size && i < sizeMap.length - 1) {
        i++
      }
      i = Math.max(i - 1, 0)
      return preload
        ? preload === 'pre' ? sizeMap[i + 1 >= sizeMap.length - 1 ? sizeMap.length - 1 : i + 1][key] : sizeMap[i - 1 <= 0 ? 0 : i - 1][key]
        : sizeMap[i][key]
    }
    return type === 'pexels' || type === 'unsplash' ? 1080 : 'full'
  }

  getSignificantDimension(width: number, height: number) {
    return Math.max(width, height)
  }

  getSrcType(src: string) {
    if (src.includes('unsplash')) return 'unsplash'
    if (src.includes('pexels')) return 'pexels'
    if (src.includes('template.vivipic')) return 'public'
    if (src.includes('asset.vivipic')) return 'private'
    return ''
  }

  getUserId(src: string, type: string) {
    switch (type) {
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

  getAssetId(src: string, type: string) {
    switch (type) {
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
      case 'private':
        return src
      default:
        return ''
    }
  }

  setImgControlDefault() {
    const { pageIndex, layerIndex, getCurrLayer: currLayer } = LayerUtils
    if (currLayer) {
      switch (currLayer.type) {
        case 'image':
          LayerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false })
          break
        case 'group': {
          const primaryLayer = currLayer as IGroup
          for (let i = 0; i < primaryLayer.layers.length; i++) {
            const props = {
              active: false
            } as { [key: string]: boolean | string | number }

            if (primaryLayer.layers[i].type === 'image') {
              props.imgControl = false
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
    ControlUtils.updateLayerInitSize(LayerUtils.pageIndex, LayerUtils.layerIndex, layerWidth, layerHeight, 1)
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
    ControlUtils.updateLayerInitSize(LayerUtils.pageIndex, LayerUtils.layerIndex, width, height, 1)
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

  async getImageSize(url: string, defaultWidth: number, defaultHeight: number): Promise<{ width: number; height: number, exists: boolean }> {
    const loadImage = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not load image'))
      image.src = url
    })
    try {
      const img = await loadImage
      return { width: img.width, height: img.height, exists: true }
    } catch (error) {
      return { width: defaultWidth, height: defaultHeight, exists: false }
    }
  }

  adaptToSize(srcSize: { width: number, height: number }, targetSize: { width: number, height: number }): { width: number, height: number, posX: number, posY: number } {
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

  getBgRemoveInfo(image: IUserImageContentData, initSrc: string) {
    const isAdmin = store.getters['user/isAdmin']
    const teamId = image.team_id ?? store.getters['user/getTeamId']
    const userId = store.getters['user/getTeamId']
    console.log(image)
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

  appendOriginQuery(src: string) {
    if (src.includes('origin=true')) return src
    if (src.includes('?')) {
      return `${src}&origin=true`
    } else {
      return `${src}?origin=true`
    }
  }

  appendRandomQuery(src: string) {
    if (src.includes('?')) {
      return `${src}&ver=${generalUtils.generateRandomString(6)}`
    } else {
      return `${src}?ver=${generalUtils.generateRandomString(6)}`
    }
  }
}

export default new ImageUtils()
