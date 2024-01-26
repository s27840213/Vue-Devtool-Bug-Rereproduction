import useBiColorEditor from '@/composable/useBiColorEditor'
import { useCanvasStore } from '@/stores/canvas'
import type { GenImageParams } from '@/types/api'
import type { EditorType, GenImageOptionToSave } from '@/types/editor'
import {
  ICmMyDesign,
  ICmSubDesign,
  IMyDesignType,
  IPrevGenParams,
  ITmpSubDesign,
} from '@/types/user'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import type { IPage } from '@nu/vivi-lib/interfaces/page'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import cmWVUtils, { IListAssetResponse } from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageShadowUtils from '@nu/vivi-lib/utils/imageShadowUtils'
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
    restoreGenOptions,
    setMaskDataUrl,
    setSelectedSubDesignId,
    setInitImgSrc,
    updateGenResult,
  } = editorStore
  const {
    currDesignId,
    myDesignSavedRoot,
    editorType,
    myDesignSavedType,
    currDesignThumbIndex,
    generatedResults,
    pageSize,
    currPrompt,
    currGenOptionsToSave,
    initImgSrc,
    maskDataUrl,
  } = storeToRefs(editorStore)

  const { t } = useI18n()

  const aiCredit = ref(0)

  const setAiCredit = (credit: number) => {
    aiCredit.value = credit
  }

  const increaseAiCredit = (amount: number) => {
    aiCredit.value += amount
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
  const isSaving = ref(false)

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

  const getDesignTypeByKey = (key: string) => {
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

  const setIsSaving = (value: boolean) => {
    isSaving.value = value
  }

  const getSubDesignConfig = async (
    myDesign: ICmMyDesign | Pick<ICmMyDesign, 'id' | 'type'>,
    subDesignId: string,
    name: 'original' | 'result' = 'original',
  ) => {
    const { id, type } = myDesign
    const data = (await cmWVUtils.getJson(`mydesign-${type}/${id}/${subDesignId}/${name}`)) as
      | {
          flag: '0' | '1'
          name: string
          path: string
          content: ICmSubDesign
        }
      | undefined
      | null
    return data
  }
  // #endregion

  // #region edit sub design
  const initWithSubDesignImage = async (subDesign: ICmSubDesign) => {
    try {
      const { id, subId, type, width, height } = subDesign

      // Copy thumb img to result img.
      await cmWVUtils.cloneFile(
        `mydesign-${type}/${id}/${subId}/thumb.jpg`,
        `mydesign-${type}/${id}/${subId}/result.jpg`,
      )

      // Create new design with result img.
      pageUtils.setPages([pageUtils.newPage({ width, height })])
      const resultUrl = getTargetImageUrl(type, id, subId, 'result', 1600)
      assetUtils.addImage(resultUrl, width / height, {
        fit: 1,
        record: false,
        select: false,
      })

      // reset drawing color
      if (useBiColorEditor().isBiColorEditor) useCanvasStore().reset(['drawingColor'])

      logUtils.setLogAndConsoleLog('start edit the deisgn')
      startEditing('powerful-fill', {
        stateTarget: 'editing',
        designName: 'result',
        designId: id,
        designType: type,
        generatedResults: currOpenDesign.value?.subDesignInfo.map((subDesign) => {
          return {
            id: subDesign.id,
            url: getSubDesignThumbUrl(type, id, subDesign.id),
            width,
            height,
            // prompt,
          }
        }),
        designWidth: width,
        designHeight: height,
        selectedSubDesignId: subId,
      })

      setMaskDataUrl('')
      setCurrPrompt('')
      setInitImgSrc(getTargetImageUrl(type, id, subId, 'original'))

      setSelectedSubDesignId(subId)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const editSubDesignResult = async () => {
    // Do the same thing with editor.keepEditingInit.
    if (!currOpenSubDesign.value) return false
    const { subId, type, id } = currOpenSubDesign.value

    // Try to open result.json.
    const subDesignData = await getSubDesignConfig({ type, id }, subId, 'result')
    if (subDesignData?.flag === '0') {
      initWithSubDesignConfig(subDesignData.content)
      return
    }

    // Cannot find result.json, use result img to create new design.
    initWithSubDesignImage(currOpenSubDesign.value)
  }
  // #endregion

  const initWithSubDesignConfig = async (
    subDesign: ICmSubDesign,
    // options?: { addMask: boolean },
  ) => {
    // const { addMask = true } = options || {}
    try {
      const { pages, type, prompt, genImageOptions, id, fileName, subId, width, height } = subDesign

      setCurrPrompt(prompt)
      restoreGenOptions(genImageOptions, type)
      pageUtils.setPages(pages)

      // add mask
      if (fileName === 'original') {
        const maskUrl = getTargetImageUrl(type, id, subId, 'mask')
        setMaskDataUrl(maskUrl)
      }

      startEditing(type, {
        stateTarget: 'editing',
        designName: fileName,
        designId: id,
        designType: type,
        generatedResults: currOpenDesign.value?.subDesignInfo.map((subDesign) => {
          return {
            id: subDesign.id,
            url: getSubDesignThumbUrl(type, id, subDesign.id),
            width,
            height,
            // prompt,
          }
        }),
        designWidth: width,
        designHeight: height,
        selectedSubDesignId: subId,
      })

      setInitImgSrc(getTargetImageUrl(type, id, subId, 'original'))

      setSelectedSubDesignId(subId)
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

      const designs = (assets as ICmMyDesign[]).filter(
        (design) => design.id !== '' && design.subDesignInfo.length !== 0,
      )
      const currType = getDesignTypeByKey(key)
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
          myDesignSavedRoot.value,
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
      subDesignId = '',
      type = 'jpg',
      thumbIndex,
      designId = currDesignId.value,
      myDesignEditorType,
    } = props ?? {}

    const mydesignRoot = myDesignEditorType
      ? `mydesign-${myDesignEditorType}`
      : myDesignSavedRoot.value

    if (thumbIndex !== undefined) {
      setCurrDesignThumbIndex(thumbIndex)
    }
    const data = (await cmWVUtils.saveAssetFromUrl(
      type,
      url,
      `${mydesignRoot}/${designId}/${subDesignId}/${fileName}`,
    )) ?? {
      flag: '1',
      fileId: '',
    }

    return data
  }

  const saveImgToTmp = (url: string, path: string, type: 'png' | 'jpg' = 'png') => {
    return cmWVUtils.saveAssetFromUrl(type, url, `tmp/${path}`)
  }

  const saveSubDesign = async (
    path: string,
    subDesignId: string,
    name: 'original' | 'result' = 'original',
    showMoreData?: {
      pages: IPage[]
      prompt: string
      options: GenImageOptionToSave
      type: EditorType
    },
  ) => {
    setIsSaving(true)
    await saveSubDesignCore(
      path,
      subDesignId,
      name,
      showMoreData !== undefined,
      showMoreData ?? {
        pages: uploadUtils.prepareJsonToUpload(pageUtils.getPages),
        prompt: currPrompt.value,
        options: currGenOptionsToSave.value,
        type: editorType.value,
      },
    )
    setIsSaving(false)
  }

  const saveSubDesignCore = async (
    path: string,
    subDesignId: string,
    name: 'original' | 'result' = 'original',
    showMore: boolean,
    {
      pages,
      prompt,
      options,
      type,
    }: {
      pages: IPage[]
      prompt: string
      options: GenImageOptionToSave
      type: EditorType
    },
  ) => {
    try {
      if (cmWVUtils.inBrowserMode) return
      if (!showMore) {
        await Promise.race([
          imageShadowUtils.iosImgDelHandler_cm({
            editorType: editorType.value,
            designId: currDesignId.value,
          }),
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000)),
        ])
      }
      const isValidJson = await cmWVUtils.isValidJson(pages)
      if (!isValidJson) {
        logUtils.setLog('Saving design as myDesign failed, because the design json is invalid')
        // TODO - upload the reported design, maybe discuss with TingAn
        // this.uploadReportedDesign()
        // this.setLoadingOverlayShow(false)
        throw new Error('save design failed')
      }

      // Update thumb img for saving result.json.
      if (name === 'result') {
        await cmWVUtils
          .sendScreenshotUrl(cmWVUtils.createUrlForJSON({ noBg: false }))
          .then((screenshot) => {
            if (screenshot.flag === '1') return

            return cmWVUtils.cloneFile(
              `screenshot/${screenshot.imageId}.jpg`,
              `${myDesignSavedRoot.value}/${currDesignId.value}/${subDesignId}/thumb.jpg`,
            )
          })
          .then(() => {
            const thumbIndex = generatedResults.value.findIndex((gr) => gr.id === subDesignId)
            if (thumbIndex === -1) return
            setCurrDesignThumbIndex(thumbIndex)
            updateGenResult(subDesignId, {
              url: getSubDesignThumbUrl(
                myDesignSavedRoot.value.replace('mydesign-', ''),
                currDesignId.value,
                subDesignId,
              ),
              video: null,
            })
          })
      }

      const json: ICmSubDesign = {
        type,
        id: currDesignId.value,
        subId: subDesignId,
        fileName: name,
        updateTime: new Date(Date.now()).toISOString(),
        pages,
        ver: cmWVUtils.getUserInfoFromStore().appVer,
        assetInfo: {},
        prompt,
        genImageOptions: options,
        width: pages[0].width,
        height: pages[0].height,
      }
      await cmWVUtils.addJson(`${myDesignSavedRoot.value}/${path}/${name}`, json)

      const newDesign = {
        type: myDesignSavedType.value,
        id: currDesignId.value,
        subDesignInfo: generatedResults.value.map((result) => {
          return {
            id: result.id,
            width: result.width,
            height: result.height,
          }
        }),
        thumbIndex: currDesignThumbIndex.value,
        width: pageSize.value.width,
        height: pageSize.value.height,
        updateTime: new Date(Date.now()).toISOString(),
      } as ICmMyDesign

      await cmWVUtils.addAsset(myDesignSavedRoot.value, newDesign, undefined, 'mydesign')
      updateDesignsInStore(newDesign)
    } catch (error) {
      logUtils.setLogForError(error as Error)
    }
  }

  const updatePrevGen = async (genConfig: { requestId: string; params: GenImageParams }) => {
    const json: IPrevGenParams = {
      ...genConfig,
      config: uploadUtils.prepareJsonToUpload(pageUtils.getPages),
      prompt: currPrompt.value,
      options: currGenOptionsToSave.value,
      type: editorType.value,
    }
    if (!(await cmWVUtils.isValidJson(json))) {
      throw new Error('JSON to save is invalid')
    }
    await Promise.all([
      cmWVUtils.addJson(`${myDesignSavedRoot.value}/${currDesignId.value}/prev/gen`, json),
      cmWVUtils.cloneFile(
        initImgSrc.value,
        `${myDesignSavedRoot.value}/${currDesignId.value}/prev/input.jpg`,
      ),
      ...(maskDataUrl.value
        ? [
            cmWVUtils.saveAssetFromUrl(
              'png',
              maskDataUrl.value,
              `${myDesignSavedRoot.value}/${currDesignId.value}/prev/mask`,
            ),
          ]
        : []),
    ])
  }

  const getTargetImageUrl = (
    type: string,
    id: string,
    subId: string,
    imgName: string,
    size: number | undefined = undefined,
  ) => {
    const assetId = `mydesign-${type}/${id}/${subId}/${imgName}`
    const srcObj: SrcObj = {
      type: 'ios',
      assetId,
      userId: imgName === 'mask' ? 'png' : 'jpg',
    }

    let imgSrc = imageUtils.getSrc(srcObj)

    if (imgName === 'thumb') {
      // Prevent cache
      imgSrc = imageUtils.appendQuery(imgSrc, 'rand_ver', `${generalUtils.serialNumber}`)
    }

    return size ? imageUtils.appendQuery(imgSrc, 'lsize', `${size}`) : imgSrc
  }

  const getInitialImg = () => {
    const assetId = `${myDesignSavedRoot.value}/${
      currOpenDesign.value?.id || currDesignId.value
    }/initial`
    const srcObj: SrcObj = {
      type: 'ios',
      assetId,
      userId: 'jpg',
    }
    return imageUtils.getSrc(srcObj)
  }

  const getDesignThumbUrl = (design: ICmMyDesign, size = 400) => {
    const { id, subDesignInfo, thumbIndex, type } = design
    if (thumbIndex === -1) return ''
    return getTargetImageUrl(type, id, subDesignInfo[thumbIndex].id, 'thumb', size)
  }

  const getSubDesignThumbUrl = (
    type: string,
    id: string,
    subId: string,
    size: number | undefined = undefined,
  ) => {
    return getTargetImageUrl(type, id, subId, 'thumb', size)
  }

  const getSubDesignImage = (
    design: ICmSubDesign,
    imgName: 'thumb' | 'original' | 'result' | 'mask' = 'thumb',
  ) => {
    const { id, subId, type } = design

    const srcObj: SrcObj = {
      type: 'ios',
      assetId: `mydesign-${type}/${id}/${subId}/${imgName}`,
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

  cmWVUtils.detectIfInApp()
  cmWVUtils.getState('save_rm_watermark').then((data) => {
    removeWatermark.value = data?.value ?? false
  })

  cmWVUtils.getState('save_high_res').then((data) => {
    highResolutionPhoto.value = data?.value ?? false
  })
  // #endregion

  return {
    aiCredit,
    setAiCredit,
    increaseAiCredit,
    // #region my design related
    myDesignTags,
    myDesignFilesMap,
    myDesignNextPagesMap,
    getDesignsByType,
    getNextPageIndexByType,
    currMyDesignType,
    setCurrMyDesignType,
    myDesignBuffer,
    getDesignTypeByKey,
    saveDesignImageToDocument,
    saveImgToTmp,
    saveSubDesign,
    updatePrevGen,
    listDesigns,
    updateDesignsInStore,
    getTargetImageUrl,
    getDesignThumbUrl,
    getSubDesignThumbUrl,
    getSubDesignImage,
    getSubDesignConfig,
    currDesigns,
    currNextPages,
    initWithSubDesignImage,
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
    isSaving,
    setIsSaving,
    // #endregion
    // #region save option related
    removeWatermark,
    highResolutionPhoto,
    getInitialImg,
    setRemoveWatermark,
    setHighResolutionPhoto,
    // #endregion
  }
})
