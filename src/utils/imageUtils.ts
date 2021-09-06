import { IImage } from '@/interfaces/layer'

class ImageUtils {
  getSrc(config: IImage) {
    const { type, userId, assetId } = config.srcObj || config.src_obj
    const size = this.getSrcSize(type, config.styles.imgWidth)
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
      case 'public':
        return src.substring(src.indexOf('admin/') + 6, src.indexOf('/asset'))
      default:
        return ''
    }
  }

  getAssetId(src: string, type: string) {
    switch (type) {
      case 'public': {
        const substr = src.substring(src.indexOf('image/'))
        return substr.substring(6, src.indexOf('/'))
      }
      case 'unsplash':
        return src.substring(src.indexOf('com/') + 4, src.indexOf('?'))
      case 'pexels':
        return src.substring(src.indexOf('photos/') + 7, src.indexOf('/pexels'))
      default:
        return ''
    }
  }
}

export default new ImageUtils()
