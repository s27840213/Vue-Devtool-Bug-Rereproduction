<template lang="pug">
div(class="panel-object-adjust")
  template(v-if="isLine")
    div(class="panel-object-adjust__options")
      div(v-for="(option,index) in lineOptions"
          :key="option"
          class="panel-object-adjust__option"
          :class="currMode === index ? bgActiveColor : bgInactiveColor")
        svg-icon(
          :iconName="option"
          iconWidth="24px"
          :iconColor="currMode === index ? iconActiveColor : iconInactiveColor"
          @pointerdown="switchMode(index)")
    div(v-if="currMode !== -1" class="panel-object-adjust__settings mt-25")
      mobile-slider(v-if="currMode === 0" :title="`${$t('NN0681')}`"
        :borderTouchArea="true"
        :name="`${$t('NN0681')}`"
        :value="lineWidth"
        :min="lineWidthMin"
        :max="lineWidthMax"
        @update="setLineWidth")
      div(v-if="currMode === 1" class="panel-object-adjust__line-dash")
        div(class="panel-object-adjust__line-dash__option"
            :class="isNormalDash ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleLineDash(0)")
          svg-icon(iconName="no-dash" iconWidth="25px" iconHeight="20px"
                    :iconColor="isNormalDash ? iconActiveColor : iconInactiveColor")
        div(class="panel-object-adjust__line-dash__option"
            :class="!isNormalDash ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleLineDash(1)")
          svg-icon(iconName="dash-1" iconWidth="25px" iconHeight="20px"
                    :iconColor="!isNormalDash ? iconActiveColor : iconInactiveColor")
        div(class="vr")
        div(class="panel-object-adjust__line-dash__option"
            :class="isLineCapButt ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleLineEdge(0)")
          svg-icon(class="mr-5" iconName="panel-butt" iconWidth="12px" iconHeight="10px"
                    :iconColor="isLineCapButt ? iconActiveColor : iconInactiveColor")
          div(:class="`text-${isLineCapButt ? iconActiveColor : iconInactiveColor}`") {{$t('NN0084')}}
        div(class="panel-object-adjust__line-dash__option"
            :class="!isLineCapButt ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleLineEdge(1)")
          svg-icon(class="mr-5" iconName="panel-round" iconWidth="12px" iconHeight="10px"
                    :iconColor="!isLineCapButt ? iconActiveColor : iconInactiveColor")
          div(:class="`text-${!isLineCapButt ? iconActiveColor : iconInactiveColor}`") {{$t('NN0085')}}
      div(v-if="currMode === 2" class="panel-object-adjust__markers")
          template(v-for="markerslot in makeSlots" :key="markerslot.marker")
            div(class="panel-object-adjust__option"
                :class="startMarker === markerslot.marker ? markerActiveClass : markerInactiveClass"
                @pointerup="handleStartMarkerUpdate(markerslot.marker)")
              marker-icon(iconWidth="18px" :iconColor="startMarker === markerslot.marker ? markerActiveColor : markerInactiveColor" iconHeight="12px"
                :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
                :svg="markerContentMap[markerslot.marker].svg"
                :trimWidth="!!markerContentMap[markerslot.marker].trimWidth"
                :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
                :trimOffset="markerContentMap[markerslot.marker].trimOffset")
      div(v-if="currMode === 3" class="panel-object-adjust__markers")
        template(v-for="markerslot in makeSlots" :key="markerslot.marker")
          div(class="panel-object-adjust__option"
              :class="endMarker === markerslot.marker ? markerActiveClass : markerInactiveClass"
              @pointerup="handleEndMarkerUpdate(markerslot.marker)")
            marker-icon(iconWidth="18px" :iconColor="endMarker === markerslot.marker ? markerActiveColor : markerInactiveColor" iconHeight="12px"
              :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
              :svg="markerContentMap[markerslot.marker].svg"
              :trimWidth="!!markerContentMap[markerslot.marker].trimWidth"
              :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
              :trimOffset="markerContentMap[markerslot.marker].trimOffset"
              style="transform: rotate(180deg)")
  template(v-if="isBasicShape")
    div(class="panel-object-adjust__options")
      div(v-for="(option,index) in ['line-width', 'non-filled']"
          :key="option"
          class="panel-object-adjust__option"
          :class="currMode === index ? bgActiveColor : bgInactiveColor"
          @pointerdown="switchMode(index)")
        svg-icon(
          :iconName="option"
          iconWidth="24px"
          :iconColor="currMode === index ? iconActiveColor : iconInactiveColor")
      div(class="panel-object-adjust__option panel-object-adjust__option--with-val"
          :class="corRadDisabled ? `${bgDisabledColor} text-${iconDisabledColor} click-disabled` : currMode === 2 ? `${bgActiveColor} text-${iconActiveColor}` : `${bgInactiveColor} text-${iconInactiveColor}`"
          @pointerdown="switchMode(2)")
        svg-icon(
          iconName="panel-rounded-corner"
          iconWidth="24px"
          :iconColor="corRadDisabled ? iconDisabledColor : currMode === 2 ? iconActiveColor : iconInactiveColor")
        span {{$t('NN0086')}}
        span {{corRadPercentage}}
    div(v-if="currMode !== -1" class="panel-object-adjust__settings mt-25")
      mobile-slider(v-if="currMode === 0" :title="`${$t('NN0681')}`"
        :borderTouchArea="true"
        :name="`${$t('NN0681')}`"
        :value="lineWidth"
        :min="lineWidthMin"
        :max="lineWidthMax"
        @update="setLineWidth")
      div(v-if="currMode === 1" class="panel-object-adjust__fill")
        div(class="panel-object-adjust__fill__option"
            :class="!filled ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleBasicShapeFilledUpdate(false)")
          svg-icon(iconName="non-filled" iconWidth="25px" iconHeight="20px"
                    :iconColor="!filled ? iconActiveColor : iconInactiveColor")
          div(class="ml-25" :class="`text-${!filled ? iconActiveColor : iconInactiveColor}`") {{$t('NN0088')}}
        div(class="panel-object-adjust__fill__option"
            :class="filled ? optionActiveClass : optionInactiveClass"
            @pointerdown="handleBasicShapeFilledUpdate(true)")
          svg-icon(iconName="filled" iconWidth="25px" iconHeight="20px"
                    :iconColor="filled ? iconActiveColor : iconInactiveColor")
          div(class="ml-25" :class="`text-${filled ? iconActiveColor : iconInactiveColor}`") {{$t('NN0087')}}
      mobile-slider(v-if="currMode === 2" :title="`${$t('NN0085')}`"
        :borderTouchArea="true"
        :name="`${$t('NN0085')}`"
        :value="corRadPercentage"
        @update="handleBasicShapeCorRadPercentUpdate")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import MarkerIcon from '@/components/global/MarkerIcon.vue'
