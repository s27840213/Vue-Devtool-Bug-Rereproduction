export const editorTypes = ['powerful-fill', 'hidden-message', 'magic-combined'] as const
export type EditorType = (typeof editorTypes)[number]
// the state of each process
export type PowerfulfillStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type HiddenMessageStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type MagicCombinedStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type EditorStates = Array<PowerfulfillStates | HiddenMessageStates | MagicCombinedStates>
//
export type EditorFeature = 'none' | 'cm_brush' | 'selection' | 'add'
export type PowerfulFillCanvasMode = 'brush' | 'erase' | 'move'

export type DescriptionPanel = 'hidden-message/help' | 'hidden-message/invert' | 'hidden-message/bgrm'

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
  iconActive?: string
  active?: boolean
  value: number
}
export type GenImageDualRangeOption = Omit<GenImageRangeOption, 'type' | 'value'> & {
  type: 'dual-range',
  value: {
    from: number,
    to: number
  }
}

export type GenImageOption = GenImageGroupOption | GenImageRangeOption | GenImageDualRangeOption
export type GenImageOptionToSave = {
  [key: GenImageOption['key']]: GenImageOption['value']
}
