// import store from '@/store'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

class LayerFactary {
  newImage(x: number, y: number, pageIndex: number) {
    return {
      type: 'image',
      pageIndex: pageIndex,
      src: require('@/assets/img/svg/img-tmp.svg'),
      active: false,
      shown: false,
      styles: {
        x: x,
        y: y,
        scale: 1,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: 150,
        height: 150,
        initWidth: 150,
        initHeight: 150
      }
    }
  }

  newText() {
    return {

    }
  }

  newGroup(pageIndex: number, styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>) {
    return {
      pageIndex: pageIndex,
      type: 'group',
      active: false,
      shown: false,
      styles: {
        x: styles.x,
        y: styles.y,
        scale: 0,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: styles.width,
        height: styles.height
      },
      layers: layers
    }
  }

  newTmp(pageIndex: number, styles: ICalculatedGroupStyle, layers: Array<IShape | IText | IImage | IGroup>) {
    return {
      pageIndex: pageIndex,
      type: 'tmp',
      active: true,
      shown: false,
      styles: {
        x: styles.x,
        y: styles.y,
        scale: 0,
        scaleX: 0,
        scaleY: 0,
        rotate: 0,
        width: styles.width,
        height: styles.height
      },
      layers: layers
    }
  }

  newShape() {
    return {

    }
  }
}

const layerFactary = new LayerFactary()

export default layerFactary
