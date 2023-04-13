<template lang="pug">
div(class="panel-remove-bg")
  div(class="panel-remove-bg__btns")
    btn(class="full-width"
      :type="clearMode ? 'gray-active-sm' :'gray-sm'"
      ref="btn"
      :hasIcon="true"
      :iconName="'clear'"
      :iconMargin="4"
      :flexDir="'column'"
      @click="setClearMode(true)") {{ $t('NN0385') }}
    btn(class="full-width"
      :type="clearMode ? 'gray-sm' :'gray-active-sm'"
      ref="btn"
      :hasIcon="true"
      :iconName="'preserve'"
      :iconMargin="4"
      :flexDir="'column'"
      @click="setClearMode(false)") {{ $t('NN0386') }}
    btn(class="btn-recover full-width"
      type="gray-sm"
      ref="btn"
      :hasIcon="true"
      :iconName="'reset'"
      :iconMargin="4"
      :flexDir="'column'"
      @click="restoreInitState()") {{$t('NN0389')}}
  div(class="panel-remove-bg__slider full")
    mobile-slider(
      :title="`${$t('NN0387')}`"
      :borderTouchArea="true"
      :name="'brushSize'"
      :value="_brushSize"
      :min="minBrushSize"
      :max="maxBrushSize"
      @update="setBrushSize")
  div(class="full flex items-center")
    svg-icon(class="mr-5"
      :iconColor="showInitImage ? 'blue-1' : 'light-gray'"
      :iconName="showInitImage ? 'checkbox-checked' : 'checkbox'"
      :iconWidth="'16px'"
      @click="toggleShowInitImage(showInitImage)")
    span(class="label-mid") {{$t('NN0388')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      minBrushSize: 1,
      maxBrushSize: 300
    }
  },
  components: {
    MobileSlider
  },
  computed: {
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor',
      clearMode: 'bgRemove/getClearMode',
      showInitImage: 'bgRemove/getShowInitImage',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      currSelectedInfo: 'getCurrSelectedInfo',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isAdmin: 'user/isAdmin',
      prevPageScaleRatio: 'bgRemove/getPrevPageScaleRatio',
      bgRemoveIdInfo: 'bgRemove/getIdInfo',
      isProcessing: 'bgRemove/getIsProcessing',
      _brushSize: 'bgRemove/getBrushSize'
    }),
  },
  methods: {
    ...mapMutations({
      setBrushSize: 'bgRemove/SET_brushSize',
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      setClearMode: 'bgRemove/SET_clearMode',
      setShowInitImage: 'bgRemove/SET_showInitImage',
    }),
    toggleShowInitImage(val: boolean): void {
      this.setShowInitImage(!val)
    },
    restoreInitState() {
      this.setRestoreInitState(true)
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-remove-bg {
  position: relative;
  text-align: center;
  &__btns {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
    > button {
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }

  &__slider {
    font-size: 14px;
    font-weight: bold;
    > div:nth-child(2) {
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: 0.75fr 0.25fr;
      column-gap: 25px;
    }
  }
}

</style>
