export type EditorType = 'powerful-fill'
// the state of each process
export type PowerfulfillStates = 'aspectRatio' | 'editing' | 'genResult' | 'saving'
export type EditorStates = Array<PowerfulfillStates>
//
export type EditorFeature = 'none' | 'brush' | 'selection' | 'add'
export type PowerfulFillCanvasMode = 'brush' | 'erase' | 'move'
