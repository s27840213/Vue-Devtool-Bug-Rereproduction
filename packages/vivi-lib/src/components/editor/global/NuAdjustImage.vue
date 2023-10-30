<template lang="pug">
svg(:viewBox="svgViewBox"
  :width="svgImageWidth"
  :height="svgImageHeight"
  preserveAspectRatio="none"
  role="image")
  defs
    filter(:id="filterId"
      color-interpolation-filters="sRGB")
      component(v-for="(elm, idx) in svgFilterElms"
        :key="`svgFilter${idx}`"
        :is="elm.tag"
        v-bind="elm.attrs")
        component(v-for="child in elm.child"
          :key="child.tag"
          :is="child.tag"
          v-bind="child.attrs")
  image(:xlink:href="src"
    v-bind="style"
    :filter="imageFilter")
</template>

<script lang="ts">
import { IImage } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
import ImageAdjustUtil from '@/utils/imageAdjustUtil'
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    src: {
      type: String,
      required: true
    },
    styles: {
      type: Object,
      required: true
    },
  },
  computed: {
    svgImageWidth(): number {
      const { imgWidth } = this.styles
      return imgWidth
    },
    svgImageHeight(): number {
      const { imgHeight } = this.styles
      return imgHeight
    },
    svgViewBox(): string {
      return `0 0 ${this.svgImageWidth} ${this.svgImageHeight}`
    },
    svgFilterElms(): any[] {
      const { adjust } = this.styles
      return ImageAdjustUtil.convertAdjustToSvgFilter(adjust || {}, { styles: this.styles } as IImage)
    },
    filterId(): string {
      const randomId = GeneralUtils.generateRandomString(5)
      return `filter__${randomId}`
    },
    imageFilter(): string {
      if (this.svgFilterElms.length) {
        return `url(#${this.filterId})`
      }
      return ''
    },
    style(): { [key: string]: string } {
      const { svgImageWidth, svgImageHeight } = this
      if (svgImageWidth >= svgImageHeight) {
        return { width: `${svgImageWidth}px` }
      }
      return { height: `${svgImageHeight}px` }
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
