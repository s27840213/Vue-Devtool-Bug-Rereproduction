<template lang="pug">
div(class="panel-remove-bg")
  div(class="panel-remove-bg__btns")
    div(class="panel-remove-bg__btns__icon"
        :class="{ active: showInitImage }"
        @click="toggleShowInitImage(showInitImage)")
      svg-icon(:iconName="showInitImage ? 'eye-slash' : 'eye'" iconWidth="24px" :iconColor="activeColor")
    slide-toggle(:options="modes"
      v-model="currMode"
      :bgColor="$isStk || $isCm ? 'black-3-5' : 'gray-6'"
      :switchColor="'white'"
      :activeColor="$isStk || $isCm ? 'black-2' : 'blue-1'"
      :inActiveColor="$isStk || $isCm ? 'white' : 'gray-2'"
      :optionWidth="'80px'"
      :optionHeight="'32px'"
      textSize="caption-SM")
    div(class="panel-remove-bg__btns__icon"
        @click="restoreInitState")
      svg-icon(iconName="reset"
              iconWidth="24px" 
              :iconColor="modifiedFlag ? activeColor : disabledColor"
              style="transform: rotate(90deg);")
  transition(name="height")
    div(v-if="currMode !== 'move'" class="panel-remove-bg__slider full")
      div(class="panel-remove-bg__slider__margin")
      mobile-slider(
        :title="`${$t('NN0387')}`"
        :borderTouchArea="true"
        :name="'brushSize'"
        :value="_brushSize"
        :min="minBrushSize"
        :max="maxBrushSize"
        @update="setBrushSize"
        @pointerdown="setIsChangingBrushSize(true)"
        @pointerup="setIsChangingBrushSize(false)")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import { IColorKeys } from '@/interfaces/color'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

enum ControlMode {
  Clear = 'clear',
  Restore = 'restore',
  Move = 'move',
}

export default defineComponent({
  emits: [],
  data() {
    return {
      minBrushSize: 1,
      maxBrushSize: 300,
      modes: [{
        label: this.$t('NN0385'),
        value: ControlMode.Clear as string
      }, {
        label: this.$t('NN0386'),
        value: ControlMode.Restore as string
      }, ...(this.$isStk || this.$isCm ? [{
        label: this.$t('NN0872'),
        value: ControlMode.Move as string
      }] : [])],
      currMode: ControlMode.Clear as string,
      activeColor: (this.$isStk || this.$isCm ? 'white' : 'gray-2') as IColorKeys,
      disabledColor: (this.$isStk || this.$isCm ? 'black-3-5' : 'gray-4') as IColorKeys,
    }
  },
  components: {
    MobileSlider,
    SlideToggle,
  },
  computed: {
    ...mapGetters({
      useMobileEditor: 'getUseMobileEditor',
      clearMode: 'bgRemove/getClearMode',
      movingMode: 'bgRemove/getMovingMode',
      showInitImage: 'bgRemove/getShowInitImage',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      currSelectedInfo: 'getCurrSelectedInfo',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isAdmin: 'user/isAdmin',
      prevPageScaleRatio: 'bgRemove/getPrevPageScaleRatio',
      bgRemoveIdInfo: 'bgRemove/getIdInfo',
      isProcessing: 'bgRemove/getIsProcessing',
      _brushSize: 'bgRemove/getBrushSize',
      steps: 'bgRemove/getSteps'
    }),
  },
  unmounted() {
    this.setMovingMode(false)
    this.updatePinchState({ initPos: { x: -1, y: -1 }, x: 0, y: 0 })
  },
  watch: {
    currMode(newVal) {
      switch(newVal) {
        case ControlMode.Clear:
          this.setClearMode(true)
          break
        case ControlMode.Restore:
          this.setClearMode(false)
          break
        case ControlMode.Move:
          this.setMovingMode(true)
          break
      }
    }
  },
  methods: {
    ...mapMutations({
      setBrushSize: 'bgRemove/SET_brushSize',
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      _setClearMode: 'bgRemove/SET_clearMode',
      setMovingMode: 'bgRemove/SET_movingMode',
      setShowInitImage: 'bgRemove/SET_showInitImage',
      updatePinchState: 'bgRemove/UPDATE_pinchState',
      setIsChangingBrushSize: 'bgRemove/SET_isChangingBrushSize',
    }),
    setClearMode(bool: boolean) {
      this._setClearMode(bool)
      this.setMovingMode(false)
    },
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
    @include pic {
      margin-top: 15px;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    &__icon {
      @include size(32px);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      &.active {
        @include setColors(gray-3, white) using ($color) {
          background-color: rgba($color, 0.2);
        }
      }
    }
  }

  &__slider {
    &__margin {
      @include size(100%, 16px);
    }
  }

  &__original {
    @include setColors(gray-2, white) using ($color) {
      color: $color;
    }
  }
}

.height {
  &-leave-active,
  &-enter-active {
    transition: max-height 0.3s;
  }

  &-leave-from,
  &-enter-to {
    max-height: 67px; // This is a magic number since mobile-slider height is fixed. (51px + margin: 16px)
    // should use automatic way instead in the future (currently no such tech, transition on grid-template-rows is not working)
  }

  &-leave-to,
  &-enter-from {
    max-height: 0;
  }
}

</style>
