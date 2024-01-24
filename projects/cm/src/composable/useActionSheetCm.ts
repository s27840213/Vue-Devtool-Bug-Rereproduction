import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { useVideoRcordStore } from '@/stores/videoRecord'
import { ICmMyDesign, ITmpSubDesign } from '@/types/user'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils, { GeneralResponse, ISaveAssetFromUrlResponse } from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import useActionSheet from './useActionSheet'
import useStateInfo from './useStateInfo'

const useActionSheetCm = () => {
  const userStore = useUserStore()
  const { getSubDesignImage, deleteDesign, deleteSubDesign } = userStore
  const { currOpenSubDesign, removeWatermark, highResolutionPhoto } = storeToRefs(userStore)
  const { t } = useI18n()
  const {
    isActionSheetOpen,
    primaryActions,
    secondaryActions,
    setPrimaryActions,
    setSecondaryActions,
    reset,
    toggleActionSheet,
  } = useActionSheet()

  const editorStore = useEditorStore()
  const { currGeneratedResult, currDesignId, myDesignSavedRoot, editorType } = storeToRefs(editorStore)

  const { atEditor } = useStateInfo()

  const photoCb = async (action: string) => {
    let tempId = generalUtils.generateRandomString(6)
    let lastTempId = tempId
    let targetUrl = ''
    if (!atEditor.value && currOpenSubDesign.value) {
      targetUrl = getSubDesignImage(currOpenSubDesign.value)
    } else {
      targetUrl = currGeneratedResult.value?.url ?? ''
    }
    if (targetUrl.startsWith('chmix://')) {
      const { path, ext } = cmWVUtils.getDocumentPath(targetUrl)
      if (!removeWatermark.value) {
        const dataUrl = await cmWVUtils.addWaterMark2Img(targetUrl, 'jpg', 100)
        await cmWVUtils.saveAssetFromUrl('jpg', dataUrl, `screenshot/${tempId}`)
      }
      if (action === 'save') {
        return await cmWVUtils.documentToCameraRoll(
          removeWatermark.value ? path : `screenshot/${tempId}`,
          ext,
          highResolutionPhoto.value ? 2 : 1,
          'scale',
        )
      } else {
        if (highResolutionPhoto.value) {
          lastTempId = tempId
          tempId = generalUtils.generateRandomString(6)
          await cmWVUtils.resizeImage(
            removeWatermark.value ? `${path}` : `screenshot/${lastTempId}`,
            `screenshot/${tempId}`,
            ext,
            2,
            'scale',
          )
        }
        return await cmWVUtils.shareFile(
          removeWatermark.value && !highResolutionPhoto.value
            ? `${path}.${ext}`
            : `screenshot/${tempId}.${ext}`,
        )
      }
    } else {
      if (!removeWatermark.value) {
        const dataUrl = await cmWVUtils.addWaterMark2Img(targetUrl, 'jpg', 100)
        await cmWVUtils.saveAssetFromUrl('jpg', dataUrl, `screenshot/${tempId}`)
      } else {
        await cmWVUtils.saveAssetFromUrl('jpg', targetUrl, `screenshot/${tempId}`)
      }
      if (action === 'save') {
        return await cmWVUtils.documentToCameraRoll(
          `screenshot/${tempId}`,
          'jpg',
          highResolutionPhoto.value ? 2 : 1,
          'scale',
        )
      } else {
        if (highResolutionPhoto.value) {
          lastTempId = tempId
          tempId = generalUtils.generateRandomString(6)
          await cmWVUtils.resizeImage(
            `screenshot/${lastTempId}`,
            `screenshot/${tempId}`,
            'jpg',
            2,
            'scale',
          )
        }
        return await cmWVUtils.shareFile(`screenshot/${tempId}.jpg`)
      }
    }
  }
  const videoCb = async (action: string) => {
    const tempId = generalUtils.generateRandomString(6)
    const videoRecord = useVideoRcordStore()
    const { genVideo, saveToDevice, setGenVideoCb, setIsExportVideo } = videoRecord
    const { isGeningVideo } = storeToRefs(videoRecord)
    const userStore = useUserStore()
    const { removeWatermark } = storeToRefs(userStore)
    setIsExportVideo(true)
    if (currGeneratedResult.value && currGeneratedResult.value.video) {
      if (currGeneratedResult.value.video.removeWatermark !== removeWatermark.value) {
        await genVideo()
      }
      if (action === 'save') {
        return await saveToDevice({ url: currGeneratedResult.value.video.src })
      } else {
        await saveToDevice({
          url: currGeneratedResult.value.video.src,
          path: `screenshot/${tempId}`
        })
        return await cmWVUtils.shareFile(`screenshot/${tempId}.mp4`)
      }
    } else if (isGeningVideo.value) {
      // isGeningVideo but not finished gening
      return new Promise<ISaveAssetFromUrlResponse | GeneralResponse>((resolve) => {
        setGenVideoCb(async () => {
          if (currGeneratedResult.value?.video?.removeWatermark !== removeWatermark.value) {
            await genVideo()
          }
          if (action === 'save') {
            resolve(await saveToDevice({ url: currGeneratedResult.value?.video?.src }))
          } else {
            await saveToDevice({
              url: currGeneratedResult.value?.video?.src,
              path: `screenshot/${tempId}`
            })
            resolve(await cmWVUtils.shareFile(`screenshot/${tempId}.mp4`))
          }
        })
      })
    } else if (currOpenSubDesign.value) {
      // is not GeningVideo called by mydesign
      const data = await genCurrSubDesignVideo()
      if (action === 'save') {
        return await saveToDevice({ url: data?.src || undefined, revokeUrl: true })
      } else {
        await saveToDevice({
          url: data?.src || undefined,
          path: `screenshot/${tempId}`,
          revokeUrl: true
        })
        return await cmWVUtils.shareFile(`screenshot/${tempId}.mp4`)
      }
    }
  }

  const genCurrSubDesignVideo = async () => {
    if (!currOpenSubDesign.value) throw new Error('currOpenSubDesign.value is undefined')

    const { addImage, genVideo } = useVideoRcordStore()
    const { getInitialImg, getSubDesignThumbUrl } = useUserStore()
    const subDesign = currOpenSubDesign.value

    const thumbUrl = getSubDesignThumbUrl(
      subDesign.type,
      subDesign.id,
      subDesign.subId
    )

    if (subDesign.type === 'powerful-fill') {
      await addImage(getInitialImg(), thumbUrl)
        .catch(async () => {
          await addImage(getSubDesignImage(subDesign, 'original'), thumbUrl)
        })
    } else if (subDesign.type === 'hidden-message' || subDesign.type === 'magic-combined') {
      await addImage(getSubDesignImage(subDesign, 'original'), thumbUrl)
        .catch(async () => {
          await addImage(getInitialImg(), thumbUrl)
        })
    } else {
      throw new Error(
        'the editorType in genCurrSubDesignVideo is not valid, editorType:' + subDesign.type
      )
    }
    return genVideo()
  }

  const setSavingActions = (
    photoCb: () => void,
    videoCb: () => void,
    photoAndVideoCb: () => void,
  ) => {
    setPrimaryActions([
      {
        labels: [
          {
            label: `${t('CM0075')}:`,
            labelColor: 'yellow-cm',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0076'),
            labelColor: 'white',
            labelSize: 'typo-body-sm',
          },
        ],
        cb: () => {
          //
        },
      },
      {
        labels: [
          {
            label: t('NN0416'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: photoCb,
      },
      {
        labels: [
          {
            label: t('CM0077'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: videoCb,
      },
      {
        labels: [
          {
            label: `${t('NN0416')} & ${t('CM0077')}`,
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: photoAndVideoCb,
      },
    ])

    setSecondaryActions([
      {
        labels: [
          {
            label: t('NN0203'),
            labelColor: 'yellow-cm',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          toggleActionSheet()
        },
      },
    ])
  }

  const setSharingActions = (photoCb: () => void, videoCb: () => void) => {
    setPrimaryActions([
      {
        labels: [
          {
            label: `${t('CM0084')}:`,
            labelColor: 'yellow-cm',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0076'),
            labelColor: 'white',
            labelSize: 'typo-body-sm',
          },
        ],
        cb: () => {
          //
        },
      },
      {
        labels: [
          {
            label: t('NN0416'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: photoCb,
      },
      {
        labels: [
          {
            label: t('CM0077'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: videoCb,
      },
    ])

    setSecondaryActions([
      {
        labels: [
          {
            label: t('NN0203'),
            labelColor: 'yellow-cm',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          toggleActionSheet()
        },
      },
    ])
  }

  const setMyDesignActions = (design: ICmMyDesign) => {
    setPrimaryActions([
      {
        labels: [
          {
            label: `${t('CM0122')}`,
            labelColor: 'yellow-cm',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0123'),
            labelColor: 'white',
            labelSize: 'typo-body-sm',
          },
        ],
        cb: () => {
          console.log(design)
        },
        clickable: false,
      },
      {
        labels: [
          {
            label: t('NN0034'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          deleteDesign(design)
          toggleActionSheet()
        },
      },
    ])

    setSecondaryActions([
      {
        labels: [
          {
            label: t('NN0203'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          toggleActionSheet()
        },
      },
    ])
  }

  const setSubDesignActions = (design: ITmpSubDesign) => {
    setPrimaryActions([
      {
        labels: [
          {
            label: `${t('CM0141')}`,
            labelColor: 'yellow-cm',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0140'),
            labelColor: 'white',
            labelSize: 'typo-body-sm',
          },
        ],
        cb: () => {
          console.log(design)
        },
        clickable: false,
      },
      {
        labels: [
          {
            label: t('NN0034'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          deleteSubDesign(design)
          toggleActionSheet()
        },
      },
    ])

    setSecondaryActions([
      {
        labels: [
          {
            label: t('NN0203'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          toggleActionSheet()
        },
      },
    ])
  }

  return {
    isActionSheetOpen,
    primaryActions,
    secondaryActions,
    setSavingActions,
    setSharingActions,
    setMyDesignActions,
    setSubDesignActions,
    genCurrSubDesignVideo,
    photoCb,
    videoCb,
    reset,
    toggleActionSheet,
  }
}

export default useActionSheetCm
