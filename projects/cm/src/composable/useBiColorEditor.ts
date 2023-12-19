import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { EditorType } from '@/types/editor'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'

type BiColorTheme = {
  name: string
  bgColor: string
  fgColor: string
  toggleIcon: string
}

const editorThemes: Partial<{ [key in EditorType]: BiColorTheme[] }> = {
  'hidden-message': [
    {
      name: 'dark',
      bgColor: '#2B2B2B',
      fgColor: '#FFFFFF',
      toggleIcon: 'toggle-color-dark',
    },
    {
      name: 'light',
      bgColor: '#FFFFFF',
      fgColor: '#2B2B2B',
      toggleIcon: 'toggle-color-light',
    },
  ],
}

const useBiColorEditor = () => {
  const canvasStore = useCanvasStore()
  const editorStore = useEditorStore()

  const isBiColorEditor = computed(() => {
    return Object.keys(editorThemes).includes(editorStore.editorType)
  })

  // returns undefined if is not bi-color editor
  const currEditorThemes = computed(() => {
    return editorThemes[editorStore.editorType]
  })

  // returns undefined if is not bi-color editor
  const currEditorTheme = computed(() => {
    return currEditorThemes.value?.find((theme) => theme.name === editorStore.editorTheme)
  })

  const applyEditorTheme = (theme: BiColorTheme) => {
    editorStore.setEditorTheme(theme.name)
    colorUtils.setCurrPageBackgroundColor(theme.bgColor)
    colorUtils.setAllLayerColor(theme.fgColor)
    canvasStore.setDrawingColor(theme.fgColor)
  }

  const initBiColorEditor = (editorType: EditorType) => {
    const editorTheme = editorThemes[editorType]?.[0]
    if (!editorTheme) return
    applyEditorTheme(editorTheme)
  }

  const toggleEditorTheme = () => {
    if (!currEditorThemes.value) return
    const idxCurrEditorTheme = currEditorThemes.value.findIndex(
      (theme) => theme.name === editorStore.editorTheme,
    )
    const nextEditorTheme =
      currEditorThemes.value[(idxCurrEditorTheme + 1) % currEditorThemes.value.length]
    applyEditorTheme(nextEditorTheme)
  }

  return {
    isBiColorEditor,
    /**
     * returns undefined if is not bi-color editor
     */
    currEditorTheme,
    applyEditorTheme,
    initBiColorEditor,
    toggleEditorTheme,
  }
}

export default useBiColorEditor
