import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import { storeToRefs } from 'pinia'

const useStateInfo = () => {
  const { path } = toRefs(useRoute())
  const editorStore = useEditorStore()

  // #region routing state
  const atHome = computed(() => path.value === '/')
  const atMyDesign = computed(() => path.value === '/mydesign')
  const atSettings = computed(() => path.value === '/settings')
  const atMainPage = computed(() => atHome.value || atMyDesign.value)
  const atEditor = computed(() => path.value === '/editor')
  const atEventTester = computed(() => path.value === '/nativeevttest')
  // #endregion

  // #region editor state
  const {
    inGenResultState,
    inAspectRatioState,
    inEditingState,
    inSavingState,
    showBrushOptions,
    showSelectionOptions,
  } = storeToRefs(editorStore)

  const showHomeTabs = computed(() => atHome.value || atMyDesign.value)

  // #endregion

  // #region img selector state
  const imgSelectorStore = useImgSelectorStore()
  const { showImgSelector } = storeToRefs(imgSelectorStore)
  // #endregion

  return {
    atHome,
    atMyDesign,
    atEditor,
    atSettings,
    atMainPage,
    atEventTester,
    showHomeTabs,
    inGenResultState,
    inAspectRatioState,
    inEditingState,
    inSavingState,
    showBrushOptions,
    showSelectionOptions,
    showImgSelector,
  }
}

export default useStateInfo
