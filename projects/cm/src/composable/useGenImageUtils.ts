import genImageApis from '@/apis/genImage'
import useUploadUtils from '@/composable/useUploadUtils'
import { useEditorStore } from '@/stores/editor'
import { useModalStore } from '@/stores/modal'
import { useUploadStore } from '@/stores/upload'
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
  const { prevGenParams, lastUsedMask } = storeToRefs(userStore)
  const { useUsBucket, uploadMap } = storeToRefs(useUploadStore())
  const editorStore = useEditorStore()
  const { setInitImgSrc, setMaskDataUrl, unshiftGenResults, removeGenResult, updateGenResult } =
    editorStore
  const {
    editorType,
    pageSize,
    contentScaleRatio,
    generatedResultsNum,
    currDesignId,
    initImgSrc,
    maskDataUrl,
    currPrompt,
    myDesignSavedRoot,
  } = storeToRefs(useEditorStore())
  const { uploadImage, polling, getPollingController } = useUploadUtils()
  const {
    saveDesignImageToDocument,
    saveSubDesign,
    setAiCredit,
    setLastUsedMask,
  } = useUserStore()
  const { prepareMaskToUpload, getCanvasDataUrl } = useCanvasUtils()
  const { setNormalModalInfo, openModal, closeModal } = useModalStore()
  const store = useStore()
  const userId = computed(() => store.getters['user/getUserId'])
  const hostId = computed(() => store.getters['cmWV/getUserInfo'].hostId)
  const token = computed(() => store.getters['user/getToken'])
  const { t } = useI18n()

  /**
   * genImage with UI and generatedResult flow control
   * @param params params for /gen-image API call. undefined means 'SHOW MORE', which uses the params stored last time.
   * @param num number of images to generate.
   * @param callbacks.onSuccess called when a result image is successfully polled and ready to show. (for each image)
   * @param callbacks.onError call when one/all image(s) failed to generate. index = -1 means all images failed.
   * @param callbacks.onApiResponded call when /gen-image API call finished, can be used for UI switching.
   */
  const genImageFlow = async (
    params: GenImageParams | undefined,
    num: number,
    {
      onSuccess = () => {
        /**/
      },
      onError = () => {
        /**/
      },
      onApiResponded = () => {
        /**/
      },
    }: {
      onSuccess?: (index: number, url: string) => void
      onError?: (index: number, url: string, reason: string) => void
      onApiResponded?: () => void
    } = {},
  ): Promise<void> => {
    for (let i = 0; i < num; i++) {
      ids.unshift(generalUtils.generateRandomString(8))
      unshiftGenResults('', ids[0], currPrompt.value)
    }
    try {
      let finishedNum = 0
      let errorNum = 0
      await genImage(params, num, {
        onApiResponded,
        onSuccess: (index, imgSrc, onlyUpdate = false) => {
          updateGenResult(ids[index], { url: imgSrc })
          if (!onlyUpdate) {
            finishedNum++
            onSuccess(index, imgSrc)
          }
          if (finishedNum === num) {
            cmWVUtils.callIOSAsHTTPAPI('MAKE_VIBRATE')
          }
        },
        onError: (index, url, reason) => {
          errorNum++
          const errorId = generalUtils.generateRandomString(6)
          const hint = `${hostId.value}:${
            userId.value
          },${generalUtils.generateTimeStamp()},${errorId}`
          logUtils.setLogAndConsoleLog(`#${errorId}: ${reason} for ${ids[index]}: ${url}`)
          logUtils.uploadLog().then(() => {
            modalUtils.setModalInfo(
              `${t('CM0087')} ${t('CM0089')}`,
              `${t('CM0088')}<br/>(${hint})`,
              {
                msg: t('STK0023'),
                action() {
                  generalUtils.copyText(hint).then(() => {
                    notify({ group: 'success', text: t('NN0923') })
                  })
                },
              },
            )
          })
          removeGenResult(ids[index])
          if (errorNum === num) {
            onError(-1, '', 'all error')
          }
          onError(index, url, reason)
        },
      })
    } catch (error) {
      const errorId = generalUtils.generateRandomString(6)
      const hint = `${hostId.value}:${userId.value},${generalUtils.generateTimeStamp()},${errorId}`
      logUtils.setLog(errorId)
      logUtils.setLogForError(error as Error)
      logUtils.uploadLog().then(() => {
        if ((error as Error).message?.includes('no free credits')) {
          cmWVUtils.openPayment()
        } else if ((error as Error).message?.includes('no credits')) {
          setNormalModalInfo({
            title: t('CM0153'),
            content: t('CM0154'),
            cancelText: t('NN0359'),
            confirmText: t('NN0742'),
            cancel() {
              closeModal()
            },
            confirm() {
              window.open('https://www.instagram.com/charmix.ai/', '_blank')
              closeModal()
            },
            confirmTextStyle: 'text-decoration: underline;',
          })
          openModal()
        } else {
          modalUtils.setModalInfo(t('CM0087'), `${t('CM0088')}<br/>(${hint})`, {
            msg: t('STK0023'),
            action() {
              generalUtils.copyText(hint).then(() => {
                notify({ group: 'success', text: t('NN0923') })
              })
            },
          })
        }
      })
      for (const id of ids.slice(0, num)) {
        removeGenResult(id)
      }
      onError(-1, '', (error as Error).message)
    }
  }

  const genImage = async (
    params_: GenImageParams | undefined,
    num: number,
    {
      onSuccess = () => {
        /**/
      },
      onError = () => {
        /**/
      },
      onApiResponded = () => {
        /**/
      },
    }: {
      onSuccess?: (index: number, url: string, onlyUpdate?: boolean) => void
      onError?: (index: number, url: string, reason: string) => void
      onApiResponded?: () => void
    } = {},
  ): Promise<string[]> => {
    const showMore = params_ === undefined
    const params = showMore ? prevGenParams.value.params : params_!
    const requestId = showMore ? prevGenParams.value.requestId : generalUtils.generateAssetId()
    RECORD_TIMING && testUtils.start(`gen-image ${requestId}`, { notify: false, setToLog: true })

    if (!showMore) {
      try {
        // don't call cleanup() returned by uploadEditorAsImage()
        // since the screenshot can be used anytime in this session
        // letting native delete it next time the App is open is already sufficient.
        await Promise.all([
          uploadEditorAsImage(userId.value, requestId),
          uploadMaskAsImage(userId.value, requestId),
        ])

        if (generatedResultsNum.value === num) {
          // Before first generate, after screenshot.
          cmWVUtils.cloneFile(
            initImgSrc.value,
            `${myDesignSavedRoot.value}/${currDesignId.value}/initial.jpg`,
          )
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
        throw new Error('Upload Images For /gen-image Failed')
      }
    }
    if (maskDataUrl.value) {
      setLastUsedMask(maskDataUrl.value)
    }

    RECORD_TIMING && testUtils.start('call API', { notify: false, setToLog: true })
    logUtils.setLogAndConsoleLog(`#${requestId}: ${JSON.stringify(params)}`)
    const res = (
      await genImageApis.genImage(
        userId.value,
        requestId,
        token.value,
        params,
        num,
        useUsBucket.value,
      )
    ).data
    RECORD_TIMING && testUtils.log('call API', '')

    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }

    onApiResponded()

    setAiCredit(res.ai_credit)
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
        RECORD_TIMING && testUtils.start(`polling ${index}`, { notify: false, setToLog: true })
        try {
          const subDesignId = ids[index]
          const promises = [
            cmWVUtils.cloneFile(
              initImgSrc.value,
              `${myDesignSavedRoot.value}/${currDesignId.value}/${subDesignId}/original.jpg`,
            ),
            saveSubDesign(`${currDesignId.value}/${subDesignId}`, subDesignId, 'original'),
            polling(url, { isJson: false, useVer: !useUsBucket.value, pollingController }),
          ]

          if (lastUsedMask.value) {
            promises.push(
              saveDesignImageToDocument(lastUsedMask.value, 'mask', {
                type: 'png',
                subDesignId,
              }),
            )
          } else {
            notify({
              group: 'error',
              text: 'save mask to document failed',
            })
          }

          await Promise.all(promises)
        } catch (error: any) {
          logUtils.setLogForError(error)
          if (!error.message?.includes('Cancelled')) {
            onError(index, url, error.message)
          }
          return
        }
        RECORD_TIMING && testUtils.log(`polling ${index}`, '')
        // save result image to document
        try {
          onSuccess(index, url)
          RECORD_TIMING &&
            testUtils.start(`save-result ${index}`, { notify: false, setToLog: true })
          await saveDesignImageToDocument(url, 'thumb', {
            subDesignId: ids[index],
            thumbIndex: index,
          })
          RECORD_TIMING && testUtils.log(`save-result ${index}`, '')
          const srcObj: SrcObj = {
            type: 'ios',
            assetId: `${myDesignSavedRoot.value}/${currDesignId.value}/${ids[index]}/thumb`,
            userId: 'jpg',
          }

          const imgSrc = imageUtils.getSrc(srcObj)
          onSuccess(index, imgSrc, true)
        } catch (error) {
          onError(index, url, 'saveAssetFromUrl failed')
        }
        RECORD_TIMING && testUtils.log(`gen-image ${requestId}`, '')
      }),
    ])
    return urls
  }

  const uploadEditorAsImage = async (userId: string, requestId: string) => {
    RECORD_TIMING && testUtils.start('copy editor', { notify: false, setToLog: true })
    const { width: pageWidth, height: pageHeight } = pageSize.value
    if (editorType.value === 'hidden-message') setMaskDataUrl(getCanvasDataUrl() ?? '')
    const { flag, imageId, cleanup } = cmWVUtils.checkVersion('1.0.18')
      ? await cmWVUtils.sendScreenshotUrl(
          cmWVUtils.createUrlForJSON({
            noBg: false,
            ...(editorType.value === 'hidden-message' && { maskUrl: maskDataUrl.value }),
          }),
          { forGenImage: true },
        )
      : await cmWVUtils.copyEditor({
          width: pageWidth * contentScaleRatio.value,
          height: pageHeight * contentScaleRatio.value,
          snapshotWidth: cmWVUtils.getSnapshotWidth(pageSize.value, 1080, 'short'),
        })
    RECORD_TIMING && testUtils.log('copy editor', '')
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    setInitImgSrc(`chmix://screenshot/${imageId}?imagetype=jpg&ssize=1080`)
    RECORD_TIMING && testUtils.start('upload screenshot', { notify: false, setToLog: true })
    try {
      await cmWVUtils.uploadFileToS3(
        { path: `screenshot/${imageId}`, ext: 'jpg' },
        uploadMap.value ?? {},
        `${userId}/input/${requestId}_init`,
      )
    } catch (error) {
      logUtils.setLogAndConsoleLog('Upload Editor Image Failed')
      throw error
    }
    RECORD_TIMING && testUtils.log('upload screenshot', '')
    console.log('screenshot:', new Date().getTime())
    return cleanup
  }

  const uploadMaskAsImage = async (userId: string, requestId: string) => {
    if (editorType.value === 'hidden-message') return

    RECORD_TIMING && testUtils.start('mask to dataUrl', { notify: false, setToLog: true })
    return new Promise<void>((resolve, reject) => {
      try {
        const originalMaskDataUrl = getCanvasDataUrl()
        const maskUrl = prepareMaskToUpload()
        if (maskUrl !== undefined) {
          RECORD_TIMING && testUtils.log('mask to dataUrl', '')
          RECORD_TIMING && testUtils.start('upload mask', { notify: false, setToLog: true })
          uploadImage(maskUrl, `${userId}/input/${requestId}_mask`).then(() => {
            RECORD_TIMING && testUtils.log('upload mask', '')
            if (originalMaskDataUrl) {
              setMaskDataUrl(originalMaskDataUrl)
            }
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
