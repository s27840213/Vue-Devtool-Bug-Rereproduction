export const editorTypes = ['powerful-fill', 'hidden-message'] as const
export type EditorType = typeof editorTypes[number]
// the state of each process
export type PowerfulfillStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type HiddenMessageStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type EditorStates = Array<PowerfulfillStates>
//
export type EditorFeature = 'none' | 'cm_brush' | 'selection' | 'add'
export type PowerfulFillCanvasMode = 'brush' | 'erase' | 'move'
