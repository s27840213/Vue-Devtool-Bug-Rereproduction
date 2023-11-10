import { useEditorStore } from '@/stores/editor'
import { saveToCameraRoll } from '@/utils/pixiRecorder'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import useActionSheet from './useActionSheet'

const useActionSheetCm = () => {
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
  const { currGeneratedResults } = storeToRefs(editorStore)

  const savePhotoCb = () => {
    return cmWVUtils.saveAssetFromUrl('png', currGeneratedResults.value.url)
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
            .then(() => {
              notify({
                group: 'success',
                text: `${t('NN0889')}`,
              })
            }).catch((e) => {
              console.log(e)
              // @TODO
              notify({
                group: 'error',
                text: 'gen photo error',
              })
            })
        }
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
            }).catch((e) => {
              console.log(e)
              // @TODO
              notify({
                group: 'error',
                text: 'gen vedio error',
              })
            })
        }
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
            }).catch(() => {
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

  return {
    isActionSheetOpen,
    primaryActions,
    secondaryActions,
    setSavingActions,
    reset,
    toggleActionSheet,
  }
}

export default useActionSheetCm
