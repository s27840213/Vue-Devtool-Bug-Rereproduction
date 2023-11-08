import genImageApis from '@/apis/genImage'
import useUploadUtils from '@/composable/useUploadUtils'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageResult } from '@/types/api'
import { generalUtils, logUtils } from '@nu/shared-lib'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
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
    const res = (await genImageApis.genImage(userId.value, requestId, prompt, editorType.value))
      .data

    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }
    const json = await polling<GenImageResult>(
      `https://template.vivipic.com/charmix/${userId.value}/result/${requestId}.json`,
    )
    if (json.flag !== 0) {
      throw new Error('Run /gen-image Failed,' + json.msg ?? '')
    }

    setPrevGenParams({ requestId, prompt })
    return json.url
  }

  const uploadEditorAsImage = async (userId: string, requestId: string) => {
    const { width: pageWidth, height: pageHeight } = pageSize.value
    const size = Math.max(pageWidth, pageHeight)
    const { flag, imageId } = await cmWVUtils.copyEditor({
      width: pageWidth * contentScaleRatio.value,
      height: pageHeight * contentScaleRatio.value,
    })
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    return new Promise<void>((resolve) => {
      generalUtils.toDataURL(`chmix://screenshot/${imageId}?lsize=${size}`, (dataUrl) => {
        setInitImgSrc(dataUrl)
        const imageBlob = generalUtils.dataURLtoBlob(dataUrl)
        uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
          .then(resolve)
          .catch((error) => {
            logUtils.setLogAndConsoleLog('Upload Editor Image Failed')
            throw error
          })
      })
    })
  }

  const uploadMaskAsImage = async (userId: string, requestId: string) => {
    const bus = useEventBus('generation')
    return new Promise<void>((resolve, reject) => {
      bus.emit('genMaskUrl', {
        callback: async (maskUrl: string) => {
          try {
            await uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`)
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
