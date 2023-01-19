<template lang="pug">
div(ref="box"
    class="scrollable-template-preview"
    @mousemove="changeMouseX")
  div(ref="container"
      class="scrollable-template-preview__images"
      :style="scrollStyles()")
    img(v-for="imageUrl in imageUrls"
        :src="imageUrl")
  div(class="scrollable-template-preview__bar"
      :style="barStyles()")
    div(class="scrollable-template-preview__bar-progress"
        :style="progressStyles()")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import templateCenterUtils from '@/utils/templateCenterUtils'
import { IContentTemplate } from '@/interfaces/template'
import mouseUtils from '@/utils/mouseUtils'

const SCROLL_MARGIN_HALF = 5
const SCROLL_MARGIN = SCROLL_MARGIN_HALF * 2

export default defineComponent({
  emits: [],
  props: {
    contentIds: {
      type: Array,
      required: true
    }
  },
  computed: {
    typedContentIds(): IContentTemplate[] {
      return this.contentIds as IContentTemplate[]
    },
    imageUrls(): string[] {
      return this.typedContentIds.map(con => templateCenterUtils.getPrevUrl(con))
    },
    totalHeight(): number {
      return this.typedContentIds.reduce((acc, con) => {
        return acc + con.height
      }, 0)
    },
    effectiveHeight(): number {
      const length = this.typedContentIds.length
      return this.totalHeight - this.typedContentIds[length - 1].height
    }
  },
  data() {
    return {
      mouseX: 0
    }
  },
  methods: {
    scrollStyles() {
      return { transform: `translateY(-${this.scaledHeight() * this.mouseX / 100}px)` }
    },
    barStyles() {
      return {
        width: `${100 - SCROLL_MARGIN}%`,
        left: `${SCROLL_MARGIN_HALF}%`
      }
    },
    progressStyles() {
      return { width: `${this.mouseX}%` }
    },
    scaledHeight(): number {
      const container = this.$refs.container as HTMLElement | undefined
      if (container) {
        const renderedHeight = container.getBoundingClientRect().height
        const scale = renderedHeight / this.totalHeight
        return this.effectiveHeight * scale
      } else {
        return 0
      }
    },
    changeMouseX(e: MouseEvent) {
      const box = this.$refs.box as HTMLElement
      const pos = mouseUtils.getMouseRelPoint(e, box)
      const width = box.getBoundingClientRect().width
      const effectiveWidth = width * (100 - SCROLL_MARGIN) / 100
      const offset = pos.x - (width * SCROLL_MARGIN_HALF) / 100
      const mouseX = offset / effectiveWidth * 100
      this.mouseX = Math.max(Math.min(mouseX, 100), 0)
    }
  }
})
</script>

<style lang="scss" scoped>
.scrollable-template-preview {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  &__images {
    display: flex;
    flex-direction: column;
    width: 100%;
    > img {
      width: 100%;
      height: auto;
    }
  }
  &__bar {
    position: absolute;
    bottom: 10px;
    height: 5px;
    background-color: white;
    border: 1px solid setColor(gray-3);
    border-radius: 5px;
    &-progress {
      height: 100%;
      background-color: setColor(gray-3);
    }
  }
}
</style>
