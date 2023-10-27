<template lang="pug">
div(v-if="step > 0" class="tutorial absolute w-screen h-screen" ref="overlayRef")
  component(v-if="targetRefs.length" v-model:clickable="clickable" :is="tutorials(name + '-tutorial')" :step="step" :elTargets="targetRefs" :trackingFrame="trackingFrame" @nextStep="nextStep")
</template>

<script setup lang="ts">
// bg-neutral-dark bg-opacity-70
import { useTutorialStore } from '@/stores/tutorial';
import webViewUtils from '@/utils/webViewUtils';
import { storeToRefs } from 'pinia';
import PowerfulFillTutorial from './PowerfulFillTutorial.vue';
const DEV = false // set to visualize clickable area
const tutorials = (name: string) => {
  const tutorials = [
    PowerfulFillTutorial
  ]
  return tutorials.find((t) => t.name === name)
}

// #region clickable area
const overlayRef = ref<HTMLElement | null>(null)
const clickableAreas = ref<{ el: HTMLElement, elTarget: HTMLElement }[]>([])
const tmTrackingClickableArea = ref(0)
const trackingFrame = ref(0)
const clickable = ref(false)

const insertClickableAreas = (elTargets = targetRefs.value) => {
  const elOverlay = overlayRef.value
  if (!elTargets.length || !elOverlay) return
  const clcikableAreaMouseenter = (evt: MouseEvent) => {
    if (!clickable.value) return
    elOverlay.style.pointerEvents = 'none';
    (evt.target as HTMLElement).style.pointerEvents = 'none'
  }
  const clcikableAreaMouseleave = (evt: MouseEvent) => {
    window.requestAnimationFrame(() => {
      elOverlay.style.pointerEvents = 'auto';
      (evt.target as HTMLElement).style.pointerEvents = 'auto'
    })
  }
  elTargets.forEach((elTarget) => {
    const { top, left, width, height } = elTarget.getBoundingClientRect()
    const elClickableArea = document.createElement('div')
    elClickableArea.classList.add('tutorial-clickable-area')
    if (DEV) {
      elClickableArea.classList.add('dev')
      if (!clickable.value) elClickableArea.classList.add('disabled')
    }
    elClickableArea.style.position = 'absolute'
    elClickableArea.style.zIndex = '1000'
    elClickableArea.style.top = `${top}px`
    elClickableArea.style.left = `${left}px`
    elClickableArea.style.width = `${width}px`
    elClickableArea.style.height = `${height}px`
    elClickableArea.addEventListener('mouseenter', clcikableAreaMouseenter)
    elClickableArea.addEventListener('mouseleave', clcikableAreaMouseleave)
    elClickableArea.addEventListener('click', () => undefined) // to make mouseenter and mouseleave fires on click in safari
    overlayRef.value?.insertAdjacentElement('afterbegin', elClickableArea)
    clickableAreas.value.push({ el: elClickableArea, elTarget })
  })
}

const updateClickableAreas = () => {
  if (!clickableAreas.value.length) return
  clickableAreas.value.forEach(({ el, elTarget }) => {
    const { top, left, width, height } = elTarget.getBoundingClientRect()
    el.style.top = `${top}px`
    el.style.left = `${left}px`
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    if (DEV) {
      if (clickable.value) el.classList.remove('disabled')
      else el.classList.add('disabled')
    }
  })
}

const removeClickableAreas = () => {
  while (clickableAreas.value.length) {
    clickableAreas.value[0].el.remove()
    clickableAreas.value.shift();
  }
}

const trackClickableArea = () => {
  if (!clickableAreas.value.length) return
  const update = () => {
    if (!tmTrackingClickableArea.value) return
    trackingFrame.value++
    updateClickableAreas()
    updateBackdrops()
    window.requestAnimationFrame(update)
  }
  window.clearTimeout(tmTrackingClickableArea.value)
  tmTrackingClickableArea.value = window.setTimeout(stopTrackingClickableArea, 500)
  window.requestAnimationFrame(update)
}

const stopTrackingClickableArea = () => {
  window.clearTimeout(tmTrackingClickableArea.value)
  tmTrackingClickableArea.value = 0
  trackingFrame.value = 0
}
// #endregion

