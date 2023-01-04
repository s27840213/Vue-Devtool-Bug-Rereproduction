<template lang="pug">
  div(class="shape-setting")
    //- span(class="color-picker__title text-blue-1 label-lg") Document Colors
    //- Line shape setting
    div(class="action-bar flex-around line-actions" style="padding: 8px 0"
              v-if="isLine")
      div(class="shape-setting__line-action-wrapper")
        svg-icon(class="pointer feature-button"
                iconName="line-width" iconWidth="24px" iconColor="gray-2"
                @click.native="openLineSliderPopup")
      div(class="shape-setting__line-action-wrapper")
        svg-icon(class="pointer feature-button"
                iconName="line-dash" iconWidth="24px" iconColor="gray-2"
                @click.native="handleValueModal('line-dash')")
        general-value-selector(v-if="openValueSelector === 'line-dash'"
                      :valueArray="[[1, 2], [3, 4]]"
                      class="shape-setting__value-selector-dash-and-edge"
                      v-click-outside="handleValueModal"
                      :values="dashAndEdge"
                      @update="handleLineDashEdgeUpdate"
                      itemMinWidth="70",
                      buttonHeight="20")
          template(class="pointer" v-slot:g0i0)
            svg-icon(iconName="no-dash" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          template(class="pointer" v-slot:g0i1)
            svg-icon(iconName="dash-1" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          template(class="pointer" v-slot:g1i0)
            svg-icon(iconName="butt" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text") {{$t('NN0084')}}
          template(class="pointer" v-slot:g1i1)
            svg-icon(iconName="round" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text") {{$t('NN0085')}}
      div(class="vertical-rule bg-gray-4")
      div(class="shape-setting__line-action-wrapper pointer feature-button"
          @click="handleValueModal('start-marker')")
        marker-icon(iconWidth="25px" iconColor="#474A57" iconHeight="10px"
          :styleFormat="markerContentMap[startMarker].styleArray[0]"
          :svg="markerContentMap[startMarker].svg"
          :trimWidth="markerContentMap[startMarker].trimWidth"
          :markerWidth="markerContentMap[startMarker].vSize[0]"
          :trimOffset="markerContentMap[startMarker].trimOffset")
        general-value-selector(v-if="openValueSelector === 'start-marker' && markerListReady"
                      :valueArray="[markerIds]"
                      class="shape-setting__value-selector-marker"
                      v-click-outside="handleValueModal"
                      :values="[startMarker]"
                      @update="handleStartMarkerUpdate"
                      itemMinWidth="76",
                      buttonHeight="37")
          template(v-for="markerslot in makeSlots(markerIds)" class="pointer" v-slot:[markerslot.name])
            marker-icon(iconWidth="25px" iconColor="#474A57" iconHeight="12px"
              :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
              :svg="markerContentMap[markerslot.marker].svg"
              :trimWidth="markerContentMap[markerslot.marker].trimWidth"
              :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
              :trimOffset="markerContentMap[markerslot.marker].trimOffset")
        general-value-selector(v-if="openValueSelector === 'start-marker' && !markerListReady"
                      :valueArray="[['pending']]"
                      class="shape-setting__value-selector-marker"
                      v-click-outside="handleValueModal"
                      :values="['pending']"
                      itemMinWidth="76",
                      buttonHeight="37")
            template(v-slot:g0i0)
              svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="gray-2")
      div(class="shape-setting__line-action-wrapper pointer feature-button"
          @click="handleValueModal('end-marker')")
        marker-icon(iconWidth="25px" iconColor="#474A57" iconHeight="10px"
          :styleFormat="markerContentMap[endMarker].styleArray[0]"
          :svg="markerContentMap[endMarker].svg"
          :trimWidth="markerContentMap[endMarker].trimWidth"
          :markerWidth="markerContentMap[endMarker].vSize[0]"
          :trimOffset="markerContentMap[endMarker].trimOffset"
          style="transform: rotate(180deg)")
        general-value-selector(v-if="openValueSelector === 'end-marker' && markerListReady"
                      :valueArray="[markerIds]"
                      class="shape-setting__value-selector-marker"
                      v-click-outside="handleValueModal"
                      :values="[endMarker]"
                      @update="handleEndMarkerUpdate"
                      itemMinWidth="76",
                      buttonHeight="37")
          template(v-for="markerslot in makeSlots(markerIds)" class="pointer" v-slot:[markerslot.name])
            marker-icon(iconWidth="25px" iconColor="#474A57" iconHeight="12px"
              :styleFormat="markerContentMap[markerslot.marker].styleArray[0]"
              :svg="markerContentMap[markerslot.marker].svg"
              :trimWidth="markerContentMap[markerslot.marker].trimWidth"
              :markerWidth="markerContentMap[markerslot.marker].vSize[0]"
              :trimOffset="markerContentMap[markerslot.marker].trimOffset"
              style="transform: rotate(180deg)")
        general-value-selector(v-if="openValueSelector === 'end-marker' && !markerListReady"
                      :valueArray="[['pending']]"
                      class="shape-setting__value-selector-marker"
                      v-click-outside="handleValueModal"
                      :values="['pending']"
                      itemMinWidth="76",
                      buttonHeight="37")
            template(v-slot:g0i0)
              svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="gray-2")
    //- Other shape setting
    div(class="shape-setting__basic-shape-action" v-if="isBasicShape")
      div(class="action-bar flex-around basic-shape-actions" style="padding: 8px 0")
        div(class="shape-setting__line-action-wrapper")
          svg-icon(class="pointer feature-button"
                  iconName="line-width" iconWidth="24px" iconColor="gray-2"
                  @click.native="openBasicShapeSliderPopup")
        div(class="shape-setting__line-action-wrapper")
          svg-icon(class="pointer feature-button"
                  v-if="filled"
                  iconName="filled" iconWidth="24px" iconColor="gray-2"
                  @click.native="handleValueModal('isFilled')")
          svg-icon(class="pointer feature-button"
                  v-else
                  iconName="non-filled" iconWidth="24px" iconColor="gray-2"
                  @click.native="handleValueModal('isFilled')")
          general-value-selector(v-if="openValueSelector === 'isFilled'"
                      :valueArray="[[0, 1]]"
                      class="shape-setting__value-selector-filled"
                      v-click-outside="handleValueModal"
                      :values="[filled ? 1 : 0]"
                      @update="handleBasicShapeFilledUpdate"
                      itemMinWidth="64",
                      buttonHeight="26")
            template(class="pointer" v-slot:g0i0)
              svg-icon(iconName="non-filled" iconWidth="17px" iconColor="gray-2")
              div(class="shape-setting__value-selector__button-text") {{$t('NN0088')}}
            template(class="pointer" v-slot:g0i1)
              svg-icon(iconName="filled" iconWidth="17px" iconColor="gray-2")
              div(class="shape-setting__value-selector__button-text") {{$t('NN0087')}}
      label-with-range(:value="corRadPercentage" :min="0" :max="100"
                      @update="handleBasicShapeCorRadPercentUpdate"
                      :event="corRadEvent"
                      :disabled="corRadDisabled")
        template
          div(class="shape-setting__basic-shape-corner-radius flex-evenly")
            svg-icon(iconName="rounded-corner" iconWidth="11px" iconColor="gray-2")
            div(:style="`font-size: ${$i18n.locale === 'us' ? '12px': ''}`") {{$t('NN0086')}}
    //- Shape color setting
    div(class="shape-setting__colors")
      color-btn(v-if="hasMultiColors"
                :color="groupColor()"
                :active="showColorSlips"
                @click="selectColor(0)")
      color-btn(v-else v-for="(color, index) in getDocumentColors" :color="color"
                :active="showColorSlips && index === currSelectedColorIndex"
                @click="selectColor(index)")
    //- 管理介面
    div(class="shape-setting__info")
      div(v-if="inAdminMode && isObjectElement")
        div(class="shape-setting__info__divider pb-10")
        btn(:type="'primary-sm'"
          class="shape-setting__info__button rounded my-5"
          @click.native="getDataClicked()") 取 得 元 素 資 料
        div(class="shape-setting__info__divider2 pb-10")
        span(class="py-5 text-gray-1 label-lg") 元 素 資 訊
        div(class="shape-setting__info__line" style="background: #eee;")
          span(class="body-1") id
          span(class="pl-15 body-2" @click="copyText(focusDesignId)") {{focusDesignId}}
        img(v-if="focusDesignId.length > 0"
          class="shape-setting__info__image"
          :src="`https://template.vivipic.com/svg/${focusDesignId}/prev?ver=${imgRandQuery}`")
        div(v-if="isGetSvgInfo")
          div(class="shape-setting__info__line")
            span(class="body-1") id
            span(class="pl-15 body-2"
              @click="copyText(svgInfo.key_id)") {{svgInfo.key_id}}
          div(class="shape-setting__info__line")
            span(class="body-1") 語系
            select(class="shape-setting__info__select"
              v-model="svgInfo.locale")
              option(v-for="locale in localeOptions"
                :value="locale") {{locale}}
          div(class="shape-setting__info__line") tags_tw
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="svgInfo.tags_tw")
          div(class="shape-setting__info__line") tags_us
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="svgInfo.tags_us")
          div(class="shape-setting__info__line") tags_jp
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="svgInfo.tags_jp")
          div(class="shape-setting__info__line") plan(0：預設一般 / 1：Pro)
          div
            property-bar
              input(class="body-2 text-gray-2" min="0"
                v-model="svgInfo.plan")
          div(class="pt-10")
            btn(:type="'primary-sm'"
              class="shape-setting__info__button rounded my-5"
              @click.native="updateDataClicked()") 更新
    spinner(v-if="isLoading")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations, mapState, mapActions } from 'vuex'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import GeneralValueSelector from '@/components/GeneralValueSelector.vue'
