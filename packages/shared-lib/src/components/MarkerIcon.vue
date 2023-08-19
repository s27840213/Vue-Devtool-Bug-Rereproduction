<template lang="pug">
svg(class="marker-icon"
    :style="iconStyles()")
  g(v-html="svg" :style="styleFormatter")
  line(:x1="x1" y1="5" :x2="iconWidth" y2="5" :stroke="iconColor" strokeWidth="2.5px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  name: 'MarkerIcon',
  props: {
    iconWidth: {
      type: String,
      default: '40px'
    },
    iconColor: {
      type: String,
      required: true
    },
    styleFormat: {
      type: String,
      required: true
    },
    svg: {
      type: String,
      required: true
    },
    trimWidth: {
      type: Boolean,
      required: true
    },
    markerWidth: {
      type: Number,
      required: true
    },
    trimOffset: {
      type: Number,
      required: true
    },
    iconHeight: {
      type: String,
      required: true
    }
  },
  data() {
    return {}
  },
  methods: {
    iconStyles() {
      return {
        width: this.iconWidth,
        height: this.iconHeight ?? this.iconWidth
      }
    }
  },
  computed: {
    x1(): number {
      if (this.trimOffset > 0) {
        return this.trimOffset
      }
      const diff = 1.25
      if (this.trimWidth) {
        return this.markerWidth * 2.5 - diff
      } else if (this.trimWidth === false) {
        return diff
      } else {
        return 0
      }
    },
    styleFormatter(): string {
      let style = this.styleFormat
      style = style.replace(/\$color\[0\]/g, this.iconColor)
      return (
        style +
        `transform: rotate(180deg) translate(-${2.5 * this.markerWidth}px, -10px) scale(2.5);`
      )
    }
  }
})
</script>

<style lang="scss" scoped>
.marker-icon {
  width: 100%;
  &:focus {
    outline: none;
  }
}
</style>
