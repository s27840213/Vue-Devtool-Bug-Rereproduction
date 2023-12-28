import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import type { GenImageParams } from '@/types/api'
import { ICmMyDesign, ICmSubDesign, IMyDesignType, ITmpSubDesign } from '@/types/user'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import cmWVUtils, { IListAssetResponse } from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { defineStore } from 'pinia'
import { useEditorStore } from './editor'

export const useUserStore = defineStore('user', () => {
  const editorStore = useEditorStore()
  const {
    setCurrDesignThumbIndex,
    startEditing,
    setCurrPrompt,
    setMaskDataUrl,
    setCurrGenResultIndex,
    setInitImgSrc
  } = editorStore
  const {
    currDesignId,
    currSubDesignId,
    editorType,
    currDesignThumbIndex,
    generatedResults,
    pageSize,
    currPrompt
  } =
    storeToRefs(editorStore)

  const { t } = useI18n()

  const prevGenParams = reactive({
    requestId: '',
    params: {} as GenImageParams,
  })

  const setPrevGenParams = (params: { requestId: string; params: GenImageParams }) => {
    Object.assign(prevGenParams, params)
  }

  // #region Variable declare
  const MYDESIGN_TAGS: Array<{ label: string; type: IMyDesignType }> = [
    {
      label: t('NN0324'),
      type: 'all',
    },
    {
      label: t('CM0001'),
      type: 'powerful-fill',
    },
    {
      label: t('CM0078'),
      type: 'hidden-message',
    },
  ]

  const getDefaultMyDesignFiles = (): { [key: string]: ICmMyDesign[] } => {
    const res = {} as { [key: string]: ICmMyDesign[] }
    for (const type of MYDESIGN_TAGS) {
      res[type.type] = []
    }
    return res
  }

  const getDefaultMyDesignNextPages = (): { [key: string]: number } => {
    const res = {} as { [key: string]: number }
    for (const tag of MYDESIGN_TAGS) {
      res[tag.type] = -1
    }
    return res
  }

  const myDesignTags = reactive(MYDESIGN_TAGS)
  const myDesignFilesMap = reactive(getDefaultMyDesignFiles())
  const myDesignNextPagesMap = reactive(getDefaultMyDesignNextPages())
  const myDesignBuffer = reactive({} as unknown as ICmMyDesign)
  const currMyDesignType = ref<IMyDesignType>('all')
  const currOpenDesign = ref<ICmMyDesign | undefined>(undefined)
  const currOpenSubDesign = ref<ICmSubDesign | undefined>(undefined)

  const isDesignOpen = computed(() => {
    return currOpenDesign.value !== undefined
  })

  const isSubDesignOpen = computed(() => {
    return currOpenSubDesign.value !== undefined
  })

  const currDesigns = computed(() => {
    return myDesignFilesMap[currMyDesignType.value]
  })

  const currNextPages = computed(() => {
    return myDesignNextPagesMap[currMyDesignType.value]
  })
  // #endregion

  // #region getter and setter
  const getDesignsByType = (type: string) => {
    return myDesignFilesMap[type] ?? []
  }

  const getDesginTypeByKey = (key: string) => {
    return key === 'all' ? 'all' : (key.replace('mydesign-', '') as IMyDesignType)
  }

  const getNextPageIndexByType = (type: string) => {
    return myDesignNextPagesMap[type] ?? -1
  }

  const setCurrMyDesignType = (type: IMyDesignType) => {
    currMyDesignType.value = type
  }

  const setCurrOpenSubDesign = (subDesign: ICmSubDesign | undefined) => {
    currOpenSubDesign.value = subDesign
  }

  const setCurrOpenDesign = (design: ICmMyDesign | undefined) => {
    currOpenDesign.value = design
  }

  const getSubDesignConfig = async (
    myDesign: ICmMyDesign | Pick<ICmMyDesign, 'id' | 'type'>, 
    subDesignId: string,
    name = 'original'
  ) => {
    const { id, type } = myDesign
    const data = (await cmWVUtils.getJson(`mydesign-${type}/${id}/${subDesignId}`, name)) as {
      flag: '0' | '1'
      name: string
      path: string
      content: ICmSubDesign
    } | undefined | null
    return data
  }
  // #endregion

  // #region edit sub design
  const initWithSubDeisgnImage = async (subDesign: ICmSubDesign) => {

    try {
      const { id, subId, type, width, height, prompt } = subDesign
      const thumbUrl = getSubDesignThumbUrl(type, id, subId,  Math.max(width, height))
      const resultUrl = getTargetImageUrl(type, id, subId, 'result')

      // Copy thumb img to result img.
      const thumb = await generalUtils.toDataUrlNew(thumbUrl)
      await saveDesignImageToDocument(thumb, 'result', {
        designId: id,
        subDesignId: subId,
        myDesignEditorType: type,
      })

      // Create new design with result img.
      pageUtils.setPages([pageUtils.newPage({ width, height })])
      assetUtils.addImage(resultUrl, width / height, {
        fit: 1,
        record: false,
        select: false,
        styles: {
          adjust: {
            ...(editorType.value === 'hidden-message' && { saturate: -100 }),
            invert: true,
          },
        },
      })
      startEditing('powerful-fill', {
        stateTarget: 'editing',
        designName: 'result',
        designId: id,
        generatedResults: currOpenDesign.value?.subDesignInfo.map((subDesign) => {
          return {
            id: subDesign.id,
            url: getSubDesignThumbUrl(type, id, subDesign.id, Math.max(width, height)),
            prompt,
          }
        }),
        designWidth: width,
        designHeight: height,
      })

      setMaskDataUrl('')
      setCurrPrompt('')
      setInitImgSrc(resultUrl)

      const index = currOpenDesign.value?.subDesignInfo.findIndex((item) => item.id === subId)
      index && setCurrGenResultIndex(index)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const editSubDesignResult = async() => { // Do the same thing with editor.keepEditingInit.
    if (!currOpenDesign.value || !currOpenSubDesign.value) return false
    const { subId } = currOpenSubDesign.value

    // Try to open result.json.
    const subDesignData = await getSubDesignConfig(currOpenDesign.value, subId, 'result')
    // if (subDesignData.flag === '0') {
    if (subDesignData) {
      initWithSubDesignConfig(subDesignData.content)
      return
    }

    // Cannot find result.json, use result img to create new design.
    initWithSubDeisgnImage(currOpenSubDesign.value)
  }
  // #endregion

  // recreate
  const initWithSubDesignConfig = async (
    subDesign: ICmSubDesign,
    // options?: { addMask: boolean },
  ) => {
    // const { addMask = true } = options || {}
    try {
      const { convertToPinkBasedMask } = useCanvasUtils()
      const { pages, type, prompt, id, fileName, subId, width, height } = subDesign
      
      setCurrPrompt(prompt)
      pageUtils.setPages(pages)

      if (fileName === 'original' && type === 'powerful-fill') {
        const maskUrl = await convertToPinkBasedMask(
          getTargetImageUrl(type, id, subId, 'mask', 400),
          width,
          height,
        )
        setMaskDataUrl(maskUrl)
      }

      startEditing(type, {
        stateTarget: 'editing',
        designName: fileName,
        designId: id,
        generatedResults: currOpenDesign.value?.subDesignInfo.map((subDesign) => {
          return {
            id: subDesign.id,
            url: getSubDesignThumbUrl(type, id, subDesign.id, Math.max(width, height)),
            prompt,
          }
        }),
        designWidth: width,
        designHeight: height,
      })

      const index = currOpenDesign.value?.subDesignInfo.findIndex((item) => item.id === subId)
      index && setCurrGenResultIndex(index)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const setDesignsByType = (
    type: IMyDesignType,
    designs: ICmMyDesign[],
    overrideDesigns = false,
  ) => {
    const targetDesigns = myDesignFilesMap[type]
    if (targetDesigns.length === 0 || overrideDesigns) {
      myDesignFilesMap[type] = designs
    } else {
      myDesignFilesMap[type].push(...designs)
    }
  }

  const setNextPageByType = (type: IMyDesignType, nextPage: number | string) => {
    myDesignNextPagesMap[type] = typeof nextPage === 'string' ? parseInt(nextPage) : nextPage
  }

  const listDesigns = async (
    type: IMyDesignType,
    fetchNextPage?: number,
    overrideDesigns = false,
  ) => {
    try {
      let data = undefined as unknown as IListAssetResponse
      if (fetchNextPage) {
        data = (await cmWVUtils.listMoreAsset(
          type === 'all' ? 'all' : `mydesign-${type}`,
          getNextPageIndexByType(type),
          type === 'all' ? 'mydesign' : undefined,
          true,
        )) as IListAssetResponse
      } else {
        data = (await cmWVUtils.listAsset(
          type === 'all' ? 'all' : `mydesign-${type}`,
          type === 'all' ? 'mydesign' : undefined,
          true,
        )) as IListAssetResponse
      }

      const { flag, assets, key, nextPage } = data
      if (flag === '1') throw new Error('list my design failed')

      const designs = assets as ICmMyDesign[]
      const currType = getDesginTypeByKey(key)
      setDesignsByType(currType, designs, overrideDesigns)
      setNextPageByType(currType, nextPage)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const updateDesignsInStore = (design: ICmMyDesign) => {
    // first find if the design id exsit in the store
    const indexInAll = myDesignFilesMap.all.findIndex((item) => item.id === design.id)
    const indexInType = myDesignFilesMap[design.type].findIndex((item) => item.id === design.id)
    if (indexInAll !== -1) {
      // remove the old one
      myDesignFilesMap.all.splice(indexInAll, 1)
      // unshift the new one
      myDesignFilesMap.all.unshift(design)
    }
    if (indexInType !== -1) {
      // remove the old one
      myDesignFilesMap[design.type].splice(indexInType, 1)
      // unshift the new one
      myDesignFilesMap[design.type].unshift(design)
    }

    if (indexInAll === -1 && indexInType === -1) {
      myDesignFilesMap.all.unshift(design)
      myDesignFilesMap[design.type].unshift(design)
    }
  }

  const deleteDesignFromStore = (design: ICmMyDesign) => {
    const indexInAll = myDesignFilesMap.all.findIndex((item) => item.id === design.id)
    const indexInType = myDesignFilesMap[design.type].findIndex((item) => item.id === design.id)

    if (indexInAll !== -1) {
      myDesignFilesMap.all.splice(indexInAll, 1)
    }
    if (indexInType !== -1) {
      myDesignFilesMap[design.type].splice(indexInAll, 1)
    }
  }

  const deleteSubDesignFromStore = (design: ITmpSubDesign) => {
    const { id, subId, type, thumbIndex } = design

    const removeFromMap = async (
      myDesignMap: {
        [key: string]: ICmMyDesign[]
      },
      key: string,
      index: number,
    ) => {
      if (index !== -1) {
        const isLastSubDesign = myDesignMap[key][index].subDesignInfo.length === 1
        const subDesignInfo = myDesignMap[key][index].subDesignInfo

        const subDesignIndex = subDesignInfo.findIndex((item) => item.id === subId)
        if (subDesignIndex === -1) return
        const isThumb = thumbIndex === subDesignIndex

        if (isThumb && isLastSubDesign) {
          deleteDesign(currOpenDesign.value as ICmMyDesign)
          setCurrOpenDesign(undefined)
          return
        }

        if (isThumb && !isLastSubDesign) myDesignMap[key][index].thumbIndex = 0
        subDesignInfo.splice(subDesignIndex, 1)
        await cmWVUtils.addAsset(
          `mydesign-${editorType.value}`,
          currOpenDesign.value,
          undefined,
          'mydesign',
        )
      }
    }

    const indexInAll = myDesignFilesMap.all.findIndex((item) => item.id === id)
    removeFromMap(myDesignFilesMap, 'all', indexInAll)

    const indexInType = myDesignFilesMap[type].findIndex((item) => item.id === id)
    removeFromMap(myDesignFilesMap, type, indexInType)
  }

  const deleteDesign = async (design: ICmMyDesign) => {
    try {
      const { type, id } = design
      const data = await cmWVUtils.deleteAsset(`mydesign-${type}`, id, 'mydesign')
      const { flag } = data ?? { flag: '1' }
      if (flag === '1') {
        throw new Error('delete design failed')
      } else {
        deleteDesignFromStore(design)
        // notify({
        //   group: 'success',
        //   text: `${t('NN0889')}`,
        // })
      }
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const deleteSubDesign = async (design: ITmpSubDesign) => {
    try {
      const { id, subId, type } = design
      const data = await cmWVUtils.deleteAsset(
        `mydesign-${type}`,
        `${id}/${subId}`,
        undefined,
        false,
      )

      const { flag } = data ?? { flag: '1' }
      if (flag === '1') {
        throw new Error('delete sub design failed')
      } else {
        deleteSubDesignFromStore(design)
        // notify({
        //   group: 'success',
        //   text: `${t('NN0889')}`,
        // })
      }
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  /**
   * @Note this is only used for editor saving the mask and init image
   */
  const saveDesignImageToDocument = async (
    url: string,
    fileName: string,
    props?: {
      type?: 'png' | 'jpg'
      subDesignId?: string
      thumbIndex?: number
      designId?: string
      myDesignEditorType?: string
    },
  ) => {
    const { 
      subDesignId,
      type = 'jpg',
      thumbIndex,
      designId = currDesignId.value,
      myDesignEditorType = editorType.value,
    } = props ?? {}

    if (thumbIndex !== undefined) {
      setCurrDesignThumbIndex(thumbIndex)
    }
    const data = (await cmWVUtils.saveAssetFromUrl(type, url, {
      key: `mydesign-${myDesignEditorType}/${designId}`,
      ...(subDesignId && { subPath: subDesignId }),
      name: fileName,
    })) ?? {
      flag: '1',
      fileId: '',
    }

    return data
  }

  const saveSubDesign = async (path: string, subDesignId: string, name: 'original' | 'result' = 'original') => {
    try {
      if (cmWVUtils.inBrowserMode) return
      const pages = uploadUtils.prepareJsonToUpload(pageUtils.getPages)
      const isValidJson = await cmWVUtils.isValidJson(pages)
      if (!isValidJson) {
        logUtils.setLog('Saving design as myDesign failed, because the design json is invalid')
        // TODO - upload the reported design, maybe discuss with TingAn
        // this.uploadReportedDesign()
        // this.setLoadingOverlayShow(false)
        throw new Error('save design failed')
      }

      // TODO - ask Nathan this feature is needed for Charimx or not
      // await Promise.race([
      //   imageShadowUtils.iosImgDelHandler(),
      //   new Promise((resolve) => setTimeout(resolve, 3000))
      // ])

      // Update thumb img for saving result.json.
      if (name === 'result') {
        const screenshot = await cmWVUtils.sendScreenshotUrl(cmWVUtils.createUrlForJSON({ noBg: false }))
        const thumbIndex = generatedResults.value.findIndex((gr) => gr.id === subDesignId)
        
        if (screenshot.flag === '0') {
          const img64 = await generalUtils.toDataUrlNew(`chmix://screenshot/${screenshot.imageId}?imagetype=jpg&ssize=1080`)
          await saveDesignImageToDocument(img64, 'thumb', { subDesignId, thumbIndex })
        }
      }

      const json: ICmSubDesign = {
        type: editorType.value,
        id: currDesignId.value,
        subId: subDesignId,
        fileName: name,
        updateTime: new Date(Date.now()).toISOString(),
        pages,
        ver: cmWVUtils.getUserInfoFromStore().appVer,
        assetInfo: {},
        prompt: currPrompt.value,
        width: pages[0].width,
        height: pages[0].height,
      }
      await cmWVUtils.addJson(`mydesign-${editorType.value}/${path}`, name, json)

      const newDesign = {
        type: editorType.value,
        id: currDesignId.value,
        subDesignInfo: generatedResults.value.map((result) => {
          return {
            id: result.id,
            width: pages[0].width,
            height: pages[0].height,
          }
        }),
        thumbIndex: currDesignThumbIndex.value,
        width: pageSize.value.width,
        height: pageSize.value.height,
        updateTime: new Date(Date.now()).toISOString(),
      } as ICmMyDesign

      await cmWVUtils.addAsset(`mydesign-${editorType.value}`, newDesign, undefined, 'mydesign')
      updateDesignsInStore(newDesign)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const getTargetImageUrl = (
    type: string,
    id: string,
    subId: string,
    imgName: string,
    size = 1600,
  ) => {
    const assetId = `mydesign-${type}/${id}/${subId}/${imgName}`
    const srcObj: SrcObj = {
      type: 'ios',
      assetId,
      userId: imgName === 'mask' ? 'png' : 'jpg',
    }

    const imgSrc = imageUtils.getSrc(srcObj)

    return imageUtils.appendQuery(imgSrc, 'lsize', `${size}`)
  }

  const getDesignThumbUrl = (design: ICmMyDesign, size = 400) => {
    const { id, subDesignInfo, thumbIndex, type } = design
    return getTargetImageUrl(type, id, subDesignInfo[thumbIndex].id, 'thumb', size)
  }

  const getSubDesignThumbUrl = (type: string, id: string, subId: string, size = 400) => {
    return getTargetImageUrl(type, id, subId, 'thumb', size)
  }

  const getSubDesignImage = (design: ICmSubDesign) => {
    const { id, subId, type } = design

    const srcObj: SrcObj = {
      type: 'ios',
      assetId: `mydesign-${type}/${id}/${subId}/thumb`,
      userId: 'jpg',
    }

    const imgSrc = imageUtils.getSrc(srcObj)

    return imgSrc
  }

  // #region save option
  const removeWatermark = ref(false)
  const highResolutionPhoto = ref(false)

  const setRemoveWatermark = (value: boolean) => {
    removeWatermark.value = value
  }

  const setHighResolutionPhoto = (value: boolean) => {
    highResolutionPhoto.value = value
  }
  // #endregion

  return {
    prevGenParams,
    setPrevGenParams,
    // #region my design related
    myDesignTags,
    myDesignFilesMap,
    myDesignNextPagesMap,
    getDesignsByType,
    getNextPageIndexByType,
    currMyDesignType,
    setCurrMyDesignType,
    myDesignBuffer,
    getDesginTypeByKey,
    saveDesignImageToDocument,
    saveSubDesign,
    listDesigns,
    updateDesignsInStore,
    getTargetImageUrl,
    getDesignThumbUrl,
    getSubDesignThumbUrl,
    getSubDesignImage,
    getSubDesignConfig,
    currDesigns,
    currNextPages,
    initWithSubDeisgnImage,
    editSubDesignResult,
    initWithSubDesignConfig,
    currOpenDesign,
    setCurrOpenDesign,
    isDesignOpen,
    isSubDesignOpen,
    currOpenSubDesign,
    setCurrOpenSubDesign,
    deleteDesign,
    deleteSubDesign,
    // #endregion
    // #region save option related
    removeWatermark,
    highResolutionPhoto,
    setRemoveWatermark,
    setHighResolutionPhoto,
    // #endregion
  }
})
