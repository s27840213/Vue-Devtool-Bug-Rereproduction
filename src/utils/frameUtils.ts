import LayerUtils from '@/utils/layerUtils'

class FrameUtils {
  frameClipFormatter(path: string) {
    return "<path d='" + path + "'></path>"
  }
}

export default new FrameUtils()
