import genImageApis from '@/apis/genImage'
import useUploadUtils from '@/composable/useUploadUtils'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageParams, GenImageResult } from '@/types/api'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import testUtils from '@nu/vivi-lib/utils/testUtils'
import { useStore } from 'vuex'
import useCanvasUtils from './useCanvasUtilsCm'

export const RECORD_TIMING = true

// #region some variable we need to use for saving design
const ids: string[] = []
// #endregion

const useGenImageUtils = () => {
  const userStore = useUserStore()
  const { setPrevGenParams } = userStore
  const { prevGenParams } = storeToRefs(useUserStore())
  const editorStore = useEditorStore()
  const {
    setInitImgSrc,
    setMaskDataUrl,
    unshiftGenResults,
    removeGenResult,
    updateGenResult,
    changeEditorState,
  } = editorStore
  const {
    editorType,
    pageSize,
    contentScaleRatio,
    inGenResultState,
    generatedResultsNum,
    currDesignId,
    initImgSrc,
    maskDataUrl,
  } = storeToRefs(useEditorStore())
  const { uploadImage, polling, getPollingController } = useUploadUtils()
  const { saveDesignImageToDocument, saveSubDesign } = useUserStore()
  const { prepareMaskToUpload } = useCanvasUtils()
  const store = useStore()
  const userId = computed(() => store.getters['user/getUserId'])
  const { t } = useI18n()

  const genImageFlow = async (
    params: GenImageParams,
    showMore: boolean,
    num: number,
    {
      onSuccess = undefined,
      onError = undefined,
      onApiResponded = undefined,
    }: {
      onSuccess?: (index: number, url: string) => void
      onError?: (index: number, url: string, reason: string) => void
      onApiResponded?: () => void
    } = {},
  ): Promise<void> => {
    for (let i = 0; i < num; i++) {
      ids.unshift(generalUtils.generateRandomString(8))
      unshiftGenResults('', ids[0])
    }
    try {
      await genImage(params, showMore, num, {
        onApiResponded,
        onSuccess: (index, imgSrc) => {
          updateGenResult(ids[index], { url: imgSrc })
          onSuccess && onSuccess(index, imgSrc)
        },
        onError: (index, url, reason) => {
          const errorId = generalUtils.generateRandomString(6)
          logUtils.setLogAndConsoleLog(`#${errorId}: ${reason} for ${ids[index]}: ${url}`)
          modalUtils.setModalInfo(
            `${t('CM0087')} ${t('CM0089')}`,
            `${t('CM0088')}<br/>(${userId.value},${generalUtils.generateTimeStamp()},${errorId})`,
            { msg: t('STK0023') },
          )
          removeGenResult(ids[index])
          if (generatedResultsNum.value === 0 && inGenResultState.value) {
            changeEditorState('prev')
          }
          onError && onError(index, url, reason)
        },
      })
    } catch (error) {
      const errorId = generalUtils.generateRandomString(6)
      logUtils.setLog(errorId)
      logUtils.setLogForError(error as Error)
      modalUtils.setModalInfo(
        t('CM0087'),
        `${t('CM0088')}<br/>(${userId.value},${generalUtils.generateTimeStamp()},${errorId})`,
        { msg: t('STK0023') },
      )
      for (const id of ids) {
        removeGenResult(id)
      }
      if (generatedResultsNum.value === 0 && inGenResultState.value) {
        changeEditorState('prev')
      }
      onError && onError(-1, '', (error as Error).message)
    }
  }

  const genImage = async (
    params: GenImageParams,
    showMore: boolean,
    num: number,
    {
      onSuccess = undefined,
      onError = undefined,
      onApiResponded = undefined,
    }: {
      onSuccess?: (index: number, url: string) => void
      onError?: (index: number, url: string, reason: string) => void
      onApiResponded?: () => void
    } = {},
  ): Promise<string[]> => {
    const requestId = showMore ? prevGenParams.value.requestId : generalUtils.generateAssetId()

    if (!showMore) {
      try {
        await Promise.all([
          uploadEditorAsImage(userId.value, requestId),
          uploadMaskAsImage(userId.value, requestId),
        ])
      } catch (error) {
        logUtils.setLogForError(error as Error)
        throw new Error('Upload Images For /gen-image Failed')
      }
    } else {
      params = prevGenParams.value.params
    }
    RECORD_TIMING && testUtils.start('call API', false)
    const res = (await genImageApis.genImage(userId.value, requestId, params, num)).data
    RECORD_TIMING && testUtils.log('call API', '')

    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }

    onApiResponded && onApiResponded()

    setPrevGenParams({ requestId, params })
    const urls = res.urls.map((urlMap) => urlMap.url)
    const pollingController = getPollingController()
    await Promise.all([
      (async () => {
        const json = await polling<GenImageResult>(
          `https://template.vivipic.com/charmix/${userId.value}/result/${requestId}.json`,
        )
        if (json.flag !== 0) {
          pollingController.cancelAll()
          throw new Error('Call /gen-image Failed, ' + json.msg ?? '')
        }
      })(),
      ...urls.map(async (url, index) => {
        RECORD_TIMING && testUtils.start(`polling ${index}`, false)
        try {
          const subDesignId = ids[index]
          const promises = [
            saveDesignImageToDocument(initImgSrc.value, 'original', {
              subDesignId,
            }),
            saveSubDesign(`${currDesignId.value}/${subDesignId}`, subDesignId, 'config'),
            polling(url, { isJson: false, useVer: false, pollingController }),
          ]
          if (editorType.value !== 'hidden-message') {
            const prepareMask = prepareMaskToUpload()
            if (prepareMask) {
              promises.push(
                saveDesignImageToDocument(maskDataUrl.value, 'mask', {
                  subDesignId,
                }),
              )
            } else {
              notify({
                group: 'error',
                text: 'save mask to document failed',
              })
            }
          }

          await Promise.all(promises)
        } catch (error: any) {
          logUtils.setLogForError(error)
          if (!error.message.includes('Cancelled')) {
            onError && onError(index, url, error.message)
          }
          return
        }
        RECORD_TIMING && testUtils.log(`polling ${index}`, '')
        // save result image to document
        try {
          await saveDesignImageToDocument(url, 'result', {
            subDesignId: ids[index],
            thumbIndex: index,
          })
          const srcObj: SrcObj = {
            type: 'ios',
            assetId: `mydesign-${editorType.value}/${currDesignId.value}/${ids[index]}/result`,
            userId: '',
          }

          const imgSrc = imageUtils.getSrc(srcObj)
          onSuccess && onSuccess(index, imgSrc)
        } catch (error) {
          onError && onError(index, url, 'saveAssetFromUrl failed')
        }
      }),
    ])
    return urls
  }

  const uploadEditorAsImage = async (userId: string, requestId: string) => {
    RECORD_TIMING && testUtils.start('copy editor', false)
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const size = Math.max(pageWidth, pageHeight)
    const { flag, imageId, cleanup } = cmWVUtils.checkVersion('1.0.18')
      ? await cmWVUtils.sendScreenshotUrl(cmWVUtils.createUrlForJSON({ noBg: false }))
      : await cmWVUtils.copyEditor({
          width: pageWidth * contentScaleRatio.value,
          height: pageHeight * contentScaleRatio.value,
        })
    RECORD_TIMING && testUtils.log('copy editor', '')
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    RECORD_TIMING && testUtils.start('screenshot to blob', false)
    return new Promise<void>((resolve) => {
      generalUtils.toDataUrlNew(`chmix://screenshot/${imageId}?lsize=${size}`).then((dataUrl) => {
        setInitImgSrc(dataUrl)
        const imageBlob = generalUtils.dataURLtoBlob(dataUrl)
        RECORD_TIMING && testUtils.log('screenshot to blob', '')
        RECORD_TIMING && testUtils.start('upload screenshot', false)
        uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
          .then(async () => {
            RECORD_TIMING && testUtils.log('upload screenshot', '')
            console.log('screenshot:', new Date().getTime())
            cleanup()
            resolve()
          })
          .catch((error) => {
            logUtils.setLogAndConsoleLog('Upload Editor Image Failed')
            throw error
          })
      })
    })
  }

  const uploadMaskAsImage = async (userId: string, requestId: string) => {
    if (editorType.value === 'hidden-message') return

    RECORD_TIMING && testUtils.start('mask to dataUrl', false)
    return new Promise<void>((resolve, reject) => {
      try {
        const maskUrl = prepareMaskToUpload()
        if (maskUrl !== undefined) {
          RECORD_TIMING && testUtils.log('mask to dataUrl', '')
          RECORD_TIMING && testUtils.start('upload mask', false)
          uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`).then(() => {
            RECORD_TIMING && testUtils.log('upload mask', '')
            setMaskDataUrl(maskUrl)
            resolve()
          })
        } else {
          throw new Error('Upload Mask Image Failed')
        }
      } catch (error) {
        logUtils.setLogAndConsoleLog('Upload Mask Image Failed')
        reject(error)
      }
    })
  }

  return {
    ids,
    genImageFlow,
    genImage,
    uploadEditorAsImage,
    uploadMaskAsImage,
  }
}

export default useGenImageUtils
