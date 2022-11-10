<template lang="pug">
  div(class="lazy-load"
      :style="styles"
      ref="observer")
    transition(:name="anamationEnabled && !forceRender ? 'fade-in': ''" mode="out-in")
      slot(v-if="forceRender || shoudBeRendered")
      slot(v-else name="placeholder")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { some } from 'lodash'
import generalUtils from '@/utils/generalUtils'
import { globalQueue } from '@/utils/queueUtils'

export default Vue.extend({
  props: {
    target: {
      type: String,
      default: 'body'
    },
    rootMargin: {
      type: String,
      default: '0px'
    },
    minHeight: {
      default: 0,
      type: Number
    },
    maxHeight: Number,
    minWidth: Number,
    threshold: {
      type: Array as PropType<number[]>,
      default: () => [0, 1]
    },
    handleUnrender: {
      type: Boolean,
      default: true
    },
    unrenderDelay: {
      type: Number,
      default: 2000
    },
    pageIndex: {
      type: Number,
      default: -1
    },
    anamationEnabled: {
      type: Boolean,
      default: true
    },
    forceRender: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      intersectionObserver: null as unknown as IntersectionObserver,
      shoudBeRendered: false,
      unrenderTimer: -1,
      renderTimer: -1,
      unrenderEventId: '',
      renderEventId: '',
      loadedFlag: false
    }
  },
  mounted() {
    const options = {
      root: document.querySelector(this.target),
      rootMargin: this.rootMargin,
      threshold: this.threshold
    }

    if (!this.forceRender) {
      this.intersectionObserver = new IntersectionObserver(
        // If element is created when it is intersecting,
        // there will be two entries in var `entries`.
        // So if any of entry is true, call callback.
        (entries) => {
          if (some(entries, ['isIntersecting', true])) {
            // perhaps the user re-scrolled to a component that was set to unrender. In that case stop the unrendering timer
            if (this.unrenderEventId !== '') {
              globalQueue.deleteEvent(this.unrenderEventId, this.pageIndex)
              // this.consoleLog(`delete unrender eventId: ${this.unrenderEventId}`)
            }
            if (this.unrenderTimer !== -1) {
              clearTimeout(this.unrenderTimer)
              // this.consoleLog('clear unrender timeout')
            }
            /**
             *  if we're dealing underndering lets add a waiting period of 200ms before rendering.
             *  If a component enters the viewport and also leaves it within 200ms it will not render at all.
             *  This saves work and improves performance when user scrolls very fast
             */
            this.renderTimer = setTimeout(
              () => {
                this.renderEventId = generalUtils.generateRandomString(3)
                // this.consoleLog(`push from lazyload: ${this.renderEventId}`)
                globalQueue.push(this.renderEventId, async () => {
                  // this.consoleLog('render succeed')
                  this.shoudBeRendered = true
                  this.handleLoaded(true, entries)
                  this.renderEventId = ''
                }, this.pageIndex)
              },
              this.handleUnrender ? 200 : 0
            )

            // this.consoleLog(`setup render timer: ${this.renderTimer}`)

            // this.renderTimer = setTimeout(
            //   () => {
            //     this.shoudBeRendered = true
            //     this.handleLoaded()
            //   },
            //   this.handleUnrender ? 200 : 0
            // )
            if (!this.handleUnrender) {
              this.intersectionObserver && this.intersectionObserver.disconnect()
            }

            this.handleIntersecting(entries)
          } else {
            if (this.renderEventId !== '') {
              globalQueue.deleteEvent(this.renderEventId, this.pageIndex)
              // this.consoleLog(`delete render eventId: ${this.unrenderEventId}`)
            }
            if (this.renderTimer !== -1) {
              clearTimeout(this.renderTimer)
              // this.consoleLog('clear render timeout')
            }

            this.unrenderTimer = setTimeout(() => {
              this.unrenderEventId = generalUtils.generateRandomString(3)
              // this.consoleLog(`push from lazyload: ${this.unrenderEventId}`)
              globalQueue.push(this.unrenderEventId, async () => {
                // this.consoleLog('unrender succeed')
                this.shoudBeRendered = false
                this.handleLoaded(false, entries)
                this.unrenderEventId = ''
              }, this.pageIndex)
            }, this.unrenderDelay)

            // this.consoleLog(`setup unrender timer: ${this.unrenderTimer}`)

            // this.unrenderTimer = setTimeout(() => {
            //   this.shoudBeRendered = false
            // }, this.unrenderDelay)
          }
        }, options
      )
      this.intersectionObserver.observe(this.$refs.observer as Element)
    }
  },
  computed: {
    styles(): { [index: string]: string } {
      return {
        minHeight: `${this.minHeight}px`,
        ...(this.maxHeight && { maxHeight: `${this.maxHeight}px` }),
        ...(this.minWidth && { minWidth: `${this.minWidth}px` })
      }
    }
  },
  methods: {
    handleLoaded(bool: boolean, entry: Array<IntersectionObserverEntry>) {
      this.$emit('loaded', bool, entry)
    },
    handleIntersecting(entry: Array<IntersectionObserverEntry>) {
      this.$emit('intersecting', entry)
    },
    consoleLog(str: string) {
      // if (this.pageIndex === 3) {
      //   console.log(str)
      // }
    }
  },
  destroyed() {
    this.intersectionObserver && this.intersectionObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.lazy-load {
  text-align: center;
}
</style>
