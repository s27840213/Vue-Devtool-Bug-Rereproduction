<template lang="pug">
div(class="btn-add" ref="btnAdd" :style="`font-family: ${localeFont()}`")
  span(ref="txtAdd") {{ text }}
  div(class="btn-add__icon" ref="iconAdd")
    svg-icon(iconName="plus-small" iconWidth="24px" iconColor="white")
</template>

<script lang="ts">
import AssetUtils from '@/utils/assetUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

const MAX_BTN_WIDTH = 310

export default defineComponent({
  name: 'btn-add',
  props: {
    elScrollable: {
      type: HTMLElement,
      default: undefined
    },
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      atMainContent: null as AnyTouch | null,
      scrollProgress: -1,
      scrollProgressStart: 0,
      scrollProgressToFinish: 0,
      scrollTopStart: 0,
      scrollTopPrev: 0,
      scrollDirPrev: -1 as -1 | 1, // -1 for scroll up, 1 for scroll down
      destScrollProgress: -1 as -1 | 1, // -1 for expanded button, 1 for minimized button
      btnAniStartTime: null as number | null,
      isPan: false
    }
  },
  created() {
    const unwatchElScrollable = this.$watch('elScrollable', (newVal: HTMLElement) => {
      if (newVal) {
        this.addEventListeners(newVal)
        unwatchElScrollable()
      }
    })
  },
  mounted() {
    // delay button style update to get correct width of text
    window.requestAnimationFrame(() => {
      this.updateBtnStyles()

      // add event listeners after button styles initialized to avoid flickering
      // this.elScrollable will be undefined when component first activated, so no duplicated listeners
      if (this.elScrollable) this.addEventListeners(this.elScrollable)
    })
  },
  activated() {
    // delay button style update to get correct width of text
    window.requestAnimationFrame(() => {
      this.updateBtnStyles()

      // add event listeners after button styles initialized to avoid flickering
      // this.elScrollable will be undefined when component first activated, so no duplicated listeners
      if (this.elScrollable) this.addEventListeners(this.elScrollable)
    })
  },
  deactivated() {
    if (this.atMainContent) {
      this.atMainContent.off('panstart')
      this.atMainContent.off('panup')
      this.atMainContent.off('pandown')
      this.atMainContent.off('panend')
    }
    if (this.elScrollable) this.elScrollable.removeEventListener('scroll', this.handleMainContentScroll)
  },
  watch: {
    scrollOrResize() {
      this.updateBtnStyles()
    },
    isPan(isPan) {
      if (!isPan) this.playBtnAnimation()
    },
    text() {
      window.requestAnimationFrame(() => {
        this.updateBtnStyles()
      })
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    btnMaxWidth() {
      return Math.min(this.windowSize.width - 80, MAX_BTN_WIDTH)
    },
    scrollOrResize() {
      return { scrollProgress: this.scrollProgress, btnMaxWidth: this.btnMaxWidth }
    }
  },
  methods: {
    localeFont() {
      return AssetUtils.getFontMap()[this.$i18n.locale]
    },
    addEventListeners(elScrollable: HTMLElement) {
      this.atMainContent = new AnyTouch(elScrollable, { preventDefault: false })
      this.atMainContent.on('panstart', (e: AnyTouchEvent) => {
        if (this.isPan) return // because this event will trigger when pan direction changes
        this.isPan = true
        this.scrollTopStart = elScrollable.scrollTop
        this.scrollProgressStart = this.destScrollProgress
      })
      this.atMainContent.on(['panup', 'pandown'], (e: AnyTouchEvent) => {
        this.handleMainContentPan()
      })
      this.atMainContent.on('panend', (e: AnyTouchEvent) => {
        this.isPan = false
      })
      elScrollable.addEventListener('scroll', this.handleMainContentScroll, { passive: true })
    },
    handleMainContentScroll() {
      if (!this.elScrollable) return
      const el = this.elScrollable
      const dltScroll = el.scrollTop - this.scrollTopPrev
      const scrollDir = dltScroll > 0 ? 1 : -1

      // ignore scroll bounce
      if (el.scrollTop <= 0 || el.scrollTop >= el.scrollHeight - el.clientHeight) return

      // play animation when scroll direction changes during scroll (touch event won't fire during scroll on iOS)
      if (!this.isPan && scrollDir !== this.scrollDirPrev) {
        this.scrollTopStart = el.scrollTop
        this.scrollProgress = 0
        this.destScrollProgress = scrollDir
        this.btnAniStartTime = null
        this.updateBtnStyles()
        this.playBtnAnimation()
      }

      this.scrollTopPrev = el.scrollTop
      this.scrollDirPrev = scrollDir
    },
    handleMainContentPan() {
      // unlink scroll with animation when animation is playing
      if (this.btnAniStartTime !== null) return

      // define scroll destination for animation
      if (!this.elScrollable) return
      const el = this.elScrollable
      const maxDestScrollTop = (el.scrollHeight - el.clientHeight)
      const destScrollTop = Math.min(el.clientHeight / 2, maxDestScrollTop)

      // displacement from start scroll position
      let dispScroll = el.scrollTop - this.scrollTopStart

      // threshold to trigger animation
      const thScroll = 0
      if (Math.abs(dispScroll) <= thScroll) return
      if (dispScroll > 0) dispScroll -= thScroll
      if (dispScroll < 0) dispScroll += thScroll

      // check for over scroll (scroll down when button is already minimized or scroll up when button is already expanded)
      const newScrollProgress = Math.max(Math.min(dispScroll / destScrollTop, 1), -1)
      if (this.scrollProgressStart === 1 && newScrollProgress > 0) {
        this.scrollProgress = 1
        this.destScrollProgress = 1
        return
      } else if (this.scrollProgressStart === -1 && newScrollProgress < 0) {
        this.scrollProgress = -1
        this.destScrollProgress = -1
        return
      }

      // update scroll progress
      this.scrollProgress = newScrollProgress

      // update destination scroll progress
      if (dispScroll > 0 && this.scrollProgressStart === -1) this.destScrollProgress = 1
      else if (dispScroll < 0 && this.scrollProgressStart === 1) this.destScrollProgress = -1
    },
    updateBtnStyles() {
      this.scrollProgressToFinish = this.destScrollProgress - this.scrollProgress
      const scrollRate = this.destScrollProgress > 0 ? this.scrollProgress : (1 + this.scrollProgress)
      const rScrollRate = 1 - scrollRate
      const btn = this.$refs.btnAdd as HTMLElement
      const txt = this.$refs.txtAdd as HTMLElement
      const icon = this.$refs.iconAdd as HTMLElement
      if (!btn || !txt || !icon) return

      const btnWidth = Math.max(Math.min(this.btnMaxWidth, this.btnMaxWidth * rScrollRate), btn.clientHeight)
      btn.style.maxWidth = btnWidth + 'px'
      txt.style.opacity = (1 - Math.min(scrollRate * 2, 1)).toString()

      const posCenter = btnWidth / 2 - icon.clientWidth / 2
      const iconOffest = txt.clientWidth / 2 + 4
      icon.style.left = posCenter + iconOffest * rScrollRate + 'px'
      icon.style.transform = `rotate(${360 * rScrollRate}deg)`
    },
    btnAnimation(timestamp: number) {
      // cancel animation if already finished
      if (this.scrollProgress === this.destScrollProgress) {
        this.btnAniStartTime = null
        return
      }

      // get relative progress
      if (!this.btnAniStartTime) this.btnAniStartTime = timestamp
      const duration = 500
      const runtime = timestamp - this.btnAniStartTime
      const relativeProgress = Math.max(Math.min(runtime / duration, 1), 0)

      // update scroll progress
      this.scrollProgress += this.scrollProgressToFinish * relativeProgress

      // request next frame if not finished, otherwise reset animation
      if (runtime < duration) {
        this.playBtnAnimation()
      } else this.btnAniStartTime = null
    },
    playBtnAnimation() {
      window.requestAnimationFrame(this.btnAnimation)
    }
  }
})
</script>

<style lang="scss" scoped>
.btn-add {
  position: absolute;
  right: 40px;
  left: 40px;
  bottom: 24px;
  max-width: 310px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 7px 0;
  margin: 0 auto;
  box-sizing: border-box;
  background: rgba(46, 46, 46, 0.8);
  border-radius: 10px;
  overflow: hidden;
  white-space: nowrap;
  box-shadow: 0px 0px 2px 2px rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  &:active {
    background-color: setColor(black-1-5);
  }
  & > span {
    position: relative;
    left: -12px;
    color: white;
  }
  &__icon {
    display: flex;
    position: absolute;
  }
}
</style>
