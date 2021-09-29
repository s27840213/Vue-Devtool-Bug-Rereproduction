<template lang="pug">
  div(class="popup-slider")
    input(class="popup-slider__range-input"
      v-model="opacity"
      :max="100"
      :min="0"
      v-ratio-change
      type="range")
    input(class="popup-slider__text body-2 text-gray-2 record-selection"
      ref="input-opacity"
      type="text"
      v-model="opacity")
</template>

<script lang="ts">
import { ILayer } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      popupComponent: 'popup/getPopupComponent'
    }),
    layerNum() {
      return this.currSelectedInfo.layers.length
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    opacity: {
      get: function (): number {
        if (this.layerNum === 1) {
          return this.currSelectedInfo.layers[0].styles.opacity
        }
        return Math.max(...this.currSelectedInfo.layers.map((layer: ILayer) => layer.styles.opacity))
      },
      set(value: number): void {
        console.log(this.currSelectedInfo)
        if (value > 100) {
          value = 100
        }
        if (!this.isGroup) {
          if (this.currSelectedInfo.layers.length === 1) {
            this.$store.commit('UPDATE_layerStyles', {
              pageIndex: this.currSelectedInfo.pageIndex,
              layerIndex: this.currSelectedInfo.index,
              styles: {
                opacity: value
              }
            })
          } else {
            this.$store.commit('UPDATE_selectedLayersStyles', {
              styles: {
                opacity: value
              }
            })
          }
        } else {
          if (this.hasSubSelectedLayer) {
            this.$store.commit('SET_subLayerStyles', {
              pageIndex: this.currSelectedInfo.pageIndex,
              primaryLayerIndex: this.currSelectedInfo.index,
              subLayerIndex: this.currSubSelectedInfo.index,
              styles: {
                opacity: value
              }
            })
          } else {
            this.$store.commit('UPDATE_groupLayerStyles', {
              styles: {
                opacity: value
              }
            })
          }
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-slider {
  width: 150px;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 2.5fr 1fr;
  column-gap: 10px;
  padding: 0.375rem 0.625rem;

  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-3);
    border-radius: 0.25rem;
  }

  &__range-input {
    display: block;
    margin: auto;
    appearance: none;
    outline: none;
    background: none;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3c64b1;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
  }
}
</style>
