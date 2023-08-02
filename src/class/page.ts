import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import { IBackgroundImage, IPage } from '@/interfaces/page'
import generalUtils from '@/utils/generalUtils'
import layerFactary from '@/utils/layerFactary'
import SnapUtils from '@/utils/snapUtils'

export class Page implements IPage {
  [index: string]: unknown
  id: string
  snapUtils: SnapUtils
  width: number
  height: number
  x: number
  y: number
  physicalWidth: number
  physicalHeight: number
  unit: string
  backgroundColor: string
  backgroundImage: IBackgroundImage
  name: string
  layers: Array<IShape | IText | IImage | IGroup | IFrame>
  documentColors: Array<string>
  designId: string
  modified?: boolean
  guidelines: {
    [index: string]: Array<number>
    v: Array<number>
    h: Array<number>
  }
  mobilePhysicalSize: { originSize: ISize, initPos: ICoordinate }

  isEnableBleed: boolean
  bleeds: {
    top: number
    bottom: number
    left: number
    right: number
  }

  physicalBleeds: {
    top: number
    bottom: number
    left: number
    right: number
  }

  contentScaleRatio: number

  constructor() {
    this.mobilePhysicalSize = {
      initPos: { x: 0, y: 0 },
      originSize: { width: 0, height: 0 },
    }
    this.shownSize = { width: 0, height: 0 }
    this.snapUtils = new SnapUtils(-1)
    this.width = 1080
    this.height = 1080
    this.x = 0
    this.y = 0
    this.physicalWidth = 1080
    this.physicalHeight = 1080
    this.unit = 'px'
    this.backgroundColor = '#ffffff'
    this.backgroundImage = {
      config: layerFactary.newImage({
        srcObj: {
          type: '',
          userId: '',
          assetId: ''
        },
        styles: {
          width: 0,
          height: 0,
          scale: 1,
          zindex: -1,
          opacity: 100
        }
      }),
      posX: -1,
      posY: -1
    }
    this.name = ''
    this.layers = [
    ]
    this.documentColors = []
    this.designId = ''
    this.id = generalUtils.generateRandomString(8)
    this.guidelines = {
      v: [],
      h: []
    }
    this.isEnableBleed = false
    this.bleeds = {
      top: 11,
      bottom: 11,
      left: 11,
      right: 11
    }
    this.physicalBleeds = {
      top: 11,
      bottom: 11,
      left: 11,
      right: 11
    }
    this.contentScaleRatio = 1
  }
}