import LayerUtils from '@/utils/layerUtils'
import { IFrame, IGroup, ILayer, IShape } from '@/interfaces/layer'
import shapeUtils from '@/utils/shapeUtils'
import { IListServiceContentData } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import { IMarker } from '@/interfaces/shape'
import MarkerIcon from '@/components/global/MarkerIcon.vue'
import LabelWithRange from '@/components/LabelWithRange.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import controlUtils from '@/utils/controlUtils'
import { ColorEventType, PopupSliderEventType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import popupUtils from '@/utils/popupUtils'
import MappingUtils from '@/utils/mappingUtils'
import stepsUtils from '@/utils/stepsUtils'
import GeneralUtils from '@/utils/generalUtils'
import designApis from '@/apis/design-info'
import pageUtils from '@/utils/pageUtils'
import frameUtils from '@/utils/frameUtils'
import editorUtils from '@/utils/editorUtils'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    GeneralValueSelector,
    MarkerIcon,
    LabelWithRange,
    ColorBtn
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      fieldRange: {
        lineWidth: { min: 1, max: 100 }
      },
      corRadEvent: PopupSliderEventType.cornerRadius,
      currSelectedColorIndex: 0,
      openSliderBar: '',
      openValueSelector: '',
      openColorPicker: false,
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
      markerListReady: false,
      isLoading: false,
      imgRandQuery: '',
      isGetSvgInfo: false,
      svgInfo: {
        key_id: '' as string,
        author: '' as string,
        edit_time: '' as string,
        tags_tw: '' as string,
        tags_us: '' as string,
        tags_jp: '' as string,
        locale: '' as string,
        plan: '' as string
      },
      localeOptions: ['tw', 'us', 'jp']
    }
  },
  mounted() {
    const currLayer = this.currLayer as IShape
    colorUtils.on(ColorEventType.shape, (color: string) => {
      this.handleColorUpdate(color)
    })
    colorUtils.onStop(ColorEventType.shape, () => {
      this.$nextTick(() => stepsUtils.record())
    })
    colorUtils.setCurrEvent(ColorEventType.shape)
    colorUtils.setCurrColor(this.getDocumentColors[this.currSelectedColorIndex])
    this.fetchMarkers().then(async () => {
      const markerList = (this.categories[0] as IListServiceContentData).list
      this.markerIds = ['none', ...markerList.map(marker => (marker.id))]
      for (const marker of markerList) {
        const markerContent = (await AssetUtils.get(marker)).jsonData as IMarker
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
    popupUtils.on(PopupSliderEventType.lineWidth, (value: number) => {
      this.setLineWidth(value)
    })
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
    ...mapState('markers', [
      'categories'
    ]),
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
      return Math.min(controlUtils.getCorRadPercentage(vSize, size ?? [0, 0], shapeType ?? ''), 100)
    },
    corRadDisabled(): boolean {
      const { currLayer } = this
      return (currLayer as IShape).shapeType === 'e'
    },
    currLayer(): ILayer {
      return this.getLayer(pageUtils.currFocusPageIndex, this.currSelectedIndex) as ILayer
    },
    showColorSlips(): boolean {
      return editorUtils.showColorSlips
    },
    hasMultiColors(): boolean {
      return shapeUtils.hasMultiColors
    },
    getDocumentColors(): string[] {
      return shapeUtils.getDocumentColors
    },
    isLine(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'D'
    },
    isBasicShape(): boolean {
      return this.currLayer.type === 'shape' && this.currLayer.category === 'E'
    },
    startMarker(): string {
      return this.markerListReady ? (this.currLayer as IShape).markerId?.[0] ?? 'none' : 'none'
    },
    endMarker(): string {
      return this.markerListReady ? (this.currLayer as IShape).markerId?.[1] ?? 'none' : 'none'
    },
    focusDesignId(): string {
      return this.currSelectedInfo.layers[0].designId ?? ''
    },
    isObjectElement(): boolean {
      return !(this.currSelectedInfo.layers[0].db === 'text')
    }
  },
  watch: {
    'currSelectedInfo.id': function () {
      this.initilizeRecord()
    },
    focusDesignId: function () {
      this.isGetSvgInfo = false
      this.svgInfo = {
        key_id: '',
        author: '',
        edit_time: '',
        tags_tw: '',
        tags_us: '',
        tags_jp: '',
        locale: '',
        plan: ''
      }
      this.imgRandQuery = GeneralUtils.generateRandomString(5)
    },
    getDocumentColors: function () {
      const currLayer = LayerUtils.getCurrLayer
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        if ((currLayer as IGroup).layers
          .some(l => l.type === 'shape' && l.active && (l as IShape).color.length === 1)) {
          this.currSelectedColorIndex = 0
        }
      }
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
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    groupColor() {
      const currLayer = this.getLayer(pageUtils.currFocusPageIndex, this.currSelectedIndex)
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        const origin = currLayer.layers
          .find((l: ILayer) => l.type === 'shape' && (l as IShape).color.length === 1).color[0]
        const isGroupSameColor = (() => {
          for (const layer of currLayer.layers) {
            if (layer.type === 'shape' && (layer as IShape).color.length === 1 && (layer as IShape).color[0] !== origin) {
              return false
            }
          }
          return true
        })()
        return isGroupSameColor ? origin : 'multi'
      }
    },
    handleColorModalOn(e: MouseEvent) {
      this.openColorPicker = true
    },
    handleColorModalOff(e: MouseEvent) {
      this.openColorPicker = false
    },
    handleColorUpdate(color: string) {
      this.setColor(color)
    },
    selectColor(index: number) {
      this.currSelectedColorIndex = index
      colorUtils.setCurrColor(this.getDocumentColors[index])
      editorUtils.toggleColorSlips(true)
    },
    openLineSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.lineWidth)
      popupUtils.setSliderConfig(Object.assign({ value: this.lineWidth, noText: false }, MappingUtils.mappingMinMax('lineWidth')))
      popupUtils.openPopup('slider', {
        target: '.line-actions'
      })
    },
    openBasicShapeSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.lineWidth)
      popupUtils.setSliderConfig(Object.assign({ value: this.lineWidth, noText: false }, MappingUtils.mappingMinMax('lineWidth')))
      popupUtils.openPopup('slider', {
        target: '.basic-shape-actions'
      })
    },
    handleValueModal(modalName = '') {
      this.openValueSelector = modalName
    },
    setColor(newColor: string) {
      const currLayer = LayerUtils.getCurrLayer
      switch (currLayer.type) {
        case 'shape': {
          const color = [...this.getDocumentColors]
          color[this.currSelectedColorIndex] = newColor
          LayerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.currSelectedIndex, { color })
          break
        }
        case 'tmp':
        case 'group': {
          const { subLayerIdx } = LayerUtils
          if (subLayerIdx === -1) {
            for (const [i, layer] of (currLayer as IGroup).layers.entries()) {
              if (layer.type === 'shape' && (layer as IShape).color.length === 1) {
                LayerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, +i, { color: [newColor] })
              }
            }
          } else {
            const subLayerType = LayerUtils.getCurrConfig.type
            if (subLayerType === 'frame') {
              this.handleFrameColorUpdate(newColor)
            }
            if (subLayerType === 'shape') {
              const color = [...this.getDocumentColors]
              color[this.currSelectedColorIndex] = newColor
              LayerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, subLayerIdx, { color })
            }
          }
          break
        }
        case 'frame':
          this.handleFrameColorUpdate(newColor)
      }
    },
    handleFrameColorUpdate(newColor: string) {
      const { decoration, decorationTop } = LayerUtils.getCurrConfig as IFrame
      let color = [] as Array<string>
      let key = ''
      if (decoration && decorationTop && decoration.color.length && decorationTop.color.length) {
        if (this.currSelectedColorIndex <= decoration.color.length - 1) {
          key = 'decorationColors'
          color = [...decoration.color]
          color[this.currSelectedColorIndex] = newColor
        } else {
          key = 'decorationTopColors'
          color = [...decorationTop.color]
          color[this.currSelectedColorIndex - decoration.color.length] = newColor
        }
      } else {
        decoration && decoration.color.length && (key = 'decorationColors') && (color = [...decoration.color])
        decorationTop && decorationTop.color.length && (key = 'decorationTopColors') && (color = [...decorationTop.color])
        color[this.currSelectedColorIndex] = newColor
      }
      frameUtils.updateFrameDecorColor({
        pageIndex: LayerUtils.pageIndex,
        layerIndex: LayerUtils.layerIndex,
        subLayerIdx: LayerUtils.subLayerIdx
      }, { [key]: color })
    },
    setLineWidth(value: number) {
      shapeUtils.setLineWidth(value)
    },
    handleLineDashEdgeUpdate(index: number, value: number) {
      if (index === 0) {
        this.handleLineDash(value)
      } else {
        this.handleLineEdge(value)
      }
      stepsUtils.record()
      this.$set(this.dashAndEdge, index, value)
    },
    handleLineDash(dash: number) {
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { dasharray: (dash === 1) ? [] : [1] }
      )
    },
    handleLineEdge(edge: number) {
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { linecap: (edge === 3) ? 'butt' : 'round' }
      )
    },
    handleBasicShapeFilledUpdate(index: number, filled: number) {
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { filled: filled === 1 }
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
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        { size: newSize }
      )
    },
    handleStartMarkerUpdate(index: number, value: string) {
      const currLayer = (this.currLayer as IShape)
      const { styleArray, svg, trimWidth, vSize, trimOffset } = this.markerContentMap[value]
      LayerUtils.updateLayerProps(
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
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          markerId: [value, currLayer.markerId?.[1] ?? 'none']
        }
      )
      stepsUtils.record()
    },
    handleEndMarkerUpdate(index: number, value: string) {
      const currLayer = (this.currLayer as IShape)
      const { styleArray, svg, trimWidth, vSize, trimOffset } = this.markerContentMap[value]
      LayerUtils.updateLayerProps(
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
      LayerUtils.updateLayerProps(
        pageUtils.currFocusPageIndex,
        this.currSelectedIndex,
        {
          markerId: [currLayer.markerId?.[0] ?? 'none', value]
        }
      )
      stepsUtils.record()
    },
    makeSlots(markerIds: string[]): { marker: string, name: string }[] {
      return this.markerIds.map((id, index) => ({ marker: id, name: `g0i${index}` }))
    },
    getMarkerContent(markerId: string) {
      return this.markerContentMap[markerId] ?? this.markerContentMap.none
    },
    initilizeRecord() {
      if (this.currSelectedColorIndex < 0) {
        this.currSelectedColorIndex = 0
      }
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          this.$notify({ group: 'copy', text: `${text} 已複製` })
        })
    },
    async getDataClicked() {
      this.isLoading = true

      const data = {}
      if (this.focusDesignId.length === 0) {
        this.$notify({ group: 'copy', text: '無元素id' })
      }

      if (this.focusDesignId.length > 0) {
        const res = await designApis.getDesignInfo(this.token, 'svg', this.focusDesignId, 'select', JSON.stringify(data))
        if (res.data.flag === 0) {
          this.isGetSvgInfo = true
          this.svgInfo = res.data.data
          this.svgInfo.edit_time = this.svgInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
        } else {
          this.$notify({ group: 'copy', text: '找不到模板資料' })
        }
      }

      this.isLoading = false
    },
    async updateDataClicked() {
      if (!this.svgInfo.key_id) {
        this.$notify({ group: 'copy', text: '請先取得元素資料' })
        return
      }

      this.isLoading = true
      const data = {
        locale: this.svgInfo.locale,
        tags_tw: this.svgInfo.tags_tw,
        tags_us: this.svgInfo.tags_us,
        tags_jp: this.svgInfo.tags_jp,
        plan: this.svgInfo.plan ? this.svgInfo.plan : '0'
      }
      const res = await designApis.updateDesignInfo(this.token, 'svg', this.svgInfo.key_id, 'update', JSON.stringify(data))
      if (res.data.flag === 0) {
        this.$notify({ group: 'copy', text: '元素資料更新成功' })
        this.svgInfo = res.data.data
        this.svgInfo.edit_time = this.svgInfo.edit_time.replace(/T/, ' ').replace(/\..+/, '')
      } else {
        this.$notify({ group: 'copy', text: '更新時發生錯誤' })
      }
      this.isLoading = false
    },
    async fetchMarkers() {
      if (this.categories && this.categories.length > 0) return
      await this.getCategories()
    }
  }
})
</script>

