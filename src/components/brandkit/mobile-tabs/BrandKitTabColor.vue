<template lang="pug">
div(class="brand-kit-tab-color")
  brand-kit-add-btn(:text="`${$t('NN0404')}`"
                    @click.native="handleCreatePalette")
  transition-group(class="brand-kit-tab-color__palettes" name="list" tag="div")
    template(v-for="colorPalette in renderedColorPalettes")
      div(v-if="colorPalette === 'loading'"
          class="no-trans"
          key="loading")
        svg-icon(iconName="loading"
                iconWidth="50px"
                iconColor="gray-3")
      brand-kit-color-palette(v-else
                              :key="colorPalette.id"
                              :colorPalette="colorPalette"
                              :selectedColor="selectedColor"
                              @selectColor="handleSelectColor"
                              @deleteItem="handleDeleteItem")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import BrandKitColorPalette from '@/components/brandkit/BrandKitColorPalette.vue'
import { IBrand, IBrandColorPalette, IDeletingItem } from '@/interfaces/brandkit'

export default defineComponent({
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
  mounted() {
    brandkitUtils.fetchPalettes(this.fetchPalettes)
  },
  watch: {
    currentBrand() {
      brandkitUtils.fetchPalettes(this.fetchPalettes)
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      isPalettesLoading: 'getIsPalettesLoading'
    }),
    colorPalettes(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
    },
    renderedColorPalettes(): (IBrandColorPalette | string)[] {
      const res = [...this.colorPalettes] as (IBrandColorPalette | string)[]
      if (this.isPalettesLoading) {
        res.push('loading')
      }
      return res
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchPalettes: 'fetchPalettes'
    }),
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
  &__palettes {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.list {
  &-enter-active,
  &-leave-active {
    &:not(.no-trans) {
      transition: 0.3s ease;
      z-index: 10;
    }
  }

  &-enter,
  &-leave-to {
    &:not(.no-trans) {
      transform: translateX(-30%);
      opacity: 0;
    }
  }
}

</style>
