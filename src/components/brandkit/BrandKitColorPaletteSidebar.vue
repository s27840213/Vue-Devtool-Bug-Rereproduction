<template lang="pug">
  div(class="brand-kit-color-palette")
    div(class="brand-kit-color-palette__header")
      div(class="brand-kit-color-palette__name")
        span {{ paletteName }}
    div(class="brand-kit-color-palette__colors")
      div(v-for="(color, index) in colorPalette.colors"
        class="brand-kit-color-palette__colors__color-wrapper")
        div(class="brand-kit-color-palette__colors__color pointer"
          :style="backgroundColorStyles(color.color)")
</template>

<script lang="ts">
import Vue from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    colorPalette: Object
  },
  computed: {
    paletteName(): string {
      return this.getDisplayedPaletteName(this.colorPalette)
    }
  },
  methods: {
    backgroundColorStyles(color: string) {
      return { backgroundColor: color }
    },
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return brandkitUtils.getDisplayedPaletteName(colorPalette)
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-color-palette {
  &__name {
    display: flex;
    align-items: center;
    justify-content: start;
    color: white;
    & > span {
      @include body-MD;
      line-height: 24px;
      height: 24px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  &__colors {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
    gap: 7px 8px;
    &__color-wrapper {
      position: relative;
      width: 100%;
      padding-top: 100%;
      box-sizing: border-box;
      border-radius: 10%;
    }
    &__color {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border-radius: 10%;
    }
  }
}
</style>
