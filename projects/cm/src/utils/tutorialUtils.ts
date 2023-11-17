import { useTutorialStore } from '@/stores/tutorial'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'

type ITutorialName = 'powerful-fill'

export default new (class TutorialUtils {
  get isDuringTutorial() {
    const { name } = storeToRefs(useTutorialStore())
    return computed(() => !!name.value)
  }

  runTutorial(tutorialName: ITutorialName) {
    if (cmWVUtils.inBrowserMode ||
      cmWVUtils.tutorialFlags['powerful-fill']) return
    useTutorialStore().showTutorial(tutorialName)
  }

  nextStep(tutorialName: ITutorialName) {
    useTutorialStore().tutorialNextStep(tutorialName)
  }
})()
