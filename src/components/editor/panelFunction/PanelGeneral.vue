<template lang="pug">
  div(class="panel-group mb-10")
    div(class="panel-group__group-ctrl")
      btn(class="full-width mr-10 rounded"
        :type="'primary-mid'"
        :disabled="isLocked || (!isGroup && selectedLayerNum <=1)"
        @click.native="isGroup? ShortcutUtils.ungroup(): ShortcutUtils.group()") {{isGroup?'取消群組':'群組'}}
      div(class="border-gray-4 p-5 btn-opacity"  v-hint="'透明度'")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'24px'" :iconColor="'gray-2'"
          @click.native="openSliderPopup()")
    div(class="action-bar flex-between")
      svg-icon(class="layers-alt feature-button p-5"
        :class="{'pointer': !isLocked}"
        iconName="layers-alt" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="openOrderPopup()"
        v-hint="'圖層順序'")
      svg-icon(class="feature-button p-5"
        :class="{'pointer': !isLocked}"
        iconName="copy" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="iconAction('copy')"
        v-hint="'複製'")
      svg-icon(class="pointer feature-button p-5"
        :class="{ active: isLocked }"
        :iconName="isLocked ? 'unlock' : 'lock'" :iconWidth="'20px'" :iconColor="'gray-2'"
        @click.native="iconAction('unlock')"
        v-hint="'鎖定圖層'")
      svg-icon(class="feature-button p-5"
        :class="{'pointer': !isLocked}"
        iconName="trash" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="iconAction('trash')"
        v-hint="'刪除'")
      //- svg-icon(:class="{'pointer': !isLocked}"
      //-   iconName="brush" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
      //-   @click.native=""
      //-   v-hint="'複製樣式'")
    div(class="panel-group__adjust")
      btn(class="btn-align full-width" :type="'gray-mid'"
        @click.native="openAlignPopup") 位置對齊
      btn(class="btn-flip full-width" :type="'gray-mid'" :class="{disabled: isTextEditable}"
        @click.native="openFlipPopup") 翻轉
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import { mapGetters, mapMutations } from 'vuex'
import LayerUtils from '@/utils/layerUtils'
import popupUtils from '@/utils/popupUtils'
import { ILayer } from '@/interfaces/layer'
import { PopupSliderEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  data() {
    return {
      ShortcutUtils,
      GroupUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      popupComponent: 'popup/getPopupComponent'
    }),
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return LayerUtils.getTmpLayer().locked
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    layerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    opacity(): number {
      if (this.layerNum === 1) {
        return this.currSelectedInfo.layers[0].styles.opacity
      }
      return Math.max(...this.currSelectedInfo.layers.map((layer: ILayer) => layer.styles.opacity))
    },
    isTextEditable(): boolean {
      return this.layerNum === 1 && this.currSelectedInfo.layers[0].type === 'text' && this.currSelectedInfo.layers[0].contentEditable
    },
    isFlipDisabled(): boolean {
      return this.isGroup || this.layerNum !== 1 || this.isTextEditable
    }
  },
  mounted() {
    popupUtils.on(PopupSliderEventType.opacity, (value: number) => {
      this.setOpacity(value)
    })
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    iconAction(icon: string) {
      if (this.isLocked && icon !== 'unlock') return
      MappingUtils.mappingIconAction(icon)
    },
    openOrderPopup() {
      popupUtils.openPopup('order')
    },
    openAlignPopup() {
      popupUtils.openPopup('align')
    },
    openFlipPopup() {
      if (this.isLocked) return
      popupUtils.openPopup('flip')
    },
    openSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.opacity)
      popupUtils.setSliderConfig(Object.assign({ value: this.opacity, noText: false }, MappingUtils.mappingMinMax('opacity')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.btn-opacity'
      })
    },
    setOpacity(value: number): void {
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
})
</script>

<style lang="scss" scoped>
.panel-group {
  display: flex;
  flex-direction: column;
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__group-ctrl {
    display: flex;
    justify-content: space-between;
    > div:nth-child(2) {
      @include flexCenter;
      aspect-ratio: 1/1;
    }
  }

  &__adjust {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
}

.btn-flip.disabled {
  color: map-get($colors, gray-3);
  pointer-events: none;
  cursor: not-allowed;
}

.action-bar {
  padding: 10px 15px;
}
</style>
