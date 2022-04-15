<template lang="pug">
  div(class="brand-kit-tab-color")
    div(v-if="isPalettesLoading")
      svg-icon(iconName="loading"
              iconWidth="24px"
              iconColor="gray-3")
    template(v-else)
      brand-kit-color-palette-sidebar(v-for="colorPalette in colorPalettes"
                                      :colorPalette="colorPalette")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitColorPaletteSidebar from '@/components/brandkit/BrandKitColorPaletteSidebar.vue'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  components: {
    BrandKitColorPaletteSidebar
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
    })
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-color {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
