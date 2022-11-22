<template lang="pug">
div(v-if="colorPalettes.length === 0 && !isPalettesLoading" class="hint" :style="minHeightStyles()")
  no-items-hint(type="color" :mobile="true")
div(v-else class="brand-kit-tab-color" :style="minHeightStyles()")
  div(class="brand-kit-tab-color__palettes")
    div(v-if="isPalettesLoading" class="loading")
      svg-icon(iconName="loading"
              iconWidth="24px"
              iconColor="gray-3")
    template(v-else)
      brand-kit-color-palette-sidebar-mobile(v-for="colorPalette in colorPalettes"
                                      :colorPalette="colorPalette"
                                      :settingmode="settingmode")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import BrandKitColorPaletteSidebarMobile from '@/components/brandkit/BrandKitColorPaletteSidebarMobile.vue'
import NoItemsHint from '@/components/brandkit/NoItemsHint.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
    maxheight: {
      default: window.innerHeight * 0.9,
      type: Number
    },
    settingmode: {
      default: false,
      type: Boolean
    }
  },
  components: {
    BrandKitColorPaletteSidebarMobile,
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
    }),
    minHeightStyles() {
      return { minHeight: `${this.maxheight}px` }
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-color {
  height: 100%;
  &__palettes {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    line-height: 0;
    text-align: left;
    box-sizing: border-box;
  }
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
