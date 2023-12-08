import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { ICmMyDesign } from '@/types/user'
import { saveToCameraRoll } from '@/utils/pixiRecorder'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import useActionSheet from './useActionSheet'
const useActionSheetCm = () => {
  const userStore = useUserStore()
  const { getSubDesignImage, listDesigns } = userStore
  const { currOpenSubDesign, isSubDesignOpen } = storeToRefs(userStore)
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
  const { currGeneratedResults, editorType } = storeToRefs(editorStore)

  const savePhotoCb = async () => {
    let targetUrl = ''
    if (isSubDesignOpen.value && currOpenSubDesign.value) {
      targetUrl = await generalUtils.toDataUrlNew(getSubDesignImage(currOpenSubDesign.value))
    } else {
      targetUrl = await generalUtils.toDataUrlNew(currGeneratedResults.value.url)
    }
    return cmWVUtils.saveAssetFromUrl('png', targetUrl)
  }
  const saveVideoCb = () => {
    if (currGeneratedResults.value.video) {
      return saveToCameraRoll(currGeneratedResults.value.video)
    } else {
      throw new Error('video not generated yet')
    }
  }

  const setSavingActions = () => {
    setPrimaryActions([
      {
        labels: [
          {
            label: `${t('CM0075')}:`,
            labelColor: 'app-tab-active',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0076'),
            labelColor: 'app-text-secondary',
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
            labelColor: 'app-text-secondary',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          savePhotoCb()
            .then((data) => {
              const { flag, msg } = data
              if (flag === '1') {
                throw new Error(msg)
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
            labelColor: 'app-text-secondary',
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
            labelColor: 'app-tab-active',
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
            labelColor: 'app-text-secondary',
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
            labelColor: 'app-tab-active',
            labelSize: 'typo-h6',
          },
          {
            label: t('CM0123'),
            labelColor: 'app-text-secondary',
            labelSize: 'typo-body-sm',
          },
        ],
        cb: () => {
          console.log(design)
        },
      },
      {
        labels: [
          {
            label: t('NN0034'),
            labelColor: 'app-text-secondary',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          savePhotoCb()
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
                text: 'gen photo error',
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
            labelColor: 'app-text-secondary',
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
    setMyDesignActions,
    reset,
    toggleActionSheet,
  }
}

export default useActionSheetCm
