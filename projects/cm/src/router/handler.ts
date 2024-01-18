import { useEditorStore } from '@/stores/editor'
import type { EditorType, GenImageOption } from '@/types/editor'
import { editorTypes } from '@/types/editor'
import store from '@/vuex'
import constantData from '@nu/vivi-lib/utils/constantData'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import VueRouter from 'vue-router'

const isValidType = (x: string | null): x is EditorType => editorTypes.includes(x)

export async function editorRouteHandler(
  _to: VueRouter.RouteLocationNormalized,
  from: VueRouter.RouteLocationNormalized,
  next: VueRouter.NavigationGuardNext,
) {
  try {
    next()
    const { query } = _to
    const urlParams = new URLSearchParams()

    Object.entries(query).forEach(([key, val]) => {
      urlParams.append(key, val as string)
    })

    const type = urlParams.get('type')
    const width = parseInt(urlParams.get('width') ?? '900')
    const height = parseInt(urlParams.get('height') ?? '1600')
    if (!isValidType(type)) throw new Error('Invalid editor type.')

    const editorStore = useEditorStore()
    const { editorType, currDesignId, currGenOptions } = storeToRefs(editorStore)
    const { setEditorType, setPageSize, setCurrActiveFeature, setCurrGenOptions } =
      editorStore
    setEditorType(type)
    setPageSize(width, height)
    if (!currGenOptions.value?.length || !currDesignId.value) setCurrGenOptions((constantData.getGenImageOptions(editorType.value) as GenImageOption[]) ?? [])
    
    switch (type) {
      case 'powerful-fill':
        break
      case 'hidden-message':
        setCurrActiveFeature('add')
        break
      default:
        break
    }
  } catch (error) {
    logUtils.setLogForError(error as Error)
  }
}
