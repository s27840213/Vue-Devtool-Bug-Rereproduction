<template lang="pug">
  div(class="brand-kit-tab-color")
    brand-kit-add-btn(:text="`${$t('NN0404')}`"
                      @click.native="handleCreatePalette")
    template(v-for="colorPalette in colorPalettes" class="brand-kit-tab-color__palette")
      brand-kit-color-palette(:colorPalette="colorPalette"
                              :selectedColor="selectedColor"
                              @selectColor="handleSelectColor"
                              @deleteItem="handleDeleteItem")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import BrandKitColorPalette from '@/components/brandkit/BrandKitColorPalette.vue'
import { IBrand, IBrandColorPalette, IDeletingItem } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
      selectedColor: {
        paletteId: '',
        colorId: ''
      }
    }
  },
  components: {
    BrandKitAddBtn,
    BrandKitColorPalette
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
    handleDeleteItem(item: IDeletingItem) {
      this.$emit('deleteItem', item)
    },
    handleSelectColor(selectedColor: { paletteId: string, colorId: string }) {
      this.selectedColor = selectedColor
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
      &__color-add {
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        border-radius: 10%;
        border: 1px solid setColor(gray-3);
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background-color: setColor(blue-4);
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
