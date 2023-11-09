import { ColorSlip } from '@/types/color'
import { defineStore } from 'pinia'

export interface IActionSheetBtn {
  labels: Array<{
    label: string
    labelColor: ColorSlip
    labelSize: string
  }>
  cb: () => void
}

export const useActionSheetStore = defineStore('actionSheet', () => {
  const isActionSheetOpen = ref(false)
  const primaryActions = reactive<Array<IActionSheetBtn>>([
    {
      labels: [
        {
          label: '123',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
        {
          label: '456',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
      ],
      cb: () => {
        console.log('cb')
      },
    },
    {
      labels: [
        {
          label: '123',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
        {
          label: '456',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
      ],
      cb: () => {
        console.log('cb')
      },
    },
  ])

  const secondaryActions = reactive<Array<IActionSheetBtn>>([
    {
      labels: [
        {
          label: '123',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
        {
          label: '456',
          labelColor: 'app-text-secondary',
          labelSize: 'typo-btn-lg',
        },
      ],
      cb: () => {
        console.log('cb')
      },
    },
  ])

  console.log(primaryActions, secondaryActions)

  const setPrimaryActions = (newActions: Array<IActionSheetBtn>) => {
    Object.assign(primaryActions, newActions)
  }

  const setSecondaryActions = (newActions: Array<IActionSheetBtn>) => {
    Object.assign(secondaryActions, newActions)
  }

  const toggleActionSheet = (resetFlag?: boolean) => {
    isActionSheetOpen.value = !isActionSheetOpen.value
    if (resetFlag) {
      reset()
    }
  }

  const reset = () => {
    isActionSheetOpen.value = false
    Object.assign(primaryActions, [
      {
        labels: [
          {
            label: '123',
            labelColor: 'app-text-secondary',
            labelSize: 'typo-btn-lg',
          },
          {
            label: '456',
            labelColor: 'app-text-secondary',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          console.log('cb')
        },
      },
    ])

    Object.assign(secondaryActions, [
      {
        labels: [
          {
            label: 'Cancel',
            labelColor: 'app-text-secondary',
            labelSize: 'typo-btn-lg',
          },
        ],
        cb: () => {
          console.log('cb')
        },
      },
    ])
  }
  return {
    isActionSheetOpen,
    primaryActions,
    secondaryActions,
    setPrimaryActions,
    setSecondaryActions,
    toggleActionSheet,
    reset,
  }
})
