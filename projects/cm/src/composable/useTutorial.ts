import { useTutorialStore } from "@/stores/tutorial"
import { EditorType } from "@/types/editor"
import cmWVUtils from "@nu/vivi-lib/utils/cmWVUtils"

const tutorialList: EditorType[] = ['powerful-fill', 'hidden-message']

const useTutorial = () => {
  const tutorialStore = useTutorialStore()

  const isDuringTutorial = computed(() => {
    return !!tutorialStore.name
  })

  const runTutorial = (tutorialName: EditorType) => {
      if (
        cmWVUtils.inBrowserMode || // skip tutorial for devs
        !tutorialList.includes(tutorialName) || // tutorial doesn't exist
        cmWVUtils.tutorialFlags[tutorialName] // tutorial already done
      )
        return
      tutorialStore.showTutorial(tutorialName)
  }

  const nextStep = (tutorialName: EditorType) => {
    tutorialStore.tutorialNextStep(tutorialName)
  }

  return {
    isDuringTutorial,
    runTutorial,
    nextStep
  }
}

export default useTutorial
