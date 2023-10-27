import { useTutorialStore } from "@/stores/tutorial";
import webViewUtils from "./webViewUtils";

const tutorialStore = useTutorialStore()
type tutorialName = 'powerful-fill'

export default new (class TutorialUtils {
  runTutorial(tutorialName: tutorialName) {
    if (webViewUtils.tutorialFlags['powerful-fill']) return
    tutorialStore.showTutorial(tutorialName)
  }

  nextStep(tutorialName: tutorialName) {
    useTutorialStore().tutorialNextStep(tutorialName)
  }
})
