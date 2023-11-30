<template lang="pug">
div(class="panel-adjust")
  template(v-if="$isCm")
    teleport(to="#header-reset")
      nubtn(
        class="layer-action"
        theme="secondary"
        @click.stop="reset") {{ $t('NN0754') }}
    div(class="panel-adjust__input text-white")
      span(style="width: 26px") {{ adjustVal[selectedField.name] || 0 }}
      input(class="input__slider--range"
        type="range"
        v-model.number="selectedFieldValue"
        :min="selectedField.min"
        :max="selectedField.max"
        v-progress)
      svg-icon(iconName="cm_reset"
              iconColor="app-tab-default"
              iconWidth="24px"
              @click="resetField(selectedField)")
    div(class="grid gap-24 overflow-scroll no-scrollbar"
        :style="fieldsStyle")
      template(v-for="field in fields" :key="field.name")
        div(
          class="flex flex-col items-center justify-center h-52 gap-4 px-4"
          @click="selectedField = field")
          div(class="panel-adjust__modified" :class="`bg-${isFieldModified(field) ? (isFieldSelected(field) ? 'app-tab-active' : 'app-tab-default') : 'transparent'}`")
          svg-icon(
            class="click-disabled"
            :iconName="field.name"
            :iconColor="isFieldSelected(field) ? 'app-tab-active' : 'app-tab-default'"
            :iconWidth="'24px'")
          span(
            class="no-wrap click-disabled transition ease-linear delay-200 typo-body-sm"
            :class="`text-${isFieldSelected(field) ? 'app-tab-active' : 'app-tab-default'}`") {{ field.label }}
  template(v-else)
    div(v-for="field in fields" :key="field.name")
      mobile-slider(:title="`${field.label}`"
        :borderTouchArea="true"
        :name="field.name"
        :value="adjustVal[field.name] || 0"
        :min="field.min"
        :max="field.max"
        @update="handleField")
    nubtn(class="panel-adjust__reset"
            theme="icon_pill"
            icon="reset"
            @click="reset") {{$t('NN0754')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import { IFrame, IImage } from '@/interfaces/layer'
import backgroundUtils from '@/utils/backgroundUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

type Field = ReturnType<(typeof imageAdjustUtil)['getFields']>[number]

export default defineComponent({
  emits: [],
  components: {
    MobileSlider
  },
  data() {
    const fields = imageAdjustUtil.getFields()
    const defaultProps = imageAdjustUtil.getDefaultProps()
    return {
      fields,
      defaultProps,
      adjustVal: generalUtils.deepCopy(defaultProps),
      selectedField: fields[0],
    }
  },
  created() {
    Object.assign(this.adjustVal, this.defaultProps, backgroundUtils.inBgSettingMode ? this.backgroundAdjust : this.currLayerAdjust)
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
      controllerHidden: 'webView/getControllerHidden'
    }),
    fieldsStyle(): {[key: string]: string} {
      return {
        'grid-template-columns': `repeat(${this.fields.length}, minmax(50px, 1fr))`
      }
    },
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
    },
    selectedFieldValue: {
      get() {
        return this.adjustVal[this.selectedField.name] || 0
      },
      set(val: number) {
        this.handleField(val, this.selectedField.name)
      }
    }
  },
  methods: {
    isFieldSelected(field: Field) {
      return this.selectedField.name === field.name
    },
    isFieldModified(field: Field) {
      return (this.adjustVal[field.name] ?? 0) !== this.defaultProps[field.name]
    },
    handleField(val: number | string, name: string) {
      const fieldVal = Number.isNaN(+val) ? 0 : +val
      this.adjustVal[name] = fieldVal
      this.handleAdjust(this.adjustVal)
    },
    reset() {
      this.handleAdjust(this.defaultProps)
      Object.entries(this.adjustVal)
        .forEach(([k, v]) => {
          this.adjustVal[k] = (this.defaultProps as any)[k]
        })
    },
    resetField(field: Field) {
      this.handleField(this.defaultProps[field.name], field.name)
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
  display: grid;
  gap: 10px;
  height: 100%;
  width: 100%;
  overflow: scroll;
  @include no-scrollbar;
  &__reset {
    margin: 6px auto 0;
  }
  &__input {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
  }
  &__modified {
    @include size(4px);
    border-radius: 50%;
  }
}
.slider-input {
  &__top {
    position: absolute;
  }
}
.no-scrollbar {
  @include no-scrollbar;
}
</style>
