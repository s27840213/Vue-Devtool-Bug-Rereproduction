import { defineStore } from 'pinia'

export const useTutorialStore = defineStore('tutorial', () => {
  const name = ref('')
  const step = ref(0)

  const showTutorial = (tutorialName: string) => {
    name.value = tutorialName
    step.value = 1
  }

  const tutorialNextStep = (tutorialName: string) => {
    if(name.value === tutorialName) step.value++
  }

  const resetTutorial = () => {
    name.value = ''
    step.value = 0
  }

  return {
    name,
    step,
    showTutorial,
    tutorialNextStep,
    resetTutorial
  }
})
