<template lang="pug">
div(v-if="step > 0" class="z-tutorial-overlay absolute w-screen h-screen " ref="overlayRef")
  component(v-if="highlightRefs.length" :is="tutorials(name + '-tutorial')" :step="step" :elHighlight="highlightRefs" :trackingFrame="trackingFrame" @nextStep="nextStep")
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

const insertClickableAreas = (elTargets = clickableRefs.value) => {
  const elOverlay = overlayRef.value
  if (!elTargets.length || !elOverlay) return
  const clcikableAreaMouseenter = (evt: MouseEvent) => {
    elOverlay.style.pointerEvents = 'none';
    (evt.target as HTMLElement).style.pointerEvents = 'none'
  }
  const clcikableAreaMouseleave = (evt: MouseEvent) => {
    window.requestAnimationFrame(() => {
      elOverlay.style.pointerEvents = 'auto';
      (evt.target as HTMLElement).style.pointerEvents = 'auto'
    })
    nextStep()
  }
  elTargets.forEach((elTarget) => {
    const { top, left, width, height } = elTarget.getBoundingClientRect()
    const elClickableArea = document.createElement('div')
    elClickableArea.classList.add('tutorial-clickable-area')
    if (DEV) {
      elClickableArea.classList.add('dev')
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
  })
}

const removeClickableAreas = () => {
  while (clickableAreas.value.length) {
    clickableAreas.value[0].el.remove()
    clickableAreas.value.shift();
  }
}

const trackClickableArea = () => {
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

const insertBackdrops = (elTargets = highlightRefs.value) => {
  if (!elTargets.length) return
  elTargets.forEach(elTarget => {
    let currElement = elTarget as HTMLElement | null
    while (currElement && currElement.id !== 'app') {
      const currElementStyles = window.getComputedStyle(currElement)
      // if element trigger a new stacking context, outline can be clipped by overflow. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context
      const isNewStackingContext = currElementStyles.position !== 'static' || currElementStyles.transform !== 'none'
      const isClipped = currElementStyles.overflow !== 'visible' && isNewStackingContext
      if (currElement === elTarget || isClipped) {
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
        backdrop.elBackdrop.classList.add('tutorial-backdrop', 'z-tutorial-highlight')
        backdrop.elBackdrop.style.pointerEvents = 'none'
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
const highlightRefs = ref<HTMLElement[]>([])
const clickableRefs = ref<HTMLElement[]>([])
const prevHighlightRefs = ref<HTMLElement[]>([])

const restorePrevHighlightStyle = () => {
  while (prevHighlightRefs.value.length > 0) {
    prevHighlightRefs.value[0].classList.remove('z-tutorial-highlight')
    prevHighlightRefs.value.shift();
  }
}

const reset = () => {
  restorePrevHighlightStyle()
  stopTrackingClickableArea()
  removeClickableAreas()
  removeBackdrops()
}

const nextStep = () => {
  tutorialNextStep(name.value)
}

const runStep = () => {
  reset()
  highlightRefs.value = Array.from(document.getElementsByClassName(`tutorial-${name.value}-${step.value}--highlight`)) as HTMLElement[]
  clickableRefs.value = Array.from(document.getElementsByClassName(`tutorial-${name.value}-${step.value}--clickable`)) as HTMLElement[]
  const elHighlights = highlightRefs.value
  if (name.value && !elHighlights.length) {
    // finish tutorial
    webViewUtils.updateTutorialFlags({ [name.value]: true })
    return resetTutorial()
  }
  elHighlights.forEach(elHighlight => {
    elHighlight.classList.add('z-tutorial-highlight')
    prevHighlightRefs.value.push(elHighlight)
  })
  insertClickableAreas()
  insertBackdrops()
  trackClickableArea()
}

watch(() => step.value, () => nextTick(() => runStep()))
// #endregion
</script>

<style lang="scss">
.tutorial-clickable-area.dev {
  border: solid 1px #009900;
}
</style>
