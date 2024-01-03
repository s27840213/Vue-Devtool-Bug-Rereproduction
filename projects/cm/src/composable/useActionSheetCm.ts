import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { useVideoRcordStore } from '@/stores/videoRecord'
import { ICmMyDesign, ITmpSubDesign } from '@/types/user'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils, { ISaveAssetFromUrlResponse } from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import useActionSheet from './useActionSheet'
const useActionSheetCm = () => {
  const userStore = useUserStore()
  const { getSubDesignImage, deleteDesign, deleteSubDesign } = userStore
  const { currOpenSubDesign, isSubDesignOpen, removeWatermark, highResolutionPhoto } =
    storeToRefs(userStore)
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
  const { currGeneratedResult } = storeToRefs(editorStore)

  const savePhotoCb = async () => {
    let targetUrl = ''
    if (isSubDesignOpen.value && currOpenSubDesign.value) {
      targetUrl = getSubDesignImage(currOpenSubDesign.value)
    } else {
      targetUrl = currGeneratedResult.value.url
    }
    if (targetUrl.startsWith('chmix://')) {
      const { path, name, type } = cmWVUtils.getDocumentPath(targetUrl)
      return cmWVUtils.documentToCameraRoll(
        path,
        name,
        type,
        !removeWatermark.value,
        highResolutionPhoto.value ? 2 : 1,
        'scale',
      )
    } else {
      return cmWVUtils.saveAssetFromUrl('jpg', await generalUtils.toDataUrlNew(targetUrl, 'jpg'))
    }
  }
  const saveVideoCb = async () => {
    const videoRecord = useVideoRcordStore()
    const { saveToCameraRoll, setGenVideoCb, setIsExportVideo } = videoRecord
    const { isGeningVideo } = storeToRefs(videoRecord)
    setIsExportVideo(true)
    if (currGeneratedResult.value && currGeneratedResult.value.video) {
      return saveToCameraRoll(currGeneratedResult.value.video)
    } else if (isGeningVideo.value)  {
      // isGeningVideo but not finished gening
      return new Promise<ISaveAssetFromUrlResponse>((resolve) => {
        setGenVideoCb(() => resolve(saveToCameraRoll(currGeneratedResult.value.video)))
        console.log('video not generated yet, wait for it generated')
      })
    } else if (currOpenSubDesign.value) {
      // is not GeningVideo called by mydesign
      const { addImage, genVideo } = videoRecord
      const srcInit = getSubDesignImage(currOpenSubDesign.value, 'original')
      const srcRes = getSubDesignImage(currOpenSubDesign.value, 'thumb')
      await addImage(srcInit, srcRes)
      const data = await genVideo()
      return saveToCameraRoll(data || undefined)
    }
  }

  const sharePhotoCb = async () => {
    let targetUrl = ''
    if (isSubDesignOpen.value && currOpenSubDesign.value) {
      targetUrl = getSubDesignImage(currOpenSubDesign.value)
    } else {
      targetUrl = currGeneratedResult.value.url
    }
    if (targetUrl.startsWith('chmix://')) {
      const { path, name, type } = cmWVUtils.getDocumentPath(targetUrl)
      return cmWVUtils.shareFile(`${path}/${name}.${type}`)
    } else {
      console.log('retry or something else') // TODO: need to discuss with native for this case
      throw new Error('not implemented yet')
    }
  }
  const shareVideoCb = async () => {
    console.log('share video')
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
    savePhotoCb,
    saveVideoCb,
    sharePhotoCb,
    shareVideoCb,
    reset,
    toggleActionSheet,
  }
}

export default useActionSheetCm
