<template lang="pug">
  div(v-if="colorPalettes.length === 0 && !isPalettesLoading" class="hint")
    no-items-hint(type="color")
  div(v-else class="brand-kit-tab-color")
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
import BrandKitColorPaletteSidebar from '@/components/brandkit/BrandKitColorPaletteSidebar.vue'
import NoItemsHint from '@/components/brandkit/NoItemsHint.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  components: {
    BrandKitColorPaletteSidebar,
    NoItemsHint
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
  @include push-scrollbar10;
  @include hover-scrollbar(setColor(sidebar-panel));
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  line-height: 0;
  text-align: left;
  box-sizing: border-box;
}

.loading {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hint {
  display: flex;
  justify-content: center;
}
</style>
