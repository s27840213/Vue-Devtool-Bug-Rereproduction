<template lang="pug">
div(class="color-panel"
    :style="bgStyle"
    v-click-outside="vcoConfig"
    ref="colorPanel")
  img(v-if="showPanelBtn" class="color-panel__btn"
    :src="require(`@/assets/img/svg/btn-pack-hr${whiteTheme ? '-white': ''}.svg`)"
    @click="closePanel()")
  div(class="color-panel__scroll" :class="{'p-0': noPadding}")
    //- Recently colors
    div(class="color-panel__colors"
        :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
      div(class="text-left mb-5")
        div(class="flex-center")
          svg-icon(v-if="showAllRecentlyColor && mode!=='PanelColor'" iconName="chevron-left"
                iconWidth="24px" :iconColor="whiteTheme ? 'gray-1' : 'white'"
                class="mr-5" @click.native="lessRecently()")
          span {{$t('NN0679')}}
        span(v-if="!showAllRecentlyColor" class="btn-LG" @click="moreRecently()") {{$t('NN0082')}}
      div
        color-btn(color="add" :active="openColorPicker"
                  @click="openColorPanel($event)")
        color-btn(v-for="color in recentlyColors" :color="color" :key="color"
                  :active="color === selectedColor"
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
            color-btn(v-for="color in palette.colors" :color="color.color"
                      :active="color.color === selectedColor"
                      @click="handleColorEvent(color.color)")
      //- Document colors
      div(class="color-panel__colors"
          :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
        div(class="text-left mb-5")
          span {{$t('NN0091')}}
        div
          color-btn(v-for="color in documentColors" :color="color" :key="color"
                    :active="color === selectedColor"
                    @click="handleColorEvent(color)")
      //- Preset Colors
      div(class="color-panel__colors"
          :style="{'color': whiteTheme ? '#000000' : '#ffffff'}")
        div(class="text-left mb-5")
          span {{$t('NN0089')}}
        div
          color-btn(v-for="color in defaultColors" :color="color" :key="color"
                    :active="color === selectedColor"
                    @click="handleColorEvent(color)")
          img(v-if="mode==='PanelBG'"
            src="@/assets/img/svg/transparent.svg"
            width="100%" height="100%"
            @click="handleColorEvent('#ffffff00')")
  color-picker(v-if="openColorPicker"
    class="color-panel__color-picker"
    ref="colorPicker"
    v-click-outside="closeColorModal"
    :currentColor="currentColor"
    @update="handleDragUpdate"
    @final="handleChangeStop")
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import vClickOutside from 'click-outside-vue3'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import colorUtils from '@/utils/colorUtils'
import layerUtils from '@/utils/layerUtils'
import mouseUtils from '@/utils/mouseUtils'
import { SidebarPanelType } from '@/store/types'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'
import generalUtils from '@/utils/generalUtils'
import pageUtils from '@/utils/pageUtils'
import editorUtils from '@/utils/editorUtils'

export default defineComponent({
  name: 'ColorSlips',
  props: {
    // Defind some style or logic difference.
    mode: {
      type: String as PropType<'FunctionPanel' | 'PanelBG' | 'PanelColor'>,
      required: true
    },
    /**
     * @param allRecentlyControl - is used when you want to switch the all recently panel from parent component
     */
    allRecentlyControl: {
      type: Boolean,
      required: false
    },
    selectedColor: {
      type: String,
      default: ''
    }
  },
  components: {
    ColorPicker,
    BrandSelector,
    ColorBtn
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  emits: ['selectColor', 'selectColorEnd', 'toggleColorPanel', 'openColorPicker', 'openColorMore'],
  data() {
    return {
      vcoConfig: {
        handler: () => { /**/ },
        middleware: null as unknown,
        events: ['dblclick', 'click', 'contextmenu']
        // events: ['dblclick', 'click', 'contextmenu', 'mousedown']
      },
      openColorPicker: false,
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
  unmounted() {
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
      _defaultColors: 'color/getDefaultColors',
      defaultBgColor: 'color/getDefaultBgColors',
      _recentlyColors: 'color/getRecentlyColors',
      currSelectedInfo: 'getCurrSelectedInfo',
      currentBrand: 'brandkit/getCurrentBrand',
      selectedTab: 'brandkit/getSelectedTab',
      isPalettesLoading: 'brandkit/getIsPalettesLoading',
      currPanel: 'getCurrSidebarPanelType',
      getBackgroundColor: 'getBackgroundColor'
    }),
    isBrandkitAvailable(): boolean {
      return brandkitUtils.isBrandkitAvailable
    },
    isColorPanelHandling(): boolean {
      return this.isBrandkitAvailable && (this.currPanel !== SidebarPanelType.brand || this.selectedTab !== 'color')
    },
    isText(): boolean {
      return this.currSelectedInfo.types.has('text') && this.currSelectedInfo.layers.length === 1
    },
    bgStyle(): Record<string, string> {
      return this.mode === 'FunctionPanel' ? {
        background: '#2C2F43'// gray-1-5
      } : {
        background: 'transparent'
      }
    },
    whiteTheme(): boolean {
      return ['PanelColor'].includes(this.mode)
    },
    noPadding(): boolean {
      return ['PanelColor', 'PanelBG'].includes(this.mode)
    },
    showPanelBtn(): boolean {
      return !['PanelColor', 'PanelBG'].includes(this.mode)
    },
    currentPalettes(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
    },
    currentColor(): string {
      return this.mode === 'PanelBG'
        ? this.getBackgroundColor(pageUtils.currFocusPageIndex)
        : colorUtils.currColor
    },
    showAllRecentlyColor(): boolean {
      return ['PanelColor'].includes(this.mode) ? this.allRecentlyControl : this.showAllRecently
    },
    recentlyColors(): string[] {
      return this.showAllRecentlyColor
        ? this._recentlyColors
        : this._recentlyColors.slice(0, 20)
    },
    defaultColors(): unknown {
      return this.mode === 'PanelBG' ? this.defaultBgColor : this._defaultColors
    },
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors',
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
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return brandkitUtils.getDisplayedPaletteName(colorPalette)
    },
    handleColorEvent(color: string) {
      if (this.mode === 'PanelBG') {
        this.$emit('selectColor', color)
      } else {
        colorUtils.event.emit(colorUtils.currEvent, color)
        colorUtils.event.emit(colorUtils.currStopEvent, color)
        colorUtils.setCurrColor(color)
      }
      this.updateDocumentColors({ pageIndex: layerUtils.pageIndex, color })
    },
    handleDragUpdate(color: string) {
      window.requestAnimationFrame(() => {
        if (this.mode === 'PanelBG') {
          this.$emit('selectColor', color)
        } else {
          colorUtils.event.emit(colorUtils.currEvent, color)
          colorUtils.setCurrColor(color)
        }
      })
      this.lastPickColor = color
    },
    handleChangeStop(color: string) {
      window.requestAnimationFrame(() => {
        if (this.mode === 'PanelBG') {
          this.$emit('selectColorEnd')
        } else {
          colorUtils.event.emit(colorUtils.currStopEvent, color)
        }
      })
    },
    closeColorModal(): void {
      if (this.openColorPicker && this.lastPickColor !== '') {
        this.addRecentlyColors(this.lastPickColor)
      }
      this.openColorPicker = false
    },
    clickOutside(): void {
      this.closeColorModal()
      this.closePanel()
    },
    middleware(event: MouseEvent): boolean {
      const target = event.target as HTMLElement
      return this.mode === 'PanelBG' ? false // Never close in PanelBG
        // Don't close when selecting color target
        : !(target.matches('.function-panel .color-btn *') || // Object, BG, text effect color
        target.matches('.function-panel .text-setting__color *')) // Text color
    },
    closePanel(): void {
      editorUtils.toggleColorSlips(false)
    },
    openColorPanel(event: MouseEvent) {
      if (generalUtils.isTouchDevice()) {
        this.$emit('openColorPicker')
        return
      }
      this.openColorPicker = true
      this.$nextTick(() => {
        const colorPanel = this.$refs.colorPanel as HTMLElement
        const colorPicker = (this.$refs.colorPicker as any).$el as HTMLElement
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

        const pickerPos = {
          right: `${colorPanel.getBoundingClientRect().right - right - width - margin}px`,
          top: `${topPos}px`
        }
        colorPicker.style.right = pickerPos.right ?? '0px'
        colorPicker.style.top = pickerPos.top
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
    .mobile-panel & { // only for mobile editor
      @include no-scrollbar;
    }
    @include hover-scrollbar(dark);
    box-sizing: border-box;
    height: 100%;
    &:not(.p-0) {
      padding: 20px 4px 20px 14px; // padding-right: 14 - 10(scrollbar width)
    }
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

  &__color-picker {
    position: absolute;
    z-index: setZindex(color-panel);
  }
}
</style>
