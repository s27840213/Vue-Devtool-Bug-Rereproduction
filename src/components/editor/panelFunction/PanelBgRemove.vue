<template lang="pug">
div(class="panel-background-remove")
  div(class="panel-background-remove__grid mb-5")
    btn( class="full-width"
      :type="clearMode ? 'gray-active-mid' :'gray-mid'"
      ref="btn"
      :hasIcon="true"
      :iconName="'clear'"
      :iconMargin="8"
      @click="setClearMode(true)") {{ $t('NN0385') }}
    btn(class="full-width"
      :type="clearMode ? 'gray-mid' :'gray-active-mid'"
      ref="btn"
      :hasIcon="true"
      :iconName="'preserve'"
      :iconMargin="8"
      @click="setClearMode(false)") {{ $t('NN0386') }}
    div(class="panel-background-remove__slider full")
      div(class="text-left")
        span(class="label-mid") {{ $t('NN0387') }}
      div(class="flex")
        input(class="input__slider--range"
          v-model.number="brushSize"
          :max="maxBrushSize"
          :min="minBrushSize"
          type="range")
        input(class="input__slider--text body-2 text-gray-2"
          type="number"
          v-model.number="brushSize")
    div(class="full flex items-center")
      svg-icon(class="mr-5"
        :iconColor="showInitImage ? 'blue-1' : 'light-gray'"
        :iconName="showInitImage ? 'checkbox-checked' : 'checkbox'"
        :iconWidth="'16px'"
        @click="toggleShowInitImage(showInitImage)")
      span(class="label-mid") {{$t('NN0388')}}
    btn(class="btn-recover full-width"
      type="gray-mid"
      ref="btn"
      @click="restoreInitState()") {{$t('NN0389')}}
    btn( class="full-width"
      type="gray-mid"
      ref="btn"
      @click="cancel()") {{ $t('NN0203') }}
    btn( class="full-width"
      type="primary-mid"
      ref="btn"
      @click="save()") {{ $tc('NN0133',1) }}
</template>

<script lang="ts">
import store from '@/store'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
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
  computed: {
    ...mapGetters({
      clearMode: 'bgRemove/getClearMode',
      showInitImage: 'bgRemove/getShowInitImage',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      currSelectedInfo: 'getCurrSelectedInfo',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isAdmin: 'user/isAdmin',
      prevPageScaleRatio: 'bgRemove/getPrevPageScaleRatio',
      bgRemoveIdInfo: 'bgRemove/getIdInfo',
      isProcessing: 'bgRemove/getIsProcessing'
    }),
    brushSize: {
      get: () => {
        return store.getters['bgRemove/getBrushSize']
      },
      set(val: number): void {
        this.setBrushSize(val)
      }
    }
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
    save() {
      bgRemoveUtils.save()
    },
    cancel() {
      bgRemoveUtils.cancel()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-background-remove {
  position: relative;
  text-align: center;
  &__grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
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

.full {
  grid-column: 1 / 3;
}

.btn-recover {
  grid-column: 1 / 3;
}
</style>
