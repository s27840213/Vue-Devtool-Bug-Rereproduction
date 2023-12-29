import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { ICmMyDesign, ITmpSubDesign } from '@/types/user'
import { saveToCameraRoll } from '@/utils/pixiRecorder'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
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
  const saveVideoCb = () => {
    if (currGeneratedResult.value.video) {
      return saveToCameraRoll(currGeneratedResult.value.video)
    } else {
      throw new Error('video not generated yet')
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
      throw new Error ('not implemented yet')
    }
  }
  const shareVideoCb = async () => {
    console.log('share video')
  }

  const setSavingActions = () => {
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
        cb: () => {
          savePhotoCb()
            .then((data) => {
              const { flag } = data
              if (flag === '1') {
                throw new Error(data.msg)
              }
              notify({
                group: 'success',
                text: `${t('NN0889')}`,
              })
              toggleActionSheet()
            })
            .catch((e) => {
              console.log(e)
              notify({
                group: 'error',
                text: e,
              })
            })
        },
      },
      {
        labels: [
          {
            label: t('CM0077'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          saveVideoCb()
            .then(() => {
              notify({
                group: 'success',
                text: `${t('NN0889')}`,
              })
              toggleActionSheet()
            })
            .catch((e) => {
              console.log(e)
              // @TODO
              notify({
                group: 'error',
                text: 'gen vedio error',
              })
            })
        },
      },
      {
        labels: [
          {
            label: `${t('NN0416')} & ${t('CM0077')}`,
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          Promise.all([savePhotoCb(), saveVideoCb()])
            .then(() => {
              notify({
                group: 'success',
                text: `${t('NN0889')}`,
              })
              toggleActionSheet()
            })
            .catch(() => {
              notify({
                group: 'error',
                text: 'error',
              })
            })
        },
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

  const setSharingActions = () => {
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
        cb: () => {
          sharePhotoCb()
            .then((data) => {
              const { flag } = data
              if (flag === '1') {
                throw new Error(data.msg)
              }
              toggleActionSheet()
            })
            .catch((e) => {
              console.log(e)
              notify({
                group: 'error',
                text: e,
              })
            })
        },
      },
      {
        labels: [
          {
            label: t('CM0077'),
            labelColor: 'white',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          shareVideoCb()
            .then(() => {
              toggleActionSheet()
            })
            .catch((e) => {
              console.log(e)
              // @TODO
              notify({
                group: 'error',
                text: 'gen vedio error',
              })
            })
        },
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
    reset,
    toggleActionSheet,
  }
}

export default useActionSheetCm
