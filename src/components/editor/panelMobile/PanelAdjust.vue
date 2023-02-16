<template lang="pug">
div(class="panel-adjust")
  div(v-for="field in fields" :key="field.name")
    mobile-slider(:title="`${field.label}`"
      :borderTouchArea="true"
      :name="field.name"
      :value="adjustVal[field.name] || 0"
      :min="field.min"
      :max="field.max"
      @update="handleField")
  div(class="panel-adjust__reset")
    button(@click="reset") {{ 'Reset' }}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import { IFrame, IImage } from '@/interfaces/layer'
import backgroundUtils from '@/utils/backgroundUtils'
import frameUtils from '@/utils/frameUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    MobileSlider
  },
  data() {
    return {
      fields: imageAdjustUtil.getFields(),
      adjustVal: imageAdjustUtil.getDefaultProps() as { [key: string]: number }
    }
  },
  created() {
    Object.assign(this.adjustVal, imageAdjustUtil.getDefaultProps(), backgroundUtils.inBgSettingMode ? this.backgroundAdjust : this.currLayerAdjust)
  },
  computed: {
    ...mapState('imgControl', {
      imageControlConfig: 'image'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers',
      controllerHidden: 'vivisticker/getControllerHidden'
    }),
    currLayer(): any {
      const layers = this.currSelectedLayers as any[]
      const { index, type } = this.currSubSelectedInfo
      const imageLayers = layers.flatMap(layer => {
        if (layer.type === 'image') return layer
        if (layer.type === 'frame') {
          const frame = layer as IFrame
          return frame.clips[Math.max(0, index)]
        }
        if (layer.type === 'group') {
          if (type === 'image') return layer.layers[index]
          if (type === 'frame') {
            const frameLayer = (layer.layers as IFrame[])[index]
            return frameLayer.active ? frameLayer.clips[0] : null
          }
          // if no subSelectedLayer, it must be a group of all image layers
          if (layer.layers[0].type === 'image') {
            return layer.layers[0]
          }
        }
        return null
      })
      return { ...imageLayers.find(layer => layer) }
    },
    currLayerAdjust(): any {
      return this.currLayer.styles?.adjust ?? {}
    },
    backgroundAdjust(): any {
      const { styles: { adjust } } = pageUtils.currFocusPage.backgroundImage.config
      return adjust
    }
  },
  methods: {
    handleField(val: number | string, name: string) {
      const fieldVal = Number.isNaN(+val) ? 0 : +val
      this.adjustVal[name] = fieldVal
      this.handleAdjust(this.adjustVal)
    },
    reset() {
      const defaultVal = imageAdjustUtil.getDefaultProps()
      this.handleAdjust(defaultVal)
      Object.entries(this.adjustVal)
        .forEach(([k, v]) => {
          this.adjustVal[k] = (defaultVal as any)[k]
        })
    },
    handleAdjust(adjust: any) {
      const { types } = this.currSelectedInfo
      // const { index, type } = this.currSubSelectedInfo
      const { type } = this.currSubSelectedInfo
      const { subLayerIdx: index } = layerUtils
      if (index === -1 && backgroundUtils.inBgSettingMode) {
        backgroundUtils.handleChangeBgAdjust(adjust)
        return
      }
      if (types.has('frame') || (types.has('group') && type === 'frame')) {
        if (types.has('frame')) {
          if (index >= 0 && !this.controllerHidden && (layerUtils.getCurrConfig as IImage).srcObj.type !== 'frame') {
            // case 1: one clip in one frame layer, index = clip index
            return frameUtils.updateFrameLayerStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              index,
              { adjust: { ...adjust } }
            )
          } else {
            // case 2: one frame layer w/o selected clip, index = -1
            return frameUtils.updateFrameLayerAllClipsStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              { adjust: { ...adjust } }
            )
          }
        }
        // case 3: one frame in a group layer, index = frame index in the group
        return frameUtils.updateSubFrameLayerAllClipsStyles(
          pageUtils.currFocusPageIndex,
          this.currSelectedIndex,
          index,
          { adjust: { ...adjust } }
        )
      }
      if (types.has('image') || types.has('group')) {
        // case 4: one image layer, layerIndex = image layer index, subLayerIndex = undefined
        // case 5: multiple image layers, layerIndex = tmp layer index, subLayerIndex = undefined
        // case 6: one image in a group layer, layerIndex = group layer index, subLayerIndex = sublayer index
        // case 7: whole group of images, layerIndex = group layer index, subLayerIndex = undefined
        return imageAdjustUtil.setAdjust({
          adjust: { ...adjust },
          pageIndex: pageUtils.currFocusPageIndex,
          layerIndex: this.currSelectedIndex,
          subLayerIndex: index >= 0 ? index : undefined
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-adjust {
  height: 100%;
  width: 100%;
  overflow: scroll;
  @include no-scrollbar;
  &__reset {
    margin-top: 1.25rem;
    > button {
      color: #4eabe6;
      font-size: 14px;
      padding: 0;
    }
  }
}
.slider-input {
  &__top {
    position: absolute;
  }
}
</style>
