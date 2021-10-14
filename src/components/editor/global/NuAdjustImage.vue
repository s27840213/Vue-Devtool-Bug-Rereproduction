<template lang="pug">
  div(class="nu-adjust-image")
    svg(:viewBox="svgViewBox"
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
        :width="svgImageWidth"
        :height="svgImageHeight"
        :filter="imageFilter"
        crossorigin="anonymous")
    component(v-for="(elm, idx) in cssFilterElms"
      :key="`cssFilter${idx}`"
      :is="elm.tag"
      v-bind="elm.attrs")
</template>

<script lang="ts">
import GeneralUtils from '@/utils/generalUtils'
import ImageAdjustUtil from '@/utils/imageAdjustUtil'
import Vue from 'vue'

export default Vue.extend({
  props: {
    src: String,
    styles: Object
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
      const { svgImageWidth, svgImageHeight } = this
      return `0 0 ${svgImageWidth} ${svgImageHeight}`
    },
    svgFilterElms(): any[] {
      const { adjust } = this.styles
      return ImageAdjustUtil.convertAdjustToSvgFilter(adjust)
    },
    cssFilterElms(): any[] {
      const { styles: { adjust }, svgImageWidth, svgImageHeight } = this
      // @TODO: only for halation now
      if (Number.isNaN(adjust.halation) || adjust.halation === 0) {
        return []
      }
      return ImageAdjustUtil.getHalation(adjust.halation, svgImageWidth, svgImageHeight)
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
    }
  }
})
</script>

<style lang="scss" scoped>
  .nu-adjust-image {
    position: relative;
  }
</style>
