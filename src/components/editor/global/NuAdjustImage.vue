<template lang="pug">
div(class="nu-adjust-image")
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
  //- component(v-for="(elm, idx) in cssFilterElms"
  //-   :key="`cssFilter${idx}`"
  //-   :is="elm.tag"
  //-   v-bind="elm.attrs")
</template>

<script lang="ts">
import { IImage } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
import ImageAdjustUtil from '@/utils/imageAdjustUtil'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  props: {
    src: {
      type: String,
      required: true
    },
    styles: {
      type: Object,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  computed: {
    ...mapGetters({
    }),
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
    cssFilterElms(): any[] {
      const { styles: { adjust, width, imgX, imgY, height } } = this
      // @s.TODO: only for halation now
      if (Number.isNaN(adjust.halation) || !adjust.halation) {
        return []
      }
      const position = {
        width: width / 2,
        x: Math.abs(imgX) + width / 2,
        y: Math.abs(imgY) + height / 2
      }
      return ImageAdjustUtil.getHalation(adjust.halation, position)
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
        return { width: `${svgImageWidth * this.contentScaleRatio}px` }
      }
      return { height: `${svgImageHeight * this.contentScaleRatio}px` }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-adjust-image {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
