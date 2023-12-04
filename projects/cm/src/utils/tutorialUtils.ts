import { useTutorialStore } from '@/stores/tutorial'
import type { EditorType } from '@/types/editor'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'

const tutorialList: EditorType[] = ['powerful-fill']

export default new (class TutorialUtils {
  get isDuringTutorial() {
    const { name } = storeToRefs(useTutorialStore())
    return computed(() => !!name.value)
  }

  runTutorial(tutorialName: EditorType) {
    if (
      cmWVUtils.inBrowserMode ||
      !tutorialList.includes(tutorialName) ||
      cmWVUtils.tutorialFlags[tutorialName]
    )
      return
    useTutorialStore().showTutorial(tutorialName)
  }

  nextStep(tutorialName: EditorType) {
    useTutorialStore().tutorialNextStep(tutorialName)
  }
})()
