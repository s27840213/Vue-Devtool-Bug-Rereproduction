<template lang="pug">
  div(class="lazy-load"
      :style="styles"
      ref="observer")
    transition(name="fade-in")
      slot(v-if="shoudBeRendered")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { some } from 'lodash'
import generalUtils from '@/utils/generalUtils'
import queueUtils from '@/utils/queueUtils'

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
    }
  },
  data() {
    return {
      intersectionObserver: null as unknown as IntersectionObserver,
      shoudBeRendered: false,
      unrenderTimer: -1,
      renderTimer: -1,
      unrenderEventId: '',
      renderEventId: ''
    }
  },
  mounted() {
    const options = {
      root: document.querySelector(this.target),
      rootMargin: this.rootMargin,
      threshold: this.threshold
    }
    this.intersectionObserver = new IntersectionObserver(
      // If element is created when it is intersecting,
      // there will be two entries in var `entries`.
      // So if any of entry is true, call callback.
      (entries) => {
        if (some(entries, ['isIntersecting', true])) {
          // perhaps the user re-scrolled to a component that was set to unrender. In that case stop the unrendering timer
          queueUtils.deleteEvent(this.unrenderEventId)
          clearTimeout(this.unrenderTimer)

          /**
           *  if we're dealing underndering lets add a waiting period of 200ms before rendering.
           *  If a component enters the viewport and also leaves it within 200ms it will not render at all.
           *  This saves work and improves performance when user scrolls very fast
           */
          this.renderTimer = setTimeout(
            () => {
              this.renderEventId = generalUtils.generateRandomString(3)
              queueUtils.push(this.renderEventId, async () => {
                this.shoudBeRendered = true
                this.handleLoaded()
              })
            },
            this.handleUnrender ? 150 : 0
          )

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
        } else {
          queueUtils.deleteEvent(this.renderEventId)
          clearTimeout(this.renderTimer)

          this.unrenderTimer = setTimeout(() => {
            this.unrenderEventId = generalUtils.generateRandomString(3)
            queueUtils.push(this.unrenderEventId, async () => {
              this.shoudBeRendered = false
            })
          }, this.unrenderDelay)

          // this.unrenderTimer = setTimeout(() => {
          //   this.shoudBeRendered = false
          // }, this.unrenderDelay)
        }
      }, options
    )
    this.intersectionObserver.observe(this.$refs.observer as Element)
  },
  computed: {
    styles(): { [index: string]: string } {
      return {
        minHeight: `${this.minHeight}px`,
        ...(this.maxHeight && { maxHeight: `${this.maxHeight}px` })
      }
    }
  },
  methods: {
    handleLoaded() {
      this.$emit('loaded')
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
