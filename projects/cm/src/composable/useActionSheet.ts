/**
 * @Note this is the pure file to use action sheet
 * If you want to customize the usage, don't pollute this file
 * This file may be move to shared-lib in the future
 */

import { useActionSheetStore } from '@/stores/actionSheet'

const useActionSheet = () => {
  const actionSheetStore = useActionSheetStore()
  const { setPrimaryActions, setSecondaryActions, reset, toggleActionSheet } = actionSheetStore
  const { isActionSheetOpen, primaryActions, secondaryActions } = storeToRefs(actionSheetStore)

  return {
    setPrimaryActions,
    setSecondaryActions,
    isActionSheetOpen,
    primaryActions,
    secondaryActions,
    toggleActionSheet,
    reset,
  }
}

export default useActionSheet
