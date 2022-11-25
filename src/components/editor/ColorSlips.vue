<template lang="pug">
  div(class="color-panel"
      :class="[whiteTheme ? 'bg-white': 'bg-gray-1-5']"
      v-click-outside="vcoConfig"
      ref="colorPanel")
    img(v-if="showPanelBtn" class="color-panel__btn"
      :src="require(`@/assets/img/svg/btn-pack-hr${whiteTheme ? '-white': ''}.svg`)"
      @click="closePanel()")
    div(class="color-panel__scroll" :style="noPadding ? {padding:0} : {}")
      //- Recently colors
      div(class="color-panel__colors"
          :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
        div(class="text-left mb-5")
          div(class="flex-center")
            svg-icon(v-if="showAllRecentlyColor && !isTouchDevice" iconName="chevron-left"
                  iconWidth="24px" :iconColor="whiteTheme ? 'gray-1' : 'white'"
                  class="mr-5" @click.native="lessRecently()")
            span {{$t('NN0679')}}
          span(v-if="!showAllRecentlyColor" class="btn-LG" @click="moreRecently()") {{$t('NN0082')}}
        div
          div(class="color-panel__add-color pointer"
            @click="openColorPanel($event)")
          div(v-for="color in recentlyColors"
            class="color-panel__color"
            :style="colorStyles(color)"
            @click="handleColorEvent(color)")
      template(v-if="!showAllRecentlyColor")
        template(v-if="isBrandkitAvailable")
          //- Brandkit select
          div(class="relative")
            brand-selector(theme="mobile-panel")
            div(class="color-panel__brand-settings pointer"
                @click="handleOpenSettings")
              svg-icon(iconName="settings" iconColor="gray-2" iconWidth="24px")
          //- Brandkit palettes
          div(v-if="isPalettesLoading" class="color-panel__colors")
            svg-icon(iconName="loading"
                    iconWidth="20px"
                    iconColor="white")
          div(v-else v-for="palette in currentPalettes"
              class="color-panel__colors"
              :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
            div(class="text-left mb-5")
              span {{getDisplayedPaletteName(palette)}}
            div
              div(v-for="color in palette.colors"
                class="color-panel__color"
                :style="colorStyles(color.color)"
                @click="handleColorEvent(color.color)")
        //- Document colors
        div(class="color-panel__colors"
            :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
          div(class="text-left mb-5")
            span {{$t('NN0091')}}
          div
            div(v-for="color in documentColors"
              class="color-panel__color"
              :style="colorStyles(color)"
              @click="handleColorEvent(color)")
        //- Preset Colors
        div(class="color-panel__colors"
            :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
          div(class="text-left mb-5")
            span {{$t('NN0089')}}
          div
            div(v-for="color in defaultColors"
              class="color-panel__color"
              :style="colorStyles(color)"
              @click="handleColorEvent(color)")
    color-picker(v-if="isColorPickerOpen"
      class="color-panel__color-picker"
      ref="colorPicker"
      v-click-outside="closeColorModal"
      :currentColor="colorUtils.currColor"
      @update="handleDragUpdate"
      @final="handleChangeStop")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import colorUtils from '@/utils/colorUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import layerUtils from '@/utils/layerUtils'
import mouseUtils from '@/utils/mouseUtils'
import { LayerType, SidebarPanelType } from '@/store/types'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  name: 'ColorSlips',
  props: {
    whiteTheme: {
      type: Boolean,
      default: false
    },
    alignLeft: {
      type: Boolean,
      default: true
    },
    noPadding: {
      type: Boolean,
      default: false
    },
    showPanelBtn: {
      type: Boolean,
      default: true
    },
    /**
     * @param allRecentlyControl - is used when you want to switch the all recently panel from parent component
     */
    allRecentlyControl: {
      type: Boolean,
      required: false
    }
  },
  components: {
    ColorPicker,
    BrandSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      vcoConfig: {
        handler: () => { /**/ },
        middleware: null as unknown,
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      },
      openColorPicker: false,
      colorUtils,
      middlewareMap: {
        text: 'shape-setting__color',
        shapge: 'shape-setting__color'
      },
      lastPickColor: '',
      showAllRecently: false
    }
  },
  created() {
    this.vcoConfig.middleware = this.middleware
    this.vcoConfig.handler = this.clickOutside
  },
  mounted() {
    this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color: colorUtils.currColor })
    this.setIsColorPanelOpened(true)
    if (this.isColorPanelHandling) {
      brandkitUtils.fetchPalettes(this.fetchPalettes)
    }
    this.initRecentlyColors()
  },
  destroyed() {
    this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color: colorUtils.currColor })
    this.setIsColorPanelOpened(false)
  },
  watch: {
    currentBrand() {
      if (this.isColorPanelHandling) {
        brandkitUtils.fetchPalettes(this.fetchPalettes)
      }
    }
  },
  computed: {
    ...mapGetters({
      documentColors: 'color/getDocumentColors',
      defaultColors: 'color/getDefaultColors',
      allRecentlyColors: 'color/getRecentlyColors',
      currSelectedInfo: 'getCurrSelectedInfo',
      currentBrand: 'brandkit/getCurrentBrand',
      selectedTab: 'brandkit/getSelectedTab',
      isPalettesLoading: 'brandkit/getIsPalettesLoading',
      currPanel: 'getCurrSidebarPanelType',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType'
    }),
    isBrandkitAvailable(): boolean {
      return brandkitUtils.isBrandkitAvailable
    },
    isColorPanelHandling(): boolean {
      return this.isBrandkitAvailable && (this.currPanel !== SidebarPanelType.brand || this.selectedTab !== 'color')
    },
    isShape(): boolean {
      return layerUtils.getCurrConfig.type === LayerType.shape
    },
    isFrame(): boolean {
      return layerUtils.getCurrConfig.type === LayerType.frame
    },
    isText(): boolean {
      return this.currSelectedInfo.types.has('text') && this.currSelectedInfo.layers.length === 1
    },
    isColorPickerOpen(): boolean {
      return colorUtils.isColorPickerOpen
    },
    currentPalettes(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
    },
    showAllRecentlyColor(): boolean {
      return this.allRecentlyControl ?? this.showAllRecently
    },
    recentlyColors(): string[] {
      return this.showAllRecentlyColor
        ? this.allRecentlyColors
        : this.allRecentlyColors.slice(0, 20)
    },
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors',
      setCurrFunctionPanel: 'SET_currFunctionPanelType',
      setSettingsOpen: 'brandkit/SET_isSettingsOpen',
      setIsColorPanelOpened: 'SET_isColorPanelOpened'
    }),
    ...mapActions({
      fetchPalettes: 'brandkit/fetchPalettes',
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors'
    }),
    handleOpenSettings() {
      this.setSettingsOpen(true)
    },
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return brandkitUtils.getDisplayedPaletteName(colorPalette)
    },
    handleColorEvent(color: string) {
      colorUtils.event.emit(colorUtils.currEvent, color)
      colorUtils.event.emit(colorUtils.currStopEvent, color)
      colorUtils.setCurrColor(color)
      this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color })
    },
    handleDragUpdate(color: string) {
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currEvent, color)
        colorUtils.setCurrColor(color)
      })
      this.lastPickColor = color
    },
    handleChangeStop(color: string) {
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currStopEvent, color)
      })
    },
    closeColorModal(): void {
      if (this.isColorPickerOpen && this.lastPickColor !== '') {
        this.addRecentlyColors(this.lastPickColor)
      }
      colorUtils.setIsColorPickerOpen(false)
    },
    clickOutside(): void {
      const sel = window.getSelection()
      if (sel && sel.rangeCount) {
        const target = sel?.getRangeAt(0).startContainer
        if (target && target instanceof HTMLElement && target.classList.contains('input-color')) {
          return
        }
      }
      this.closeColorModal()
      this.$emit('toggleColorPanel', false)
    },
    middleware(event: MouseEvent): boolean {
      return this.isShape || this.isFrame ? (event.target as HTMLElement).className !== 'shape-setting__color' : true
    },
    closePanel(): void {
      this.$emit('toggleColorPanel', false)
    },
    openColorPanel(event: MouseEvent) {
      if (generalUtils.isTouchDevice()) {
        this.$emit('openColorPicker')
        return
      }
      colorUtils.setIsColorPickerOpen(true)
      Vue.nextTick(() => {
        const colorPanel = this.$refs.colorPanel as HTMLElement
        const colorPicker = document.getElementsByClassName('color-panel__color-picker')[0] as HTMLElement
        const [width, height] = [colorPicker.offsetWidth, colorPicker.offsetHeight]
        const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
        const mousePos = mouseUtils.getMouseAbsPoint(event)
        const { top, left, right } = (event.target as HTMLElement).getBoundingClientRect()

        const margin = 10
        const panelTop = colorPanel.getBoundingClientRect().top
        let topPos = top - panelTop
        if (top + height > vh) {
          topPos -= ((top + height) - vh)
        }

        const pickerPos = this.alignLeft ? {
          left: `${left - colorPanel.getBoundingClientRect().left - width - margin}px`,
          top: `${topPos}px`
        } : {
          right: `${colorPanel.getBoundingClientRect().right - right - width - margin}px`,
          top: `${topPos}px`
        }
        if (this.alignLeft) {
          colorPicker.style.left = pickerPos.left ?? '0px'
          colorPicker.style.top = pickerPos.top
        } else {
          colorPicker.style.right = pickerPos.right ?? '0px'
          colorPicker.style.top = pickerPos.top
        }
      })
    },
    lessRecently() { this.showAllRecently = false },
    moreRecently() {
      this.$emit('openColorMore')
      this.showAllRecently = true
    }
  }
})
</script>

