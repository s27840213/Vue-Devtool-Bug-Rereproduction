export const editorTypes = ['powerful-fill', 'hidden-message'] as const
export type EditorType = typeof editorTypes[number]
// the state of each process
export type PowerfulfillStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type HiddenMessageStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type EditorStates = Array<PowerfulfillStates>
//
export type EditorFeature = 'none' | 'cm_brush' | 'selection' | 'add'
export type PowerfulFillCanvasMode = 'brush' | 'erase' | 'move'

export type DescriptionPanel = 'hidden-message' | 'hidden-message-invert' | 'hidden-message-bgrm'

// gen image options
export type GenImageGroupOption = {
  type: 'group'
  key: string
  group: {
    key: string
    text: string
    img?: string
  }[]
  value: number
}
export type GenImageRangeOption = {
  type: 'range'
  key: string
  title: string
  subTitle?: string
  minDescription?: string
  maxDescription?: string
  min: number
  max: number
  step: number
  icon?: string
  value: number
}
export type GenImageOptions = Array<GenImageGroupOption | GenImageRangeOption>
