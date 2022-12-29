<template lang="pug">
  div(class="brand-kit-color-palette")
    div(class="brand-kit-color-palette__header")
      div(class="brand-kit-color-palette__name")
        span(:title="paletteName") {{ paletteName }}
    div(class="brand-kit-color-palette__colors")
      color-btn(v-for="color in colorPalette.colors" :color="color.color"
                :style="backgroundColorStyles"
                @click="handleSetColor(color.color)")
</template>

<script lang="ts">
import Vue from 'vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  components: {
    ColorBtn
  },
  data() {
    return {
    }
  },
  props: {
    colorPalette: Object,
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
    handleSetColor(color: number) {
      if (!this.settingmode) return
      console.log('change color for', `${this.colorPalette.id}::${color}`)
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
  }
}
</style>