<style lang="scss" scoped>
.color-panel {
  @include body-MD;
  position: relative;
  width: 100%;
  height: 100%;
  z-index: setZindex(color-panel);
  box-sizing: border-box;
  filter: drop-shadow(0px -1px 5px setColor(white, 0.2));
  &__scroll {
    @include hover-scrollbar(dark);
    box-sizing: border-box;
    height: 100%;
    padding: 20px 4px 20px 14px; // padding-right: 14 - 10(scrollbar width)
    > div + div {
      margin-top: 8px;
    }
  }
  &__brand-settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__btn {
    position: absolute;
    top: 0;
    transform: translate(-50%, -100%);
  }
  &__colors {
    > div:nth-child(1) {
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
    > div:nth-child(2) {
      width: 100%;
      display: grid;
      grid-auto-rows: auto;
      grid-template-columns: repeat(7, 1fr);
      row-gap: 5px;
      column-gap: 5px;
      justify-content: center;
      align-items: center;
    }
  }

  &__add-color {
    width: 100%;
    // height: 100%;
    padding-top: 100%;
    background-image: url("~@/assets/img/svg/addColor.png");
    background-size: cover;
    box-shadow: 0px 1px 4px setColor(gray-1-5, 0.2);
  }

  &__color {
    width: 100%;
    padding-top: 100%;
    border-radius: 2px;
    border: 1px solid setColor(gray-0, 0.2);
    box-sizing: border-box;
    // box-shadow: 0px 1px 4px setColor(gray-1-5, 0.2);
    cursor: pointer;
  }

  &__color-picker {
    position: absolute;
    z-index: setZindex(color-panel);
  }
}
</style>
