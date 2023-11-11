import genImageApis from '@/apis/genImage'
import useUploadUtils from '@/composable/useUploadUtils'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageResult } from '@/types/api'
import { generalUtils, logUtils } from '@nu/shared-lib'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import testUtils from '@nu/vivi-lib/utils/testUtils'
import { useEventBus } from '@vueuse/core'

const useGenImageUtils = () => {
  const userStore = useUserStore()
  const { setPrevGenParams } = userStore
  const { userId, prevGenParams } = storeToRefs(useUserStore())
  const editorStore = useEditorStore()
  const { setInitImgSrc } = editorStore
  const { editorType, pageSize, contentScaleRatio } = storeToRefs(useEditorStore())

  const { uploadImage, polling } = useUploadUtils()

  const genImage = async (prompt: string, showMore = false): Promise<string> => {
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
    testUtils.start('call API', false)
    const res = (await genImageApis.genImage(userId.value, requestId, prompt, editorType.value))
      .data
    testUtils.log('call API', '')

    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }
    testUtils.start('polling', false)
    const json = await polling<GenImageResult>(
      `https://template.vivipic.com/charmix/${userId.value}/result/${requestId}.json`,
    )
    testUtils.log('polling', '')
    if (json.flag !== 0) {
      throw new Error('Run /gen-image Failed,' + json.msg ?? '')
    }

    setPrevGenParams({ requestId, prompt })
    return json.url
  }

  const uploadEditorAsImage = async (userId: string, requestId: string) => {
    testUtils.start('copy editor', false)
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const size = Math.max(pageWidth, pageHeight)
    const { flag, imageId, cleanup } = await cmWVUtils.copyEditor({
      width: pageWidth * contentScaleRatio.value,
      height: pageHeight * contentScaleRatio.value,
    })
    testUtils.log('copy editor', '')
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    testUtils.start('screenshot to blob', false)
    return new Promise<void>((resolve) => {
      generalUtils.toDataURL(`chmix://screenshot/${imageId}?lsize=${size}`, (dataUrl) => {
        setInitImgSrc(dataUrl)
        const imageBlob = generalUtils.dataURLtoBlob(dataUrl)
        testUtils.log('screenshot to blob', '')
        testUtils.start('upload screenshot', false)
        uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
          .then(() => {
            testUtils.log('upload screenshot', '')
            console.log('screenshot:', (new Date()).getTime())
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
    const bus = useEventBus('generation')
    testUtils.start('mask to dataUrl', false)
    return new Promise<void>((resolve, reject) => {
      bus.emit('genMaskUrl', {
        callback: async (maskUrl: string) => {
          testUtils.log('mask to dataUrl', '')
          try {
            testUtils.start('upload mask', false)
            await uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`)
            testUtils.log('upload mask', '')
            console.log('mask:', (new Date()).getTime())
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
    genImage,
    uploadEditorAsImage,
    uploadMaskAsImage,
  }
}

export default useGenImageUtils
