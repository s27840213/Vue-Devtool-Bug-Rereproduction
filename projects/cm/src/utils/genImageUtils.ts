import genImageApis from '@/apis/genImage'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageResult } from '@/types/api'
import uploadUtilsCm from '@/utils/uploadUtilsCm'
import cmWVUtils from '@/utils/cmWVUtils'
import { generalUtils, logUtils } from '@nu/shared-lib'
import { useEventBus } from '@vueuse/core'

export default new (class GenImageUtils {
  async genImage(prompt: string): Promise<string> {
    const { userId } = useUserStore()
    const { editorType } = useEditorStore()
    const requestId = generalUtils.generateAssetId()
    try {
      await Promise.all([
        this.uploadEditorAsImage(userId, requestId),
        this.uploadMaskAsImage(userId, requestId)
      ])
    } catch (error) {
      logUtils.setLogForError(error as Error)
      throw new Error('Upload Images For /gen-image Failed')
    }
    const res = (await genImageApis.genImage(userId, requestId, prompt, editorType)).data
    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }
    const json = await uploadUtilsCm.polling<GenImageResult>(`https://template.vivipic.com/charmix/${userId}/result/${requestId}.json`)
    if (json.flag !== 0) {
      throw new Error('Run /gen-image Failed,' + json.msg ?? '')
    }
    return json.url
  }

  async uploadEditorAsImage(userId: string, requestId: string) {
    const { flag, imageId } = await cmWVUtils.copyEditor()
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    const { pageSize } = useEditorStore()
    const { width: pageWidth, height: pageHeight } = pageSize
    const size = Math.max(pageWidth, pageHeight)
    const imageRes = await fetch(`chmix://screenshot/${imageId}?lsize=${size}`)
    const imageBlob = await imageRes.blob()
    try {
      await uploadUtilsCm.uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
    } catch (error) {
      logUtils.setLogAndConsoleLog('Upload Editor Image Failed')
      throw error
    }
  }

  async uploadMaskAsImage(userId: string, requestId: string) {
    const bus = useEventBus('generation')
    return new Promise<void>((resolve, reject) => {
      bus.emit('genMaskUrl', { callback: async (maskUrl: string) => {
        try {
          await uploadUtilsCm.uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`)
          resolve()
        } catch (error) {
          logUtils.setLogAndConsoleLog('Upload Mask Image Failed')
          reject(error)
        }
      }})
    })
  }
})()
