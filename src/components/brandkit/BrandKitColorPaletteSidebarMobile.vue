<template lang="pug">
div(class="brand-kit-color-palette")
  div(class="brand-kit-color-palette__header")
    div(class="brand-kit-color-palette__name")
      span(:title="paletteName") {{ paletteName }}
  div(class="brand-kit-color-palette__colors")
    div(v-for="(color, index) in colorPalette.colors"
      class="brand-kit-color-palette__colors__color-wrapper")
      div(class="brand-kit-color-palette__colors__color"
        :style="backgroundColorStyles(color.color)"
        @click="handleSetColor(index)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrandColorPalette } from '@/interfaces/brandkit'

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
    colorPalette: {
      type: Object,
      required: true
    },
    settingmode: {
      default: false,
      type: Boolean
    }
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
    },
    handleSetColor(index: number) {
      if (!this.settingmode) return
      console.log('change color for', `${this.colorPalette.id}::${index}`)
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
      @include body-SM;
      line-height: 24px;
      height: 24px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  &__colors {
    margin-top: 17px;
    padding: 0 20.5px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
    gap: 12px;
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
