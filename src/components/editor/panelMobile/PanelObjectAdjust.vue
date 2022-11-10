<template lang="pug">
  div(class="panel-object-adjust")
    template(v-if="isLine")
      div(class="panel-object-adjust__options")
        div(v-for="(option,index) in lineOptions"
            class="panel-object-adjust__option"
            :class="currMode === index ? 'bg-blue-1' : 'bg-gray-5'")
          svg-icon(
            :iconName="option"
            iconWidth="24px"
            :iconColor="currMode === index ? 'white' :'gray-2'"
            @pointerdown.native="switchMode(index)")
      div(v-if="currMode !== -1" class="panel-object-adjust__settings mt-25")
        mobile-slider(v-if="currMode === 0" :title="`${$t('NN0681')}`"
          :borderTouchArea="true"
          :name="`${$t('NN0681')}`"
          :value="lineWidth"
          :min="lineWidthMin"
          :max="lineWidthMax"
          @update="setLineWidth")
        div(v-if="currMode === 1" class="panel-object-adjust__line-dash")
          div(class="panel-object-adjust__line-dash__option bg-gray-5"
              :class="{'border-blue-1': isNormalDash}"
              @pointerdown="handleLineDash(0)")
            svg-icon(iconName="no-dash" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          div(class="panel-object-adjust__line-dash__option bg-gray-5"
              :class="{'border-blue-1': !isNormalDash}"
              @pointerdown="handleLineDash(1)")
            svg-icon(iconName="dash-1" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          div(class="vr")
          div(class="panel-object-adjust__line-dash__option bg-gray-5"
              :class="{'border-blue-1': isLineCapButt}"
              @pointerdown="handleLineEdge(0)")
            svg-icon(class="mr-5" iconName="butt" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text body-2") {{$t('NN0084')}}
          div(class="panel-object-adjust__line-dash__option bg-gray-5"
              :class="{'border-blue-1': !isLineCapButt}"
              @pointerdown="handleLineEdge(1)")
            svg-icon(class="mr-5" iconName="round" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text body-2") {{$t('NN0085')}}
        div(v-if="currMode === 2" class="panel-object-adjust__markers")
            template(v-for="markerslot in makeSlots")
              div(class="panel-object-adjust__option bg-gray-5"
                  :class="{'outline-blue-1': startMarker === markerslot.marker}"
                  @pointerup="handleStartMarkerUpdate(markerslot.marker)")
                marker-icon(iconWidth="18px" iconColor="#474A57" iconHeight="12px"
                  :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
                  :svg="markerContentMap[markerslot.marker].svg"
                  :trimWidth="markerContentMap[markerslot.marker].trimWidth"
                  :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
                  :trimOffset="markerContentMap[markerslot.marker].trimOffset")
        div(v-if="currMode === 3" class="panel-object-adjust__markers")
          template(v-for="markerslot in makeSlots")
            div(class="panel-object-adjust__option bg-gray-5"
                :class="{'outline-blue-1': endMarker === markerslot.marker}"
                @pointerup="handleEndMarkerUpdate(markerslot.marker)")
              marker-icon(iconWidth="18px" iconColor="#474A57" iconHeight="12px"
                :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
                :svg="markerContentMap[markerslot.marker].svg"
                :trimWidth="markerContentMap[markerslot.marker].trimWidth"
                :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
                :trimOffset="markerContentMap[markerslot.marker].trimOffset"
                style="transform: rotate(180deg)")
    template(v-if="isBasicShape")
      div(class="panel-object-adjust__options")
        div(v-for="(option,index) in ['line-width', 'non-filled']"
            class="panel-object-adjust__option"
            :class="currMode === index ? 'bg-blue-1' : 'bg-gray-5'"
            @pointerdown="switchMode(index)")
          svg-icon(
            :iconName="option"
            iconWidth="24px"
            :iconColor="currMode === index ? 'white' :'gray-2'")
        div(class="panel-object-adjust__option panel-object-adjust__option--with-val"
            :class="corRadDisabled ? 'bg-gray-6 text-gray-4 click-disabled' : currMode === 2 ? 'bg-blue-1 text-white' : 'bg-gray-5 text-gray-2'"
            @pointerdown="switchMode(2)")
          svg-icon(
            :iconName="'rounded-corner'"
            iconWidth="16px"
            :iconColor="corRadDisabled ? 'gray-4' :currMode === 2 ? 'white' :'gray-2'")
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
          div(class="panel-object-adjust__fill__option bg-gray-5"
              :class="{'border-blue-1': !filled}"
              @pointerdown="handleBasicShapeFilledUpdate(false)")
            svg-icon(iconName="non-filled" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
            div(class="ml-25 body-2") {{$t('NN0088')}}
          div(class="panel-object-adjust__fill__option bg-gray-5"
              :class="{'border-blue-1': filled}"
              @pointerdown="handleBasicShapeFilledUpdate(true)")
            svg-icon(iconName="filled" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
            div(class="ml-25 body-2") {{$t('NN0087')}}
        mobile-slider(v-if="currMode === 2" :title="`${$t('NN0085')}`"
          :borderTouchArea="true"
          :name="`${$t('NN0085')}`"
          :value="corRadPercentage"
          :min="0"
          :max="100"
          @update="handleBasicShapeCorRadPercentUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { ILayer, IShape } from '@/interfaces/layer'
import controlUtils from '@/utils/controlUtils'
import pageUtils from '@/utils/pageUtils'
import { IListServiceContentData } from '@/interfaces/api'
import { IMarker } from '@/interfaces/shape'
import assetUtils from '@/utils/assetUtils'
import MarkerIcon from '@/components/global/MarkerIcon.vue'
import shapeUtils from '@/utils/shapeUtils'
import mappingUtils from '@/utils/mappingUtils'
import stepsUtils from '@/utils/stepsUtils'
import layerUtils from '@/utils/layerUtils'

export default Vue.extend({
  components: {
    MobileSlider,
    MarkerIcon
  },
  props: {
  },
  data() {
    const { min: lineWidthMin, max: lineWidthMax } = mappingUtils.mappingMinMax('lineWidth')
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
      lineWidthMax
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
      getLayer: 'getLayer',
      token: 'user/getToken'
    }),
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState(
      'markers',
      [
        'categories'
      ]
    ),
    inAdminMode(): boolean {
      return this.role === 0 && this.adminMode === true
    },
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
    currLayer(): ILayer {
      return this.getLayer(pageUtils.currFocusPageIndex, this.currSelectedIndex) as ILayer
    },
    isLine(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'D'
    },
    isBasicShape(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'E'
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
    border-left: 2px solid setColor(gray-5);
  }
}
</style>