// #region backdrop
type IBackdrop = {
  elBackdrop: HTMLElement,
  elClip: HTMLElement,
  elTarget: HTMLElement
}
const backdrops = ref<IBackdrop[]>([])
const updateBackdropPosition = (backdrop: IBackdrop) => {
  const isTarget = backdrop.elTarget === backdrop.elClip
  const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = backdrop.elClip
  backdrop.elBackdrop.style.top = `${offsetTop}px`
  backdrop.elBackdrop.style.left = `${offsetLeft}px`
  backdrop.elBackdrop.style.width = `${isTarget ? 0 : offsetWidth}px`
  backdrop.elBackdrop.style.height = `${isTarget ? 0 : offsetHeight}px`
  backdrop.elBackdrop.style.transform = window.getComputedStyle(backdrop.elClip).transform
}

const insertBackdrops = (elTargets = targetRefs.value) => {
  if (!elTargets.length) return
  elTargets.forEach(elTarget => {
    let currElement = elTarget as HTMLElement | null
    while (currElement && currElement.id !== 'app') {
      if (currElement === elTarget || window.getComputedStyle(currElement).overflow !== 'visible') {
        let isDuplicated = !!backdrops.value.find(backdrop => backdrop.elClip === currElement)
        for (const backdrop of backdrops.value) {
          if (currElement && backdrop.elClip === backdrop.elTarget && backdrop.elBackdrop.parentElement === currElement.parentElement) {
            isDuplicated = true
            break
          }
        }
        if (isDuplicated) {
          currElement = currElement.parentElement
          continue
        }
        const elBackdrop = document.createElement('div')
        const backdrop = { elBackdrop, elClip: currElement, elTarget }
        backdrop.elBackdrop.classList.add('tutorial-backdrop')
        backdrop.elBackdrop.style.pointerEvents = 'none'
        backdrop.elBackdrop.style.zIndex = '999'
        backdrop.elBackdrop.style.position = 'absolute'
        backdrop.elBackdrop.style.outline = 'solid 9999px rgba(18, 18, 18, 0.7)'
        updateBackdropPosition(backdrop)
        currElement.insertAdjacentElement('beforebegin', backdrop.elBackdrop)
        backdrops.value.push(backdrop)
      }
      currElement = currElement.parentElement;
    }
  })
}

const updateBackdrops = () => {
  backdrops.value.forEach(backdrop => {
    const elBackdrop = backdrop.elBackdrop
    const elTarget = backdrop.elClip
    if (!elBackdrop || !elTarget) return
    updateBackdropPosition(backdrop)
  })
}

const removeBackdrops = () => {
  while (backdrops.value.length > 0) {
    backdrops.value[0].elBackdrop.remove()
    backdrops.value.shift();
  }
}
// #endregion

// #region main
const tutorialStore = useTutorialStore()
const { tutorialNextStep, resetTutorial } = tutorialStore
const { name, step } = storeToRefs(tutorialStore)
const targetRefs = ref<HTMLElement[]>([])
const prevTargetStyleBuckups = ref<{ el: HTMLElement, cssText: string }[]>([])

const restorePrevTargetStyle = () => {
  if (!prevTargetStyleBuckups.value.length) return
  prevTargetStyleBuckups.value.forEach(({ el, cssText }) => {
    el.style.cssText = cssText
  })
  prevTargetStyleBuckups.value = []
}

const reset = () => {
  restorePrevTargetStyle()
  stopTrackingClickableArea()
  removeClickableAreas()
  removeBackdrops()
}

const nextStep = () => {
  tutorialNextStep(name.value)
}

const runStep = () => {
  reset()
  targetRefs.value = Array.from(document.getElementsByClassName(`tutorial-${name.value}-${step.value}`)) as HTMLElement[]
  const elTargets = targetRefs.value
  if (!elTargets.length) {
    // finish tutorial
    webViewUtils.updateTutorialFlags({ [name.value]: true })
    return resetTutorial()
  }
  elTargets.forEach(elTarget => {
    prevTargetStyleBuckups.value.push({ el: elTarget, cssText: elTarget.style.cssText })
    elTarget.style.zIndex = '999'
  })
  insertClickableAreas()
  insertBackdrops()
  trackClickableArea()
}

watch(() => step.value, () => nextTick(() => runStep()))
// #endregion
</script>

<style lang="scss">
.tutorial {
  z-index: 1000;
}

.tutorial-clickable-area.dev {
  border: solid 1px #009900;

  &.disabled {
    border: solid 1px #990000;
  }
}
</style>