import { IListServiceContentData } from '@/interfaces/api'
import { AllLayerTypes, IShape } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { IMarker } from '@/interfaces/shape'
import assetUtils from '@/utils/assetUtils'
import controlUtils from '@/utils/controlUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import pageUtils from '@/utils/pageUtils'
import shapeUtils from '@/utils/shapeUtils'
import stepsUtils from '@/utils/stepsUtils'
import { PropType, defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

interface IThemeStyles {
  bgActiveColor: string
  bgInactiveColor: string
  bgDisabledColor: string
  optionActiveClass: string
  optionInactiveClass: string
  markerActiveClass: string
  markerInactiveClass: string
  iconActiveColor: string
  iconInactiveColor: string
  iconDisabledColor: string
  markerActiveColor: string
  markerInactiveColor: string
}

export default defineComponent({
  emits: [],
  components: {
    MobileSlider,
    MarkerIcon
  },
  data() {
    const { min: lineWidthMin, max: lineWidthMax } = mappingUtils.mappingMinMax('lineWidth')
    const themeStyles: IThemeStyles = this.$isStk ? {
      bgActiveColor: 'bg-black-6',
      bgInactiveColor: 'bg-black-3',
      bgDisabledColor: 'bg-black-3',
      optionActiveClass: 'bg-black-6',
      optionInactiveClass: 'bg-black-3',
      markerActiveClass: 'bg-black-6',
      markerInactiveClass: 'bg-black-3',
      iconActiveColor: 'black-2',
      iconInactiveColor: 'white',
      iconDisabledColor: 'black-3-5',
      markerActiveColor: '#1F1F1F',
      markerInactiveColor: 'white',
    } : {
      bgActiveColor: 'bg-blue-1',
      bgInactiveColor: 'bg-gray-5',
      bgDisabledColor: 'bg-gray-6',
      optionActiveClass: 'bg-blue-1',
      optionInactiveClass: 'bg-gray-5',
      markerActiveClass: 'bg-blue-1',
      markerInactiveClass: 'bg-gray-5',
      iconActiveColor: 'white',
      iconInactiveColor: 'gray-2',
      iconDisabledColor: 'gray-4',
      markerActiveColor: 'white',
      markerInactiveColor: '#474A57',
    }
    return {
      currMode: -1,
      lineOptions: ['line-width', 'line-dash', 'start-marker', 'end-marker'],
      markerListReady: false,
      markerIds: ['none'],
      dashAndEdge: [1, 3],
      markerContentMap: ({
        none: {
          styleArray: [''],
          svg: '',
          trimWidth: undefined,
          vSize: [0, 4],
          trimOffset: -1
        }
      } as { [key: string]: IMarker }),
      lineWidthMin,
      lineWidthMax,
      ...themeStyles
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  mounted() {
    const currLayer = this.currLayer as IShape
    this.fetchMarkers().then(async () => {
      const markerList = (this.categories[0] as IListServiceContentData).list
      this.markerIds = ['none', ...markerList.map(marker => (marker.id))]
      for (const marker of markerList) {
        const markerContent = (await assetUtils.get(marker)).jsonData as IMarker
        this.markerContentMap[marker.id] = {
          styleArray: markerContent.styleArray,
          svg: markerContent.svg,
          trimWidth: markerContent.trimWidth,
          vSize: markerContent.vSize,
          trimOffset: markerContent.trimOffset ?? -1
        }
      }
      this.markerListReady = true
    })

    this.dashAndEdge[0] = (currLayer.dasharray ?? []).length === 0 ? 1 : 2
    this.dashAndEdge[1] = (currLayer.linecap ?? 'butt') === 'butt' ? 3 : 4
  },
  computed: {
    ...mapGetters({
      currSelectedIndex: 'getCurrSelectedIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      token: 'user/getToken'
    }),
    ...mapState(
      'markers',
      [
        'categories'
      ]
    ),
    lineWidth(): number {
      const { currLayer } = this
      return (currLayer as IShape).size?.[0] ?? 0
    },
    filled(): boolean {
      const { currLayer } = this
      return (currLayer as IShape).filled ?? false
    },
    corRadPercentage(): number {
      const { currLayer } = this
      const { vSize, shapeType, size } = (currLayer as IShape)
      return Math.round(Math.min(controlUtils.getCorRadPercentage(vSize, size ?? [0, 0], shapeType ?? ''), 100))
    },
    corRadDisabled(): boolean {
      const { currLayer } = this
      return (currLayer as IShape).shapeType === 'e'
    },
    currLayer(): AllLayerTypes {
      return this.currPage.layers[this.currSelectedIndex]
    },
    isLine(): boolean {
      return shapeUtils.isLine(this.currLayer)
    },
    isBasicShape(): boolean {
      return shapeUtils.isBasicShape(this.currLayer)
    },
    isNormalDash(): boolean {
      return (this.currLayer as IShape).dasharray?.length === 0
    },
    isLineCapButt(): boolean {
      return (this.currLayer as IShape).linecap === 'butt'
    },
    startMarker(): string {
      return this.markerListReady ? (this.currLayer as IShape).markerId?.[0] ?? 'none' : 'none'
    },
    endMarker(): string {
      return this.markerListReady ? (this.currLayer as IShape).markerId?.[1] ?? 'none' : 'none'
    },
    makeSlots(): { marker: string, name: string }[] {
      return this.markerIds.map((id, index) => ({ marker: id, name: `g0i${index}` }))
    }
  },
  methods: {
    ...mapMutations({
      _updateLayerProps: 'UPDATE_layerProps'
    }),
    ...mapActions('markers',
      [
        'getCategories'
      ]
    ),
    switchMode(mode: number) {
      this.currMode = mode
    },
    async fetchMarkers() {
      if (this.categories && this.categories.length > 0) return
      await this.getCategories()
    },
    setLineWidth(value: number) {
      shapeUtils.setLineWidth(value)
    },
    handleLineDash(mode: 0 | 1) {
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { dasharray: (mode === 0) ? [] : [1] }
      )
      stepsUtils.record()
    },
    handleLineEdge(mode: 0 | 1) {
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { linecap: (mode === 0) ? 'butt' : 'round' }
      )
      stepsUtils.record()
    },
    handleStartMarkerUpdate(value: string) {
      const currLayer = (this.currLayer as IShape)
      const { styleArray, svg, trimWidth, vSize, trimOffset } = this.markerContentMap[value]
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          styleArray: [currLayer.styleArray[0], styleArray[0], currLayer.styleArray[2]],
          svg: shapeUtils.genLineSvgTemplate(svg, this.markerContentMap[this.endMarker].svg),
          trimWidth: [trimWidth, currLayer.trimWidth?.[1]],
          markerWidth: [vSize[0], currLayer.markerWidth?.[1] ?? 0],
          trimOffset: [trimOffset, currLayer.trimOffset?.[1] ?? -1]
        }
      )
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          markerId: [value, currLayer.markerId?.[1] ?? 'none']
        }
      )
      stepsUtils.record()
    },
    handleEndMarkerUpdate(value: string) {
      const currLayer = (this.currLayer as IShape)
      const { styleArray, svg, trimWidth, vSize, trimOffset } = this.markerContentMap[value]
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          styleArray: [currLayer.styleArray[0], currLayer.styleArray[1], styleArray[0]],
          svg: shapeUtils.genLineSvgTemplate(this.markerContentMap[this.startMarker].svg, svg),
          trimWidth: [currLayer.trimWidth?.[0], trimWidth],
          markerWidth: [currLayer.markerWidth?.[0] ?? 0, vSize[0]],
          trimOffset: [currLayer.trimOffset?.[0] ?? -1, trimOffset]
        }
      )
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          markerId: [currLayer.markerId?.[0] ?? 'none', value]
        }
      )
      stepsUtils.record()
    },
    handleBasicShapeFilledUpdate(bool: boolean) {
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { filled: bool }
      )
      stepsUtils.record()
    },
    handleBasicShapeCorRadPercentUpdate(value: number) {
      const corRadPercentage = value
      const { vSize, size, shapeType } = (this.currLayer as IShape)
      const newSize = Array.from(size ?? [])
      if (newSize.length >= 2) {
        newSize[1] = controlUtils.getCorRadValue(vSize, corRadPercentage, shapeType ?? '')
      }
      layerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { size: newSize }
      )
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-object-adjust {
  width: 100%;
  &__options {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: center;
    @include btn-SM();
    font-weight: 600;
    padding: 8px;
    border-radius: 5px;
    transition: background-color 0.2s, color 0.2s;
    box-sizing: border-box;

    &--with-val {
      display: grid;
      grid-template-columns: auto auto clamp(30px, 10vw, 100px);
      grid-template-rows: 1fr;
      column-gap: 20px;
    }
  }

  &__line-dash {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 1fr auto 1fr 1fr;
    column-gap: 12px;
    align-items: center;
    justify-content: space-between;
    &__option {
      display: flex;
      align-items: center;
      justify-content: center;
      @include btn-SM();
      font-weight: 600;
      padding: 6px;
      border-radius: 5px;
      transition: background-color 0.2s;
    }
  }

  &__fill {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 1fr;
    column-gap: 14px;
    align-items: center;
    justify-content: space-between;
    &__option {
      display: flex;
      align-items: center;
      justify-content: center;
      @include btn-SM();
      font-weight: 600;
      padding: 6px;
      border-radius: 5px;
      transition: background-color 0.2s;
    }
  }

  &__markers {
    width: 100%;
    display: flex;
    align-items: center;
    overflow-x: scroll;
    @include no-scrollbar;
    padding: 2px 2px;

    > div {
      aspect-ratio: 1/1;

      margin-right: 16px;
    }
  }

  .vr {
    height: 40px;
    @include setColors(gray-5, black-3-5) using ($color) {
      border-left: 2px solid $color;
    }
  }
}
</style>
