import { useEditorStore } from '@/stores/editor'
import { storeToRefs } from 'pinia'

const useStateInfo = () => {
  const { path } = toRefs(useRoute())
  const editorStore = useEditorStore()
  const { editorState } = storeToRefs(editorStore)

  // #region routing state
  const atHome = computed(() => path.value === '/')
  const atMyDesign = computed(() => path.value === '/mydesign')
  const atEditor = computed(() => path.value === '/editor')
  // #endregion

  // #region editor state
  const showHomeTabs = computed(() => atHome.value || atMyDesign.value)
  const showAspectRatioSelector = computed(
    () => atEditor.value && editorState.value === 'aspectRatio'
  )
  const showEditingOpstions = computed(() => atEditor.value && editorState.value === 'editing')
  const showPromptArea = computed(() => atEditor.value && editorState.value === 'prompt')
  // #endregion

  return {
    atHome,
    atMyDesign,
    atEditor,
    showHomeTabs,
    showAspectRatioSelector,
    showEditingOpstions,
    showPromptArea
  }
}

export default useStateInfo
