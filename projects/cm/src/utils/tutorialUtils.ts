import { useTutorialStore } from "@/stores/tutorial";
import webViewUtils from "./webViewUtils";

type ITutorialName = 'powerful-fill'

export default new (class TutorialUtils {
  get isDuringTutorial() {
    const { name } = storeToRefs(useTutorialStore())
    return computed(() => !!name.value)
  }

  runTutorial(tutorialName: ITutorialName) {
    if (webViewUtils.tutorialFlags['powerful-fill']) return
    useTutorialStore().showTutorial(tutorialName)
  }

  nextStep(tutorialName: ITutorialName) {
    useTutorialStore().tutorialNextStep(tutorialName)
  }
})
