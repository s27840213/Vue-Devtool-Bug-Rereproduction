import genImageApis from '@/apis/genImage'
import useUpload from '@/composable/useUpload'
import { useEditorStore } from '@/stores/editor'
import { useModalStore } from '@/stores/modal'
import { useUploadStore } from '@/stores/upload'
import { useUserStore } from '@/stores/user'
import type { GenImageParams, GenImageResult } from '@/types/api'
import { IPrevGenParams } from '@/types/user'
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
import useCanvasCm from './useCanvasCm'

export const RECORD_TIMING = true

// #region some variable we need to use for saving design
const ids: string[] = []
// #endregion

const useGenImageUtils = () => {
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
    myDesignSavedType,
  } = storeToRefs(useEditorStore())
  const { uploadImage, polling, getPollingController } = useUpload()
  const {
    saveDesignImageToDocument,
    saveSubDesign,
    setAiCredit,
    updatePrevGen,
    getTargetImageUrl,
  } = useUserStore()
  const { prepareMaskToUpload, getCanvasDataUrl } = useCanvasCm()
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
      unshiftGenResults('', ids[0] /* , currPrompt.value */)
    }
    try {
      let finishedNum = 0
      let errorNum = 0
      await genImage(params, num, {
        onApiResponded,
        onSuccess: (index, imgSrc, onlyUpdate = false) => {
          updateGenResult(ids[index], { url: imgSrc })

          if (onlyUpdate) return
          onSuccess(index, imgSrc)

          finishedNum++
          if (finishedNum !== num) return
          // If all result success.
          cmWVUtils.callIOSAsHTTPAPI('MAKE_VIBRATE')
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
              window.open('https://www.instagram.com/genpix.ai/', '_blank')
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
    const batchId = generalUtils.generateRandomString(6)

    const showMore = params_ === undefined

    let prevGenParms: IPrevGenParams | undefined

    let params = params_!
    let requestId = generalUtils.generateAssetId()
    RECORD_TIMING && testUtils.start('gen-image', { notify: false, setToLog: true })

    if (showMore) {
      try {
        const prevGenParms_ = (
          await cmWVUtils.getJson(`${myDesignSavedRoot.value}/${currDesignId.value}/prev/gen`)
        )?.content
        if (!prevGenParms_) throw new Error('Parameters for SHOW MORE not found!')
        prevGenParms = prevGenParms_ as IPrevGenParams
        params = prevGenParms.params
        requestId = prevGenParms.requestId
      } catch (error) {
        logUtils.setLogForError(error as Error)
        throw new Error('Load params For SHOW MORE Failed')
      }
    } else {
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

    RECORD_TIMING && testUtils.start('call API', { notify: false, setToLog: true })
    const fileNames = getFileNames(params.action)
    logUtils.setLogAndConsoleLog(`#${requestId}: ${JSON.stringify(params)}`)
    let res = (
      await genImageApis.genImage(
        userId.value,
        requestId,
        batchId,
        token.value,
        params,
        num,
        useUsBucket.value,
        showMore ? fileNames : undefined,
      )
    ).data
    RECORD_TIMING && testUtils.log('call API', '')

    if (res.flag !== 0) {
      if (showMore && res.msg === 'preflight failed') {
        await reuploadInputImages(userId.value, requestId, fileNames)
        RECORD_TIMING &&
          testUtils.start('call API after re-upload', { notify: false, setToLog: true })
        res = (
          await genImageApis.genImage(
            userId.value,
            requestId,
            batchId,
            token.value,
            params,
            num,
            useUsBucket.value,
            showMore ? fileNames : undefined,
          )
        ).data
        RECORD_TIMING && testUtils.log('call API after re-upload', '')

        if (res.flag !== 0) {
          throw new Error('Call /gen-image after Re-upload Failed, ' + res.msg ?? '')
        }
      } else {
        throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
      }
    }

    onApiResponded()

    setAiCredit(res.ai_credit)

    let prevGenSaved = showMore // if show more, don't updatePrevGen

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
              showMore
                ? `${myDesignSavedRoot.value}/${currDesignId.value}/prev/input.jpg`
                : initImgSrc.value,
              `${myDesignSavedRoot.value}/${currDesignId.value}/${subDesignId}/original.jpg`,
            ),
            saveSubDesign(
              `${currDesignId.value}/${subDesignId}`,
              subDesignId,
              'original',
              prevGenParms
                ? {
                    pages: prevGenParms.config,
                    prompt: prevGenParms.prompt,
                    options: prevGenParms.options,
                    type: prevGenParms.type,
                  }
                : undefined,
            ),
            cmWVUtils.addJson(
              `${myDesignSavedRoot.value}/${currDesignId.value}/${subDesignId}/ids`,
              {
                requestId,
                batchId,
              },
            ),
            polling(url, { isJson: false, useVer: !useUsBucket.value, pollingController }),
          ]

          if (showMore) {
            promises.push(
              cmWVUtils.cloneFile(
                `${myDesignSavedRoot.value}/${currDesignId.value}/prev/mask.png`,
                `${myDesignSavedRoot.value}/${currDesignId.value}/${subDesignId}/mask.png`,
              ),
            )
          } else {
            if (maskDataUrl.value) {
              promises.push(
                saveDesignImageToDocument(maskDataUrl.value, 'mask', {
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
        try {
          if (!prevGenSaved) {
            prevGenSaved = true
            await updatePrevGen({ requestId, params })
          }
        } catch (error) {
          // if saving failed, add log but don't make genImage fail
          // prevGenParams validness will be checked when 'show more'
          logUtils.setLog('updatePrevGen failed:')
          logUtils.setLogForError(error as Error)
        }
        RECORD_TIMING && testUtils.log('gen-image', '')
      }),
    ])
    return urls
  }

  const getFileNames = (action: string) => {
    switch (action) {
      case 'hidden-message':
        return 'init'
      case 'mask':
        return 'init,mask'
      default:
        return 'init,mask'
    }
  }

  const reuploadInputImages = async (userId: string, requestId: string, fileNames: string) => {
    const FILENAME_MAP = {
      init: ['input', 'jpg'],
      mask: ['mask', 'png'],
    } as { [key: string]: [string, string] }

    const promises = []
    for (const fileName of fileNames.split(',')) {
      const s3path = `${userId}/input/${requestId}_${fileName}`
      if (fileName === 'mask') {
        promises.push(
          prepareMaskToUpload(
            getTargetImageUrl(myDesignSavedType.value, currDesignId.value, 'prev', 'mask'),
          ).then((maskUrl) => {
            try {
              if (maskUrl === undefined) return
              return uploadImage(maskUrl, s3path)
            } catch (error) {
              throw new Error('Upload Mask Image Failed')
            }
          }),
        )
      } else {
        promises.push(
          cmWVUtils
            .uploadFileToS3(
              {
                path: `${myDesignSavedRoot.value}/${currDesignId.value}/prev/${FILENAME_MAP[fileName][0]}`,
                ext: FILENAME_MAP[fileName][1],
              },
              uploadMap.value ?? {},
              s3path,
            )
            .then((data) => {
              if (data.flag !== '0') throw new Error(`Upload image ${fileName} failed`)
            }),
        )
      }
    }
    await Promise.all(promises)
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
    try {
      const originalMaskDataUrl = getCanvasDataUrl()
      const maskUrl = await prepareMaskToUpload()
      if (maskUrl !== undefined) {
        RECORD_TIMING && testUtils.log('mask to dataUrl', '')
        RECORD_TIMING && testUtils.start('upload mask', { notify: false, setToLog: true })
        await uploadImage(maskUrl, `${userId}/input/${requestId}_mask`)
        RECORD_TIMING && testUtils.log('upload mask', '')
        if (originalMaskDataUrl) {
          setMaskDataUrl(originalMaskDataUrl) // record unconverted mask to store on generating
        }
      } else {
        throw new Error('Upload Mask Image Failed')
      }
    } catch (error) {
      logUtils.setLogAndConsoleLog('Upload Mask Image Failed')
      throw error
    }
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
