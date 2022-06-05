<template lang="pug">
  div(class="brand-kit-tab-color")
    div(v-if="isPalettesLoading" class="loading")
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
    if (this.isSettingsOpen) return
    brandkitUtils.fetchPalettes(this.fetchPalettes)
  },
  watch: {
    currentBrand() {
      if (this.isSettingsOpen) return
      brandkitUtils.fetchPalettes(this.fetchPalettes)
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      isPalettesLoading: 'getIsPalettesLoading',
      isSettingsOpen: 'getIsSettingsOpen'
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
  height: 100%;
  line-height: 0;
  text-align: left;
  box-sizing: border-box;
  margin-right: -10px; // Push scrollbar to outside
  padding-right: 10px;
  @media not all and (min-resolution:.001dpcm){ // For safari only
    @supports (-webkit-appearance:none) {
      padding-right: 0;
    }
  }
  @include hide-scrollbar;
}

.loading {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
