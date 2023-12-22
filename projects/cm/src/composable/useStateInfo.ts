import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const useStateInfo = () => {
  const { path } = toRefs(useRoute())
  const { currentRoute } = toRefs(useRouter())
  const editorStore = useEditorStore()

  // #region routing state
  const atHome = computed(() => path.value === '/')
  const atMyDesign = computed(() => path.value === '/mydesign')
  const atSettings = computed(() => path.value === '/settings')
  const atMainPage = computed(() => atHome.value || atMyDesign.value)
  const atDescription = computed(() => path.value === '/description')
  const atEditor = computed(() => path.value === '/editor')
  const atEventTester = computed(() => path.value === '/nativeevttest')
  const atScreenshot = computed(() => currentRoute.value.name === 'Screenshot')
  const atNonUI = computed(() => atScreenshot.value || atEventTester.value)
  // #endregion

  // #region editor state
  const {
    inGenResultState,
    inAspectRatioState,
    inEditingState,
    inSavingState,
    showBrushOptions,
    showSelectionOptions,
    showDescriptionPanel,
  } = storeToRefs(editorStore)

  const showHomeTabs = computed(() => atHome.value || atMyDesign.value)

  // #endregion

  const userStore = useUserStore()
  const { isDesignOpen, isSubDesignOpen } = storeToRefs(userStore)

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
    atDescription,
    atEventTester,
    atScreenshot,
    atNonUI,
    showHomeTabs,
    inGenResultState,
    inAspectRatioState,
    inEditingState,
    inSavingState,
    showBrushOptions,
    showSelectionOptions,
    showImgSelector,
    showDescriptionPanel,
    isDesignOpen,
    isSubDesignOpen,
  }
}

export default useStateInfo
