import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import { IBackgroundImage, IPage } from '@/interfaces/page'
import generalUtils from '@/utils/generalUtils'
import layerFactary from '@/utils/layerFactary'

export class Page implements IPage {
  [index: string]: unknown
  id: string
  width: number
  height: number
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

  isAutoResizeNeeded: boolean

  constructor() {
    this.width = 1080
    this.height = 1080
    this.physicalWidth = 28.575
    this.physicalHeight = 28.575
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
    this.isAutoResizeNeeded = false
  }
}
