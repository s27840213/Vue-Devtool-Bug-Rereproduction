<template lang="pug">
div(class="panel-group mb-10")
  div(class="panel-group__group-ctrl")
    btn(class="full-width mr-10 rounded"
      :type="'primary-mid'"
      :disabled="isLocked || (!isGroup && selectedLayerNum <=1)"
      @click="isGroup? ShortcutUtils.ungroup(): ShortcutUtils.group()") {{isGroup? $t('NN0212'):$t('NN0029')}}
    div(class="border-gray-4 p-5 btn-opacity"
      v-hint="$t('NN0030')"
    )
      svg-icon(:class="{'pointer': !isLocked}"
        :iconName="'transparency'" :iconWidth="'24px'" :iconColor="'gray-2'"
        @click="openSliderPopup()")
  div(class="action-bar flex-between")
    svg-icon(class="layers-alt feature-button p-5"
      :class="{'pointer': !isLocked}"
      iconName="layers-alt" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
      @click="openOrderPopup()"
      v-hint="$t('NN0031')"
    )
    svg-icon(class="feature-button p-5"
      :class="{'pointer': !isLocked}"
      iconName="copy" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
      @click="iconAction('copy')"
      v-hint="$t('NN0032')"
    )
    svg-icon(class="pointer feature-button p-5"
      :class="{ active: isLocked }"
      :iconName="isLocked ? 'lock' : 'unlock'" :iconWidth="'20px'" :iconColor="'gray-2'"
      @click="iconAction(isLocked ? 'lock' : 'unlock')"
      v-hint="isLocked ? `${$t('NN0033')}` : `${$t('NN0213')}`"
    )
    svg-icon(class="feature-button p-5"
      :class="{'pointer': !isLocked}"
      iconName="trash" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
      @click="iconAction('trash')"
      v-hint="$t('NN0034')"
    )
    svg-icon(class="feature-button p-5"
      :class="{'pointer': !isCopyFormatDisabled}"
      iconName="brush" :iconWidth="'20px'" :iconColor="isCopyFormatDisabled ? 'gray-4' : 'gray-2'"
      @click="handleCopyFormat"
      v-hint="$t('NN0035')"
    )
  div(class="panel-group__adjust")
    btn(class="btn-align full-width" :type="'gray-mid'" :disabled="isLocked"
      @click="openAlignPopup") {{$tc('NN0044',1)}}
    btn(class="btn-flip full-width" :type="'gray-mid'" :disabled="isLocked || isFlipDisabled"
      @click="openFlipPopup") {{$t('NN0038')}}
</template>

<script lang="ts">
import { IFrame, IGroup } from '@/interfaces/layer'
import { PopupSliderEventType } from '@/store/types'
import formatUtils from '@/utils/formatUtils'
import GroupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import popupUtils from '@/utils/popupUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
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
      return layerUtils.getSelectedLayer().locked
    },
    isCopyFormatDisabled(): boolean {
      if (this.layerNum === 1) { // not tmp
        const types = this.currSelectedInfo.types
        const currLayer = layerUtils.getCurrLayer
        if (types.has('group')) {
          if (this.subActiveLayerIndex !== -1) {
            if (['text', 'image'].includes(this.subActiveLayerType)) {
              return this.isLocked
            }
            if (this.subActiveLayerType === 'frame') {
              const frame = this.subActiveLayer as IFrame
              if (frame.clips.length === 1) {
                return this.isLocked
              }
            }
          }
        } else if (types.has('frame')) {
          const frame = currLayer as IFrame
          if (frame.clips.length === 1) {
            return this.isLocked
          } else {
            if (this.subActiveLayerIndex !== -1 && frame.clips[this.subActiveLayerIndex].type === 'image') {
              return this.isLocked
            }
          }
        } else {
          if (types.has('text') || types.has('image')) {
            return this.isLocked
          }
        }
      }
      return true
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
    subActiveLayerIndex(): number {
      return layerUtils.subLayerIdx
    },
    subActiveLayer(): any {
      if (this.subActiveLayerIndex !== -1) {
        return (layerUtils.getCurrLayer as IGroup).layers[this.subActiveLayerIndex]
      }
      return undefined
    },
    subActiveLayerType(): string {
      const currLayer = layerUtils.getCurrLayer
      if (currLayer.type === 'group' && this.subActiveLayerIndex !== -1) {
        return (currLayer as IGroup).layers[this.subActiveLayerIndex].type
      }
      return ''
    },
    primaryLayerIndex(): number {
      if (layerUtils.getCurrLayer.type === 'group') {
        return layerUtils.layerIndex
      }
      return -1
    },
    opacity(): number {
      return layerUtils.getCurrOpacity
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
  watch: {
    opacity(newVal) {
      popupUtils.setSliderConfig(Object.assign({ value: newVal, noText: false }, MappingUtils.mappingMinMax('opacity')))
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    iconAction(icon: string) {
      if (this.isLocked && icon !== 'lock') return
      MappingUtils.mappingIconAction(icon)
    },
    openOrderPopup() {
      if (this.isLocked) return
      popupUtils.openPopup('order')
    },
    openAlignPopup() {
      if (this.isLocked) return
      popupUtils.openPopup('align')
    },
    openFlipPopup() {
      if (this.isLocked) return
      popupUtils.openPopup('flip')
    },
    openSliderPopup() {
      if (this.isLocked) return
      popupUtils.setCurrEvent(PopupSliderEventType.opacity)
      popupUtils.setSliderConfig(Object.assign({ value: this.opacity, noText: false }, MappingUtils.mappingMinMax('opacity')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.btn-opacity'
      })
    },
    setOpacity(value: number): void {
      layerUtils.updateLayerOpacity(value)
    },
    handleCopyFormat() {
      if (this.isCopyFormatDisabled) return
      const types = this.currSelectedInfo.types
      const layer = this.currSelectedInfo.layers[0]
      if (types.has('group')) {
        const type = this.subActiveLayerType
        const subLayer = this.subActiveLayer
        if (type === 'text') {
          formatUtils.copyTextFormat(subLayer)
        }
        if (type === 'image') {
          formatUtils.copyImageFormat(subLayer)
        }
        if (type === 'frame') {
          formatUtils.copyImageFormat(subLayer.clips[0])
        }
      } else {
        if (types.has('text')) {
          formatUtils.copyTextFormat(layer)
        }
        if (types.has('image')) {
          formatUtils.copyImageFormat(layer)
        }
        if (types.has('frame')) {
          formatUtils.copyImageFormat(layer.clips[Math.max(0, this.subActiveLayerIndex)])
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

.action-bar {
  padding: 10px 15px;
}
</style>
