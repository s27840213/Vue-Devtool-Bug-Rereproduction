import genImageApis from '@/apis/genImage'
import useUploadUtils from '@/composable/useUploadUtils'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageResult } from '@/types/api'
import { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import testUtils from '@nu/vivi-lib/utils/testUtils'
import { useEventBus } from '@vueuse/core'
import { useStore } from 'vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'

export const RECORD_TIMING = true

const useGenImageUtils = () => {
  const userStore = useUserStore()
  const { setPrevGenParams } = userStore
  const { prevGenParams } = storeToRefs(useUserStore())
  const editorStore = useEditorStore()
  const {
    setInitImgSrc,
    setGenResultIndex,
    unshiftGenResults,
    removeGenResult,
    updateGenResult,
    changeEditorState,
  } = editorStore
  const { editorType, pageSize, contentScaleRatio, inGenResultState, generatedResultsNum } = storeToRefs(useEditorStore())
  const { uploadImage, polling, getPollingController } = useUploadUtils()
  const store = useStore()
  const userId = computed(() => store.getters['user/getUserId'])
  const { t } = useI18n()

  const genImageFlow = async (
    prompt: string,
    showMore: boolean,
    num: number,
    {
      onApiResponded = undefined,
    }: {
      onApiResponded?: () => void
    } = {},
  ): Promise<void> => {
    const ids: string[] = []
    for (let i = 0; i < num; i++) {
      ids.push(generalUtils.generateRandomString(4))
      unshiftGenResults('', ids[i])
    }
    if (!showMore) {
      setGenResultIndex(-1)
    }
    try {
      await genImage(prompt, showMore, num, {
        onApiResponded,
        onSuccess: (index, imgSrc) => {
          updateGenResult(ids[index], { url: imgSrc, updateIndex: !showMore })
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
    }
  }

  const genImage = async (
    prompt: string,
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
      prompt = prevGenParams.value.prompt
    }
    RECORD_TIMING && testUtils.start('call API', false)
    const res = (
      await genImageApis.genImage(userId.value, requestId, prompt, editorType.value, num)
    ).data
    RECORD_TIMING && testUtils.log('call API', '')

    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }

    onApiResponded && onApiResponded()

    setPrevGenParams({ requestId, prompt })
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
          await polling(url, { isJson: false, useVer: false, pollingController })
        } catch (error: any) {
          logUtils.setLogForError(error)
          if (!error.message.includes('Cancelled')) {
            onError && onError(index, url, error.message)
          }
          return
        }
        RECORD_TIMING && testUtils.log(`polling ${index}`, '')
        const data = (await cmWVUtils.saveAssetFromUrl('png', url)) ?? { flag: '1', fileId: '' }
        const { flag, fileId } = data
        if (flag === '0' && fileId) {
          const srcObj: SrcObj = {
            type: 'ios',
            assetId: `cameraroll/${fileId}`,
            userId: '',
          }

          const imgSrc = imageUtils.getSrc(srcObj)
          onSuccess && onSuccess(index, imgSrc)
        } else {
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
    const { flag, imageId, cleanup } = await cmWVUtils.copyEditor({
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
      generalUtils.toDataURL(`chmix://screenshot/${imageId}?lsize=${size}`, (dataUrl) => {
        setInitImgSrc(dataUrl)
        const imageBlob = generalUtils.dataURLtoBlob(dataUrl)
        RECORD_TIMING && testUtils.log('screenshot to blob', '')
        RECORD_TIMING && testUtils.start('upload screenshot', false)
        uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
          .then(() => {
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
    const bus = useEventBus('editor')
    RECORD_TIMING && testUtils.start('mask to dataUrl', false)
    return new Promise<void>((resolve, reject) => {
      bus.emit('genMaskUrl', {
        callback: async (maskUrl: string) => {
          RECORD_TIMING && testUtils.log('mask to dataUrl', '')
          try {
            RECORD_TIMING && testUtils.start('upload mask', false)
            await uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`)
            RECORD_TIMING && testUtils.log('upload mask', '')
            console.log('mask:', new Date().getTime())
            resolve()
          } catch (error) {
            logUtils.setLogAndConsoleLog('Upload Mask Image Failed')
            reject(error)
          }
        },
      })
    })
  }

  return {
    genImageFlow,
    genImage,
    uploadEditorAsImage,
    uploadMaskAsImage,
  }
}

export default useGenImageUtils
