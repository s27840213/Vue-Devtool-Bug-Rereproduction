import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
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

  isAutoResizeNeeded: boolean

  constructor() {
    this.snapUtils = new SnapUtils(-1)
    this.width = 1080
    this.height = 1080
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
    this.isAutoResizeNeeded = false
  }
}
