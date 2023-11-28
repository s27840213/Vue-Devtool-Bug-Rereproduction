import { useCanvasStore } from "@/stores/canvas"
import { useEditorStore } from "@/stores/editor"
import colorUtils from "@nu/vivi-lib/utils/colorUtils"
import stepsUtils from "@nu/vivi-lib/utils/stepsUtils"

export type EditorTheme = 'light' | 'dark'

const useBiColorEditor = () => {
  const canvasStore = useCanvasStore()
  const editorStore = useEditorStore()

  const isBiColorEditor = computed(() => {
    return editorStore.editorType === 'hidden-message'
  })

  const editorThemes = ref({
    light: '#FFFFFF',
    dark: '#2B2B2B'
  }) as Ref<{ [key in EditorTheme]: string }>

  const currEditorTheme = ref((Object.keys(editorThemes).find(theme => editorThemes.value[theme as EditorTheme] === colorUtils.currPageBackgroundColor) ?? 'dark') as EditorTheme)

  const initBiColorEditor = (theme: EditorTheme) => {
    const oppositeTheme = theme === 'light' ? 'dark' : 'light'
    colorUtils.setCurrPageBackgroundColor(editorThemes.value[theme])
    canvasStore.setCanvasStoreState({drawingColor: editorThemes.value[oppositeTheme]})
  }

  const toggleEditorTheme = () => {
    if (!isBiColorEditor.value) return
    const prevEditorTheme = currEditorTheme.value
    currEditorTheme.value = prevEditorTheme === 'dark' ? 'light' : 'dark'
    colorUtils.setCurrPageBackgroundColor(editorThemes.value[currEditorTheme.value])
    colorUtils.setAllLayerColor(editorThemes.value[prevEditorTheme])
    canvasStore.setCanvasStoreState({ drawingColor: editorThemes.value[prevEditorTheme] })
    stepsUtils.record()
  }

  return {
    isBiColorEditor,
    editorThemes,
    currEditorTheme,
    initBiColorEditor,
    toggleEditorTheme
  }
}

export default useBiColorEditor
