<template lang="pug">
div(class="tour-guide")
  div(class="tour-guide__container" ref="tour")
    div(class="tour-guide__step") {{ currentStep + 1 }} / {{ steps.length }}
    div(class="tour-guide__title") {{ stepInfo.title }}
    div {{ stepInfo.content }}
    div(class="tour-guide__actions mt-15")
      btn(v-if="stepInfo.skip"
        class="skip"
        @click.native="handleSkip") {{ stepInfo.skip.text }}
      btn(v-if="stepInfo.next"
        class="next"
        @click.native="handleNextStep") {{ stepInfo.next.text }}
      btn(v-if="stepInfo.finish"
        class="finish"
        @click.native="handleFinish") {{ stepInfo.finish.text }}
  div(class="tour-guide__arrow" ref="arrow")
</template>

<script lang="ts">
import guideUtils from '@/utils/guideUtils'
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    startIndex: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      active: false,
      currentStep: this.startIndex,
      targetPosition: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      } as { [key: string]: number | undefined },
      steps: [
        {
          target: '.panel-template',
          placement: 'right-start',
          title: this.$t('NN0263'),
          offset: { x: 10, y: 100 },
          content: this.$t('NN0264'),
          skip: { text: this.$t('NN0271'), action: () => guideUtils.skipGuide() },
          next: { text: this.$t('NN0272') }
        },
        {
          target: '.nav-container .nav-item:nth-child(4)',
          placement: 'right-end',
          title: this.$t('NN0265'),
          content: this.$t('NN0266'),
          skip: { text: this.$t('NN0271'), action: () => guideUtils.skipGuide() },
          next: { text: this.$t('NN0272') }
        },
        {
          target: '.nav-container .nav-item:last-child',
          placement: 'right-end',
          title: this.$t('NN0267'),
          content: this.$t('NN0268'),
          skip: { text: this.$t('NN0271'), action: () => guideUtils.skipGuide() },
          next: { text: this.$t('NN0272') }
        },
        {
          target: '.btn-download',
          placement: 'bottom-end',
          title: this.$t('NN0269'),
          offset: { y: 15 },
          content: this.$t('NN0270'),
          finish: {
            text: this.$t('NN0273'), action: () => guideUtils.finishGuide()
          }
        }
      ]
    }
  },
  computed: {
    stepInfo (): { [key: string]: any } {
      return this.steps[this.currentStep]
    }
  },
  mounted () {
    this.handleTargetPosition()
  },
  watch: {
    currentStep () {
      this.handleTargetPosition()
    }
  },
  methods: {
    handleTargetPosition () {
      const { stepInfo } = this
      const targetEl = document.querySelector(stepInfo.target)
      const { x, y, width, height } = targetEl?.getBoundingClientRect() || {}
      this.targetPosition = { x, y, width, height }
      this.$nextTick(() => {
        this.handleTourPosition()
      })
    },
    handleTourPosition () {
      const tourEl = this.$refs.tour as HTMLElement
      const arrowEl = this.$refs.arrow as HTMLElement
      const { placement, offset = {} } = this.stepInfo
      const { x = 0, y = 0, width = 0, height = 0 } = this.targetPosition
      const [direction, align] = placement.split('-')
      let [arrowTop, arrowLeft] = [0, 0]
      let left = x + (offset.x || 0)
      let top = y + (offset.y || 0)
      if (['bottom', 'top'].includes(direction)) {
        align === 'end' && (left -= tourEl.offsetWidth - width)
        !align && (left += (tourEl.offsetWidth - width) / 2)
        direction === 'bottom' ? (top += height) : (top -= tourEl.offsetHeight)
        arrowLeft = x + (width / 2) - (offset.x || 0)
        direction === 'bottom' ? (arrowTop = y + height + (offset.y || 0)) : (arrowTop = y - (offset.y || 0))
      }
      if (['right', 'left'].includes(direction)) {
        align === 'end' && (top -= tourEl.offsetHeight - height)
        !align && (top += (tourEl.offsetHeight - height) / 2)
        direction === 'right' ? (left += width) : (left -= tourEl.offsetWidth)
        arrowTop = y + (height / 2) - (offset.y || 0)
        direction === 'right' ? (arrowLeft = x + width + (offset.x || 0)) : (arrowLeft = x - (offset.x || 0))
      }
      tourEl.style.transform = `translate(${left}px, ${top}px)`
      arrowEl.style.transform = `translate(${arrowLeft}px, ${arrowTop}px)`
      this.$el.classList.remove('active')
      setTimeout(() => { this.$el.classList.add('active') }, 100)
    },
    handleSkip () {
      const { skip } = this.stepInfo
      if (typeof skip.action === 'function') {
        return skip.action()
      }
    },
    handleNextStep () {
      const { next } = this.stepInfo
      if (typeof next.action === 'function') {
        return next.action()
      }
      this.currentStep += 1
    },
    handleFinish () {
      const { finish } = this.stepInfo
      if (typeof finish.action === 'function') {
        return finish.action()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
  .tour-guide {
    position: fixed;
    z-index: 20;
    opacity: 0;
    top: 10px;
    left: 0;
    &.active {
      top: 0;
      opacity: 1;
      transition: top .3s, opacity .3s;
    }
    &__container {
      position: absolute;
      width: 400px;
      padding: 24px 32px;
      font-size: 14px;
      text-align: left;
      border-radius: 12px;
      box-sizing: border-box;
      color: setColor(white);
      background: setColor(blue-1);
      box-shadow: 0px 6px 10px rgba(0, 114, 174, 0.33);
    }
    &__step,
    &__title {
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 5px;
    }
    &__actions {
      display: flex;
      justify-content: end;
    }
    &__arrow {
      position: absolute;
      top: -5px;
      left: -5px;
      z-index: 20;
      &::before {
        content: '';
        width: 10px;
        height: 10px;
        background: setColor(blue-1);
        position: absolute;
        transform: rotate(45deg);
      }
    }
  }
  .btn.skip,
  .btn.finish,
  .btn.next {
    border-radius: 16px;
    padding: 5px 32px;
    margin-left: 16px;
  }
  .btn.skip,
  .btn.finish {
    border: 1px solid setColor(blue-3);
    color: setColor(blue-3);
    &:hover {
      border-color: setColor(white);
      color: setColor(white);
    }
  }
  .btn.next {
    border: 1px solid setColor(blue-4);
    background-color: setColor(blue-4);
    color: setColor(blue-1);
    &:hover {
      color: setColor(blue-4);
    }
  }
</style>