<style lang="scss" scoped>
.shape-setting {
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-columns: 1fr;
  &__title {
    margin-bottom: 0px;
    margin-top: 10px;
  }
  > div {
    margin-top: 10px;
  }
  &__colors {
    width: 100%;
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    @media (max-width: 1260px) {
      gap: 10px;
    }
  }
  &__value-selector {
    position: absolute;
    z-index: 9;
    top: 35px;
    margin: 0;

    &__button-text {
      width: 70%;
      font-size: 12px;
      text-align: left;
    }

    &-dash-and-edge {
      @extend .shape-setting__value-selector;
      left: -22.5px;
    }

    &-marker {
      @extend .shape-setting__value-selector;
      left: -100%;
    }

    &-filled {
      @extend .shape-setting__value-selector;
      left: 0;
    }
  }
  &__color-picker {
    position: absolute;
    z-index: 10;
    left: -5px;
    top: 35px;
  }
  &__property-bar {
    width: 50%;
    box-sizing: border-box;
    position: relative;
  }
  &__line-action-wrapper {
    position: relative;
    height: 24px;
  }
  &__basic-shape-action {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__basic-shape-corner-radius {
    display: flex;
    align-items: center;
    > div {
      width: 42px;
    }
  }
  &__info {
    &__divider {
      width: 100%;
      border-top: 2px solid #000;
      margin-top: 10px;
      padding-bottom: 5px;
    }
    &__divider2 {
      width: 100%;
      border-top: 2px dotted #000;
      margin-top: 10px;
      padding-bottom: 5px;
    }
    &__button {
      margin: 0 auto;
      width: 70%;
      padding: 8px 0;
    }
    &__line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 5px;
    }
    &__image {
      margin: 0 auto;
      max-width: 100px;
      max-height: 100px;
      padding-top: 10px;
      padding-bottom: 10px;
    }
    &__select {
      width: 40%;
      height: 35px;
      font-size: 18px;
      border: 1px solid #d9dbe1;
      padding-left: 15px;
    }
  }
}
.rainbow {
  position: relative;
  &:hover {
    box-shadow: 0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff;
  }
}
.vertical-rule {
  width: 1px;
  height: 20px;
  display: inline-block;
  margin: 0;
  padding: 0;
}
</style>
