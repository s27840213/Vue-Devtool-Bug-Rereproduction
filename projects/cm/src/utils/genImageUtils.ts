import genImageApis from '@/apis/genImage'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { GenImageResult } from '@/types/api'
import cmWVUtils from '@/utils/cmWVUtils'
import uploadUtilsCm from '@/utils/uploadUtilsCm'
import { generalUtils, logUtils } from '@nu/shared-lib'
import testUtils from '@nu/vivi-lib/utils/testUtils'
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
    testUtils.start('call API', false)
    const res = (await genImageApis.genImage(userId, requestId, prompt, editorType)).data
    testUtils.log('call API', '')
    if (res.flag !== 0) {
      throw new Error('Call /gen-image Failed, ' + res.msg ?? '')
    }
    testUtils.start('polling', false)
    const json = await uploadUtilsCm.polling<GenImageResult>(`https://template.vivipic.com/charmix/${userId}/result/${requestId}.json`)
    testUtils.log('polling', '')
    if (json.flag !== 0) {
      throw new Error('Run /gen-image Failed,' + json.msg ?? '')
    }
    return json.url
  }

  async uploadEditorAsImage(userId: string, requestId: string) {
    testUtils.start('copy editor', false)
    const { flag, imageId } = await cmWVUtils.copyEditor()
    testUtils.log('copy editor', '')
    if (flag !== '0') {
      logUtils.setLogAndConsoleLog('Screenshot Failed')
      throw new Error('Screenshot Failed')
    }
    const { pageSize } = useEditorStore()
    const { width: pageWidth, height: pageHeight } = pageSize
    const size = Math.max(pageWidth, pageHeight)
    testUtils.start('screenshot to blob', false)
    return new Promise<void>(resolve => {
      generalUtils.toDataURL(`chmix://screenshot/${imageId}?lsize=${size}`, (dataUrl) => {
        const imageBlob = generalUtils.dataURLtoBlob(dataUrl)
        testUtils.log('screenshot to blob', '')
        testUtils.start('upload screenshot', false)
        uploadUtilsCm.uploadImage(imageBlob, `${userId}/input/${requestId}_init.png`)
          .then(() => {
            testUtils.log('upload screenshot', '')
            console.log('screenshot:', (new Date()).getTime())
            resolve()
          })
          .catch((error) => {
            logUtils.setLogAndConsoleLog('Upload Editor Image Failed')
            throw error
          })
      })
    })
  }

  async uploadMaskAsImage(userId: string, requestId: string) {
    const bus = useEventBus('generation')
    testUtils.start('mask to dataUrl', false)
    return new Promise<void>((resolve, reject) => {
      bus.emit('genMaskUrl', {
        callback: async (maskUrl: string) => {
          testUtils.log('mask to dataUrl', '')
          try {
            testUtils.start('upload mask', false)
            await uploadUtilsCm.uploadImage(maskUrl, `${userId}/input/${requestId}_mask.png`)
            testUtils.log('upload mask', '')
            console.log('mask:', (new Date()).getTime())
            resolve()
          } catch (error) {
            logUtils.setLogAndConsoleLog('Upload Mask Image Failed')
            reject(error)
          }
        }
      })
    })
  }
})()
