<template lang="pug">
div(class="mobile-panel"
    :class="{'p-15': !noPaddingTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme}")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': panelTitle !== ''}"
      @pointerdown.stop="dragPanelStart"
      @touchstart.stop="disableTouchEvent")
        div
    div
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn,}")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown.stop="leftButtonAction"
          @touchstart.stop="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="currActivePanel === 'multiple-select'" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn}")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="'white'"
          :iconWidth="'20px'")
        div(class="mobile-panel__btn-click-zone"
          @pointerdown.stop="rightButtonAction"
          @touchstart.stop="disableTouchEvent")
  div(class="mobile-panel__bottom-section")
    tabs(v-if="innerTabs.label" theme="light"
      :tabs="innerTabs.label" v-model="innerTabIndex")
    keep-alive(:include="['PanelTemplate', 'PanelPhoto', 'PanelObject', 'PanelBackground', 'PanelText', 'PanelFile']")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="dynamicBindIs && !isShowPagePreview && !hideDynamicComp"
        class="border-box p-2"
        :is="dynamicBindIs"
        :key="dynamicBindIs"
        :currPage="currPage"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel")
  transition(name="panel-up")
    mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
      :currActivePanel="currActiveSubPanel"
      :currColorEvent="currSubColorEvent"
      :isSubPanel="true"
      :currPage="currPage"
      @switchTab="switchTab"
      @close="closeMobilePanel")
</template>

<script lang="ts">
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelAdjust from '@/components/editor/panelMobile/PanelAdjust.vue'
import PanelBleed from '@/components/editor/panelMobile/PanelBleed.vue'
import PanelBrand from '@/components/editor/panelMobile/PanelBrand.vue'
import PanelBrandList from '@/components/editor/panelMobile/PanelBrandList.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelDownload from '@/components/editor/panelMobile/PanelDownload.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelMore from '@/components/editor/panelMobile/PanelMore.vue'
import PanelObjectAdjust from '@/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelResize from '@/components/editor/panelMobile/PanelResize.vue'
import PanelTextEffect from '@/components/editor/panelMobile/PanelTextEffect.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import Tabs from '@/components/Tabs.vue'
import i18n from '@/i18n'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import { ICurrSelectedInfo, IFooterTabProps } from '@/interfaces/editor'
import { IFrame } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import formatUtils from '@/utils/formatUtils'
import frameUtils from '@/utils/frameUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import picWVUtils from '@/utils/picWVUtils'
import { replaceImgInject } from '@/utils/textFillUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { computed, defineComponent, PropType, provide } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

type IExtraPanelName = '' | 'color' | 'replace'

