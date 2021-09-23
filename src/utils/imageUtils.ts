import { IImage } from '@/interfaces/layer'

class ImageUtils {
  getSrc(config: IImage) {
    const { type, userId, assetId } = config.srcObj || config.src_obj
    const size = this.getSrcSize(type, config.styles ? config.styles.imgWidth : 0)
    switch (type) {
      case 'public':
        return `https://template.vivipic.com/admin/${userId}/asset/image/${assetId}/${size}`
      case 'private':
        // TODO
        return `https://d28vpyd7xcfiwl.cloudfront.net/${assetId}/*`
      case 'unsplash':
        return `https://images.unsplash.com/${assetId}?cs=tinysrgb&q=80&w=${size}`
      case 'pexels':
        return `https://images.pexels.com/photos/${assetId}/pexels-photo-${assetId}.jpeg?auto=compress&cs=tinysrgb&w=${size}`
      case 'background':
        return `https://template.vivipic.com/background/${assetId}/full`
      case 'frame':
        return require('@/assets/img/svg/frame.svg')
      default:
        return ''
    }
  }

  getSrcSize(type: string, width: number) {
    if (type === 'pexels' || type === 'unsplash') {
      if (width < 540) {
        return 540
      } else if (width < 800) {
        return 800
      } else if (width < 1080) {
        return 1080
      } else {
        return 1600
      }
    } else {
      return 'full'
    }
  }

  getSrcType(src: string) {
    if (src.includes('unsplash')) return 'unsplash'
    if (src.includes('pexels')) return 'pexels'
    // TODO:
    if (src.includes('vivipic')) {
      return 'public'
    } else {
      return 'private'
    }
  }

  getUserId(src: string, type: string) {
    switch (type) {
      case 'public': {
        const keyStart = 'admin/'
        const keyEnd = '/asset'
        return src.substring(src.indexOf(keyStart) + keyStart.length, src.indexOf(keyEnd))
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
      default:
        return ''
    }
  }
}

export default new ImageUtils()
