<template lang="pug">
  div(class="brand-kit-tab-color")
    brand-kit-add-btn(:text="`${$t('NN0404')}`"
                      @click.native="handleCreatePalette")
    div(v-for="colorPalette in colorPalettes" class="brand-kit-tab-color__palette")
      div(class="brand-kit-tab-color__palette__header")
        div(class="brand-kit-tab-color__palette__name")
          span {{ getDisplayedPaletteName(colorPalette) }}
        div(class="brand-kit-tab-color__palette__right")
          div(class="brand-kit-tab-color__palette__trash pointer"
              @click="handleDeletePalette(colorPalette)")
            svg-icon(iconName="trash" iconWidth="16px" iconColor="gray-2")
          div(class="brand-kit-tab-color__palette__add pointer"
              @click="handleAddColor(colorPalette.id)")
            svg-icon(iconName="plus-small" iconWidth="16px" iconColor="gray-2")
      div(class="brand-kit-tab-color__palette__colors")
        div(v-for="(color, index) in colorPalette.colors"
          class="brand-kit-tab-color__palette__colors__color-wrapper relative"
          :class="{ selected: checkSelected(colorPalette.id, color) }")
          div(class="brand-kit-tab-color__palette__colors__color pointer"
            :style="backgroundColorStyles(color.color)"
            @click="handleSelectColor(colorPalette.id, color)")
          div(class="brand-kit-tab-color__palette__colors__color-close pointer"
            :class="{ selected: checkSelected(colorPalette.id, color) }"
            @click.stop="handleDeleteColor(colorPalette.id, color)")
            svg-icon(iconName="close" iconWidth="16px" iconColor="gray-2")
          color-picker(v-if="checkSelected(colorPalette.id, color)"
                      class="color-picker"
                      v-click-outside="handleDeSelectColor"
                      :currentColor="color.color"
                      @update="handleDragUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import vClickOutside from 'v-click-outside'
import { IBrand, IBrandColor, IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
      selectedColor: {
        paletteId: '',
        colorId: ''
      }
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    BrandKitAddBtn,
    ColorPicker
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    colorPalettes(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
    }
  },
  methods: {
    backgroundColorStyles(color: string) {
      return { backgroundColor: color }
    },
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return colorPalette.name === '' ? `${this.$t('NN0405')}` : colorPalette.name
    },
    checkSelected(paletteId: string, color: IBrandColor): boolean {
      return this.selectedColor.paletteId === paletteId && this.selectedColor.colorId === color.id
    },
    handleCreatePalette() {
      brandkitUtils.createPalette().then(id => {
        this.$nextTick(() => {
          const colorPalette = brandkitUtils.getColorPalette(this.colorPalettes, id)
          if (!colorPalette) return
          this.selectedColor = {
            paletteId: id,
            colorId: colorPalette.colors[0].id
          }
        })
      })
    },
    handleDeletePalette(palette: IBrandColorPalette) {
      brandkitUtils.removePalette(palette)
    },
    handleSelectColor(paletteId: string, color: IBrandColor) {
      if (this.checkSelected(paletteId, color)) {
        this.handleDeSelectColor()
      } else {
        this.selectedColor = {
          paletteId,
          colorId: color.id
        }
      }
    },
    handleDeSelectColor() {
      this.selectedColor = {
        paletteId: '',
        colorId: ''
      }
    },
    handleDeleteColor(paletteId: string, color: IBrandColor) {
      this.handleDeSelectColor()
      brandkitUtils.removeColor(paletteId, color)
    },
    handleDragUpdate(color: string) {
      brandkitUtils.updateColor(this.selectedColor.paletteId, this.selectedColor.colorId, color)
    },
    handleAddColor(id: string) {
      brandkitUtils.createColor(id)
      this.$nextTick(() => {
        const colorPalette = brandkitUtils.getColorPalette(this.colorPalettes, id)
        if (!colorPalette) return
        this.selectedColor = {
          paletteId: id,
          colorId: colorPalette.colors[colorPalette.colors.length - 1].id
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-color {
  display: flex;
  flex-direction: column;
  gap: 20px;
  &__palette {
    border: 1px solid setColor(gray-3);
    box-sizing: border-box;
    border-radius: 4px;
    padding: 10px;
    &__header {
      display: flex;
      justify-content: space-between;
    }
    &__name {
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      & > span {
        @include body-MD;
        line-height: 24px;
        height: 24px;
        display: block;
        color: setColor(gray-1);
      }
    }
    &__right {
      margin-right: 4px;
      display: flex;
      gap: 10px;
    }
    &__colors {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
      gap: 20px 10px;
      &__color-wrapper {
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        border-radius: 10%;
        &:hover {
          border-color: white;
          & > .brand-kit-tab-color__palette__colors__color-close {
            display: flex;
          }
        }
        &.selected {
          border: 1px solid setColor(blue-1);
        }
      }
      &__color {
        width: 100%;
        height: 100%;
        border: 2px solid setColor(gray-7);
        box-sizing: border-box;
        border-radius: 10%;
        &-close {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: white;
          box-shadow: 0px 0px 4px rgba(60, 60, 60, 0.2);
          display: none;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          transform-origin: top right;
          &.selected {
            display: flex;
            transform: scale(0.75);
          }
        }
      }
    }
  }
}

.color-picker {
  position: absolute;
  left: 0;
  top: calc(100% + 5px);
  z-index: 10;
}
</style>
