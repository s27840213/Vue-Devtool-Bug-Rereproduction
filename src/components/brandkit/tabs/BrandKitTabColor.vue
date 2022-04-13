<template lang="pug">
  div(class="brand-kit-tab-color")
    brand-kit-add-btn(:text="`${$t('NN0404')}`"
                      @click.native="handleCreatePalette")
    div(v-if="isPalettesLoading")
      svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
    template(v-else)
      brand-kit-color-palette(v-for="colorPalette in colorPalettes"
                              :colorPalette="colorPalette"
                              :selectedColor="selectedColor"
                              @selectColor="handleSelectColor"
                              @deleteItem="handleDeleteItem")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
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
  mounted() {
    brandkitUtils.fetchPalettes(this.fetchPalettes)
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      isPalettesLoading: 'getIsPalettesLoading'
    }),
    colorPalettes(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
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
}
</style>
