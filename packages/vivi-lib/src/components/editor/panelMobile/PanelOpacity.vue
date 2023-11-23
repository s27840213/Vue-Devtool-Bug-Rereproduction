<template lang="pug">
div(v-if="!$isCm" class="panel-opacity")
  mobile-slider(:title="`${$t('NN0030')}`"
    :borderTouchArea="true"
    :value="opacity"
    :min="0"
    :max="100"
    @update="updateLayerOpacity")
div(v-else class="panel-opacity text-white")
  //- TODO: Convert inline style to tailwind.
  span(style="width: 26px") {{ opacity }}
  input(class="input__slider--range"
    type="range"
    v-model.number="opacity"
    v-progress)
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  components: {
    MobileSlider
  },
  computed: {
    ...mapGetters({
      inBgSettingMode: 'mobileEditor/getInBgSettingMode'
    }),
    opacity: {
      get() {
        return this.inBgSettingMode ? this.backgroundOpacity : layerUtils.getCurrOpacity
      },
      set(val: number) {
        this.updateLayerOpacity(val)
      }
    },
    backgroundOpacity(): number {
      const { styles: { opacity } } = pageUtils.getPage(pageUtils.currFocusPageIndex).backgroundImage.config
      return opacity
    }
  },
  methods: {
    ...mapMutations({
      setBgOpacity: 'SET_backgroundOpacity'
    }),
    updateLayerOpacity(val: number) {
      this.inBgSettingMode ? this.setBgOpacity({
        pageIndex: pageUtils.currFocusPageIndex,
        opacity: val
      }) : layerUtils.updateLayerOpacity(val)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-opacity {
  padding-top: 3px;
  width: 100%;
  @include cm {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
  };
}
</style>