export default defineComponent({
  name: 'mobile-panel',
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    },
    isSubPanel: {
      default: false,
      type: Boolean
    },
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    },
    footerTabsRef: {
      type: HTMLElement
    },
  },
  emits: ['panelHeight', 'switchTab'],
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelBrand,
    PanelPage,
    PanelPosition,
    PanelFlip,
    PanelOpacity,
    PanelRemoveBg,
    PanelOrder,
    PanelFonts,
    PanelFontSize,
    PanelFontFormat,
    PanelFontSpacing,
    PanelResize,
    PopupDownload,
    PanelMore,
    PanelColor,
    PanelAdjust,
    PanelTextEffect,
    PanelDownload,
    PanelPhotoShadow,
    PanelObjectAdjust,
    PanelBrandList,
    PanelBleed,
    Tabs
  },
  data() {
    return {
      panelHistory: [] as Array<string>,
      // If fixSize is true, panelDragHeight take no effect.
      panelDragHeight: 0,
      lastPointerY: 0,
      extraPanel: '' as IExtraPanelName,
      replaceImg: (() => { /**/ }) as (img: IAssetPhoto | IPhotoItem) => void,
      extraColorEvent: ColorEventType.text,
      isDraggingPanel: false,
      currSubColorEvent: '',
      innerTabIndex: 0,
      // No fit page in mobile now
      // fitPage: _.throttle(() => {
      //   this.$nextTick(() => {
      //     pageUtils.fitPage()
      //   })
      // }, 100, { trailing: false }),
      resizeObserver: null as unknown as ResizeObserver
    }
  },
  created() {
    // Provide props to descendant component, https://vuejs.org/guide/components/provide-inject.html
    provide(replaceImgInject, computed(() => this.replaceImg))
  },
  computed: {
    ...mapGetters('imgControl', {
      isImgCtrl: 'isImgCtrl',
      isBgImgCtrl: 'isBgImgCtrl'
    }),
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      currSelectedInfo: 'getCurrSelectedInfo',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      currActiveSubPanel: 'mobileEditor/getCurrActiveSubPanel',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
      hasCopiedFormat: 'getHasCopiedFormat',
      userInfo: picWVUtils.appendModuleName('getUserInfo'),
      inBrowserMode: 'webView/getInBrowserMode'
    }),
    historySize(): number {
      return this.panelHistory.length
    },
    currHistory(): string {
      return this.panelHistory[this.historySize - 1]
    },
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    selectedLayerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    whiteTheme(): boolean {
      const whiteThemePanel = [
        'bleed', 'replace', 'crop', 'bgRemove', 'position', 'flip',
        'opacity', 'order', 'fonts', 'font-size', 'text-effect',
        'font-format', 'font-spacing', 'download', 'more', 'color',
        'adjust', 'photo-shadow', 'resize', 'object-adjust', 'brand-list', 'copy-style',
        'multiple-select', 'remove-bg']
      return this.extraPanel !== '' || whiteThemePanel.includes(this.currActivePanel)
    },
    noPaddingTheme(): boolean {
      return this.extraPanel === '' &&
        ['brand-list', 'text-effect'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return [
        'bleed', 'crop', 'bgRemove', 'position', 'flip', 'opacity',
        'order', 'font-size', 'font-format',
        'font-spacing', 'more', 'object-adjust', 'brand-list', 'multiple-select'].includes(this.currActivePanel)
    },
    hideFooter(): boolean {
      return ['download'].includes(this.currActivePanel)
    },
    extraFixSizeCondition(): boolean { // For panel that fix in some condition
      switch (this.currActivePanel) {
        default: {
          return false
        }
      }
    },
    halfSizeInInitState(): boolean {
      return this.extraPanel !== '' || ['fonts', 'adjust', 'photo-shadow', 'color', 'text-effect'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        case 'copy-style': {
          return `${this.$t('NN0809')}`
        }
        case 'multiple-select': {
          return `${this.$t('NN0657')}`
        }
        case 'remove-bg': {
          return `${this.$t('NN0043')}`
        }
        case 'none': {
          return ''
        }
        default: {
          return ''
        }
      }
    },
    showRightBtn(): boolean {
      if (this.currActivePanel === 'download') {
        return (this.historySize < 2) && !['polling', 'downloaded'].includes(this.currHistory)
      }
      return this.currActivePanel !== 'none'
    },
    showLeftBtn(): boolean {
      if (this.currActivePanel === 'download' && ['polling', 'downloaded', 'setting'].includes(this.currHistory)) return false
      return this.bgRemoveMode || (this.whiteTheme && (this.panelHistory.length > 0 || this.extraPanel))
    },
    hideDynamicComp(): boolean {
      return ['crop', 'copy-style', 'multiple-select'].includes(this.currActivePanel)
    },
    noRowGap(): boolean {
      return ['crop', 'color', 'copy-style', 'multiple-select', 'remove-bg',
        'text-effect'].includes(this.currActivePanel)
    },
    panelStyle(): { [index: string]: string } {
      const isSidebarPanel = ['template', 'photo', 'object', 'background', 'text', 'file', 'fonts'].includes(this.currActivePanel)
      const footerTabsHeight = this.footerTabsRef?.clientHeight || 0
      return Object.assign({ bottom: this.hideFooter ? -1 * footerTabsHeight + 'px' : '0' },
      (this.isSubPanel ? { bottom: '0', position: 'absolute', zIndex: '100' } : {}) as { [index: string]: string },
      {
        'row-gap': this.noRowGap ? '0px' : '10px',
        backgroundColor: this.whiteTheme ? 'white' : '#2C2F43',
        maxHeight: this.fixSize || this.extraFixSizeCondition
          ? '100%' : this.panelDragHeight + 'px',
        ...(this.hideFooter && { zIndex: '100' }),
        ...(this.hideFooter && { paddingBottom: `${this.userInfo.homeIndicatorHeight + 8}px` })
      },
      // Prevent MobilePanel collapse
      isSidebarPanel ? { height: `calc(100% - ${this.userInfo.statusBarHeight}px)` } : {},
      )
    },
    innerTab(): string {
      return this.innerTabs.key[this.innerTabIndex]
    },
    innerTabs(): Record<string, string[]> {
      const panelReplace = {
        key: ['photo', 'file'],
        label: [this.$tc('NN0002', 2), this.$tc('NN0006')]
      }

      if (this.extraPanel === 'replace') {
        return panelReplace
      }
      switch (this.currActivePanel) {
        case 'replace':
          return panelReplace
        default:
          return {
            key: ['']
          }
      }
    },
    dynamicBindIs(): string {
      switch (this.extraPanel) {
        case 'color':
          return 'panel-color'
        case 'replace':
          return `panel-${this.innerTab}`
      }

      switch (this.currActivePanel) {
        case 'replace':
          return `panel-${this.innerTab}`
        case 'none':
          return ''
        default:
          return `panel-${this.currActivePanel}`
      }
    },
    dynamicBindProps(): { [index: string]: any } {
      if (this.extraPanel === 'color') {
        return {
          currEvent: this.extraColorEvent,
          panelHistory: this.panelHistory
        }
      }

      switch (this.currActivePanel) {
        case 'fonts': {
          return {
            showTitle: false
          }
        }
        case 'download': {
          return {
            hideContainer: true,
            pageIndex: pageUtils.currFocusPageIndex,
            panelHistory: this.panelHistory
          }
        }
        case 'text-effect': {
          return {
            panelHistory: this.panelHistory
          }
        }
        case 'color': {
          return {
            panelHistory: this.panelHistory
          }
        }
        case 'brand-list': {
          const brandDefaultVal = {
            panelHistory: this.panelHistory
          }
          if (editorUtils.currActivePanel === 'text') {
            return {
              defaultOption: true
            }
          }
          if (editorUtils.currActivePanel === 'brand') {
            return {
              hasAddBrand: true
            }
          }
          return brandDefaultVal
        }
        case 'brand': {
          return {
            maxheight: this.panelParentHeight()
          }
        }
        case 'more': {
          return {
            panelHistory: this.panelHistory
          }
        }
        default: {
          return {}
        }
      }
    },
    dynamicBindMethod(): { [index: string]: any } {
      const pushHistory = (history: string) => {
        this.panelHistory.push(history)
      }
      const openExtraColorModal = (colorEventType: ColorEventType, initColorPanelType: MobileColorPanelType) => {
        this.extraPanel = 'color'
        this.extraColorEvent = colorEventType
        this.panelHistory.push(initColorPanelType)
      }
      const openExtraPanelReplace = (replaceImg: (img: IAssetPhoto | IPhotoItem) => void) => {
        this.extraPanel = 'replace'
        this.replaceImg = replaceImg
        this.panelHistory.push('replace')
      }
      switch (this.currActivePanel) {
        case 'color':
        case 'more':
          return { pushHistory }
        case 'background':
          return { openExtraColorModal }
        case 'text-effect':
          return { pushHistory, openExtraColorModal, openExtraPanelReplace }
        case 'photo-shadow':
          return { pushHistory, openExtraColorModal }
        case 'download':
        case 'brand-list':
          return {
            pushHistory,
            back: () => {
              this.panelHistory.pop()
            },
            'update:panelHistory': (val: string) => {
              this.panelHistory = [val]
            }
          }
        default:
          return {}
      }
    },
    leftBtnName(): string {
      return this.bgRemoveMode ? 'close-circle' : 'back-circle'
    },
    rightBtnName(): string {
      if (this.currActivePanel === 'download') {
        return 'close-circle'
      } else if (this.bgRemoveMode || (this.panelHistory.length > 0 && this.currActivePanel !== 'brand-list') || ['crop'].includes(this.currActivePanel)) {
        return 'check-mobile-circle'
      } else {
        return 'close-circle'
      }
    },
    leftButtonAction(): () => void {
      if (this.bgRemoveMode) {
        return () => {
          bgRemoveUtils.cancel()
        }
      }

      const colorHandler = () => {
        if (this.extraPanel === 'color' || this.currActivePanel === 'color') {
          if (this.panelHistory[this.panelHistory.length - 1] === 'color-picker') {
            this.addRecentlyColors(colorUtils.currColor)
          }
        }
      }
      if (this.extraPanel === 'color') {
        return () => {
          colorHandler()
          this.extraPanel = ''
          this.panelHistory.pop()
        }
      }
      if (this.extraPanel === 'replace') {
        return () => {
          this.extraPanel = ''
          this.panelHistory.pop()
        }
      }
      if (this.panelHistory.length > 0) {
        return () => {
          colorHandler()
          this.panelHistory.pop()
        }
      } else {
        return () => {
          colorHandler()
          this.closeMobilePanel()
        }
      }
    },
    rightButtonAction(): () => void {
      return () => {
        switch (this.currActivePanel) {
          case 'crop': {
            if (this.selectedLayerNum > 0) {
              if (imageUtils.isImgControl()) {
                imageUtils.setImgControlDefault()
              } else {
                let index
                switch (layerUtils.getCurrLayer.type) {
                  case 'image':
                    layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
                    break
                  case 'frame':
                    index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image')
                    if (index >= 0) {
                      frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                    }
                    break
                }
              }
            } else if (this.inBgSettingMode) {
              if (this.backgroundLocked) return this.handleLockedNotify()
              this.setBgImageControl({
                pageIndex: pageUtils.currFocusPageIndex,
                imgControl: false
              })
            }
            break
          }

          case 'copy-style': {
            formatUtils.clearCopiedFormat()
            break
          }

          case 'multiple-select': {
            if (this.inMultiSelectionMode) {
              editorUtils.setInMultiSelectionMode(false)
            }
            break
          }
          case 'remove-bg': {
            if (this.bgRemoveMode) {
              bgRemoveUtils.save()
            }
            break
          }

          case 'color': {
            if (this.panelHistory[this.panelHistory.length - 1] === 'color-picker') {
              this.addRecentlyColors(colorUtils.currColor)
            }
            break
          }
        }
        if (this.extraPanel === 'color') {
          this.addRecentlyColors(colorUtils.currColor)
        }
        this.closeMobilePanel()
      }
    }
  },
  watch: {
    selectedLayerNum(newVal: number) {
      if (newVal === 0) {
        editorUtils.setInMultiSelectionMode(false)
      }
    },
    currActivePanel(newVal, oldVal) {
      this.panelHistory = []
      this.innerTabIndex = 0
      // Use v-show to show MobilePanel will cause
      // mounted not triggered, use watch to reset height.
      if (oldVal === 'none') { // Prevent reset height when switch panel
        this.panelDragHeight = newVal === 'none' ? 0 : this.initPanelHeight()
      }
    },
    showMobilePanel(newVal) {
      if (!newVal) {
        this.extraPanel = ''
      }
    }
  },
  mounted() {
    this.panelDragHeight = this.currActivePanel === 'none'
      ? 0 : this.initPanelHeight()
    this.resizeObserver = new ResizeObserver(() => {
      this.$emit('panelHeight', this.currPanelHeight())
      // No fit page in mobile now
      // Prevent fitPage when full size panel open, ex: SidebarPanel
      // if (this.fixSize || this.panelDragHeight !== this.panelParentHeight()) {
      //   this.fitPage()
      // }
    })
    this.resizeObserver.observe(this.$refs.panel as Element)
  },
  beforeUnmount() {
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  methods: {
    ...mapMutations({
      setBgImageControl: 'SET_backgroundImageControl',
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel'
    }),
    ...mapActions({
      fetchPalettes: 'brandkit/fetchPalettes',
      initRecentlyColors: 'color/initRecentlyColors',
      addRecentlyColors: 'color/addRecentlyColors'
    }),
    vcoConfig() {
      return {
        handler: (e: Event) => {
          if (!this.isImgCtrl && !this.isBgImgCtrl && !this.inMultiSelectionMode && !this.bgRemoveMode) {
            this.closeMobilePanel()
          }
        },
        middleware: this.middleware,
        events: ['touchstart', 'pointerdown',
          ...window.location.host === 'localhost:8080' ? [] : ['contextmenu']]
      }
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      return !(target.matches('.header-bar .panel-icon *') || // Skip header-bar icon
        target.matches('.modal-container, .modal-container *') || // Skip modal-card
        target.className.includes?.('footer-tabs') || // Skip footer-bar icon
        target.className === 'inputNode'
      )
    },
    closeMobilePanel() {
      if (this.isSubPanel) editorUtils.setCurrActiveSubPanel('none')
      else editorUtils.setShowMobilePanel(false)
    },
    haederbarHeight () {
      return document.querySelector('.mobile-editor .header-bar')?.clientHeight ?? 0
    },
    initPanelHeight() {
      if (this.halfSizeInInitState) return this.panelParentHeight() * 0.5
      else return this.panelParentHeight() - (this.haederbarHeight() + 30)
    },
    currPanelHeight() {
      return (this.$refs.panel as HTMLElement).clientHeight
    },
    panelParentHeight() {
      return (document.querySelector('.mobile-editor .mobile-editor__top') as HTMLElement).clientHeight -
        this.userInfo.statusBarHeight
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      if (this.fixSize) {
        return
      }
      this.isDraggingPanel = true
      this.lastPointerY = event.clientY
      this.panelDragHeight = this.currPanelHeight()
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelDragHeight -= event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      const panelParentHeight = this.panelParentHeight()
      if (this.panelDragHeight < panelParentHeight * 0.25) {
        this.closeMobilePanel()
      } else if (this.panelDragHeight >= panelParentHeight * 0.75) {
        this.panelDragHeight = panelParentHeight - (this.haederbarHeight() + 30)
        this.$emit('panelHeight', this.panelDragHeight + 30) // 30 = 15 padding * 2
      } else {
        this.panelDragHeight = panelParentHeight * 0.5
        this.$emit('panelHeight', this.panelDragHeight + 30)
      }

      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    },
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActiveSubPanel === panelType) {
        this.setCurrActiveSubPanel('none')
      } else {
        this.setCurrActiveSubPanel(panelType)
        if (props) {
          if (panelType === 'color' && props.currColorEvent) {
            this.currSubColorEvent = props.currColorEvent
          }
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;
  box-shadow: 0px -2px 5px rgba(60, 60, 60, 0.1);

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &__top-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    &.self-padding {
      padding: 15px;
      padding-bottom: 0;
      box-sizing: border-box;
    }
    > div:nth-child(2) {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .tabs {
    margin-bottom: 14px;
  }

  &__btn {
    display: grid; // To fix div height != child height issue. https://stackoverflow.com/questions/5804256
    position: relative;
  }

  &__btn-click-zone {
    position: absolute;
    width: 28px;
    height: 28px;
    top: 0;
    left: 0;
    transform: translate(-4px, -4px);
    border-radius: 50%;
    touch-action: manipulation;
  }

  &__bottom-section {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-auto-columns: minmax(0, 1fr);
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    @include no-scrollbar;
    > *:last-child { // panel-* always take minmax(0, 1fr) grid layout.
      grid-row: 2 / 3;
    }
  }

  &__title {
    @include flexCenter();
    font-weight: bold;
  }

  &__layer-num {
    @include size(20px);
    @include flexCenter();
    background-color: setColor(blue-1);
    border-radius: 50%;
  }

  &__drag-bar {
    position: absolute;
    touch-action: manipulation;
    top: 2px;
    // 47 = 15 (MobilePanel margin)
    //    + 12 (half of gray-4 div width)
    //    + 20 (left/right btn)
    padding: 10px calc(50% - 47px);
    border-radius: 5px;
    > div {
      background-color: setColor(gray-4);
      height: 3px;
      width: 24px;
    }
  }
}
</style>
