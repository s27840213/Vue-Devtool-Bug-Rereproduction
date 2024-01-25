<template lang="pug">
div(v-show="!hideMobilePanel"
    class="mobile-panel"
    :class="{'panel-padding': !noPaddingTheme, 'not-rounded': noRoundTheme, 'at-bottom': bottomTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(v-if="!hideTopSection" class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme}")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': hideDragBar}"
      @pointerdown.stop="dragPanelStart"
      @touchstart.stop="disableTouchEvent")
        div
    div(v-if="showLeftBtn || showRightBtn || panelTitle")
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="[{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn, 'insert': insertTheme}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="insertTheme ? '32px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-left': insertTheme}"
          @pointerdown.stop="leftButtonAction"
          @touchstart.stop="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="currActivePanel === 'multiple-select'" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="[{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn, 'insert': insertTheme}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="insertTheme ? '24px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-right': insertTheme}"
          @pointerdown.stop="rightButtonAction"
          @touchstart.stop="disableTouchEvent")
  div(class="mobile-panel__bottom-section" :style="`overflow-y: ${overflowY}`")
    tabs(v-if="innerTabs.label" theme="light"
      :tabs="innerTabs.label" v-model="innerTabIndex")
    keep-alive(:include="keepAlivePanels")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="dynamicBindIs && !isShowPagePreview && !hideDynamicComp"
        class="border-box"
        :class="{'p-2': $isPic}"
        :is="dynamicBindIs"
        :key="dynamicBindIs"
        :currPage="currPage"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel")
  transition(name="panel-up")
    mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
      :currActivePanel="currActiveSubPanel"
      :isSubPanel="true"
      :currPage="currPage"
      @switchTab="switchTab"
      @close="closeMobilePanel")
</template>

<script lang="ts">
import Tabs from '@/components/Tabs.vue'
import i18n from '@/i18n'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import { ICurrSelectedInfo, IFooterTabProps } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import pageUtils from '@/utils/pageUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

type IExtraPanelName = '' | 'color' | 'replace'

export default defineComponent({
  name: 'mobile-panel',
  emits: ['panelHeight', 'switchTab'],
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
  components: {
    Tabs,
  },
  directives: {
    clickOutside: vClickOutside.directive
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
      innerTabIndex: 0,
      resizeObserver: null as unknown as ResizeObserver,
      // eslint-disable-next-line vue/no-unused-properties
      keepAlivePanels: [] as string[],
      noPaddingPanels: [] as string[],
      whiteThemePanels: [] as string[],
      fixSizePanels: [] as string[],
      hideDynamicCompPanels: [] as string[],
      noRowGapPanels: [] as string[],
      hideFooterPanels: [] as string[],
      hideMobilePanelPanels: [] as string[],
    }
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
      userInfo: 'webView/getUserInfo',
      inBrowserMode: 'webView/getInBrowserMode'
    }),
    historySize(): number {
      return this.panelHistory.length
    },
    // will be used in extending component
    // eslint-disable-next-line vue/no-unused-properties
    currHistory(): string {
      return this.panelHistory[this.historySize - 1]
    },
    // eslint-disable-next-line vue/no-unused-properties
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    selectedLayerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    whiteTheme(): boolean {
      if (this.whiteThemePanelExceptions) return false
      return this.extraPanel !== '' || this.whiteThemePanels.includes(this.currActivePanel) || this.whiteThemeConditions
    },
    whiteThemePanelExceptions(): boolean {
      // defines exceptions that panel name is in whiteThemePanels, but shuld not use whiteTheme
      return false
    },
    whiteThemeConditions(): boolean {
      // defines complicated conditions that whiteTheme should be used in
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    noPaddingTheme(): boolean {
      return (this.extraPanel === '' && this.noPaddingPanels.includes(this.currActivePanel)) || this.$isCm
    },
    // eslint-disable-next-line vue/no-unused-properties
    hideDragBar(): boolean {
      return this.panelTitle !== ''
    },
    hideTopSection(): boolean {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    bottomTheme(): boolean {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    noRoundTheme(): boolean {
      return false
    },
    halfSizeInInitState(): boolean {
      return this.extraPanel !== '' || ['fonts', 'adjust', 'photo-shadow', 'color', 'text-effect'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      return ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    insertTheme(): boolean {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    showRightBtn(): boolean {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    showLeftBtn(): boolean {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    hideDynamicComp(): boolean {
      return this.hideDynamicCompPanels.includes(this.currActivePanel)
    },
    noRowGap(): boolean {
      return this.noRowGapPanels.includes(this.currActivePanel)
    },
    hideFooter(): boolean {
      return this.hideFooterPanels.includes(this.currActivePanel)
    },
    panelBg(): string {
      return 'black'
    },
    specialPanelStyle(): { [index: string]: string } {
      return {}
    },
    // eslint-disable-next-line vue/no-unused-properties
    panelStyle(): { [index: string]: string } {
      const isSidebarPanel = ['template', 'photo', 'object', 'background', 'text', 'file', 'fonts', 'template-content', 'replace'].includes(this.currActivePanel)
      const footerTabsHeight = this.footerTabsRef?.clientHeight || 0
      return Object.assign({ bottom: this.hideFooter ? -1 * footerTabsHeight + 'px' : '0' },
        (this.isSubPanel ? { bottom: '0', position: 'absolute', zIndex: '100' } : {}) as { [index: string]: string },
        {
          'row-gap': this.noRowGap ? '0px' : '10px',
          backgroundColor: this.whiteTheme ? 'white' : this.panelBg,
          maxHeight: this.fixSize() ? '100%'
            : Math.min(this.panelDragHeight, this.panelParentHeight()) + 'px',
          ...(this.hideFooter && { zIndex: '100' }),
          ...(this.hideFooter && { paddingBottom: `${this.userInfo.homeIndicatorHeight + 8}px` })
        },
        // Prevent MobilePanel collapse
        isSidebarPanel ? { height: `calc(100% - ${this.userInfo.statusBarHeight}px)` } : {},
        // If no top section, overwrite grid-template-rows to prevent row-gap appear.
        this.hideTopSection ? { gridTemplateRows: 'minmax(0, 1fr)' } : {},
        this.specialPanelStyle,
      )
    },
    // eslint-disable-next-line vue/no-unused-properties
    innerTab(): string {
      return this.innerTabs.key[this.innerTabIndex]
    },
    innerTabs(): Record<string, string[]> {
      return {
        key: ['']
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindIs(): string {
      return ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindProps(): { [index: string]: unknown } {
      return {}
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: unknown } {
      return {}
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftBtnName(): string {
      return ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    rightBtnName(): string {
      return ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    leftButtonAction(): () => void {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}
    },
    // eslint-disable-next-line vue/no-unused-properties
    rightButtonAction(): () => void {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}
    },
    overflowY(): string {
      return this.insertTheme || this.fixSize() ? 'hidden' : 'scroll'
    },
    hideMobilePanel(): boolean {
      return this.hideMobilePanelPanels.includes(this.currActivePanel)
    },
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
      // Reset the panel height when switching panels, except when both panels are not fixed size.
      const bothAreNonFixSize = !this.fixSize(newVal) && !this.fixSize(oldVal)
      if (oldVal === 'none' || !bothAreNonFixSize) {
        this.panelDragHeight = newVal === 'none' ? 0 : this.initPanelHeight()
      }
    },
    showMobilePanel(newVal) {
      if (!newVal) {
        // Reset extraPanel after panel close animation
        setTimeout(() => {
          this.extraPanel = ''
        }, 1000)
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
      setCurrActiveSubPanel: 'mobileEditor/SET_currActiveSubPanel'
    }),
    notKeepPanel(): boolean {
      return true
    },
    // eslint-disable-next-line vue/no-unused-properties
    vcoConfig() {
      return {
        handler: () => {
          if (this.notKeepPanel()) {
            this.closeMobilePanel()
          }
        },
        middleware: this.middleware,
        events: ['touchstart', 'pointerdown',
          ...window.location.host.startsWith('localhost') ? [] : ['contextmenu']]
      }
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    middlewareCondition(target: HTMLElement): boolean {
      return false
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      return !(target.matches?.('.header-bar .panel-icon *') || // Skip header-bar icon
        target.matches?.('.modal-container, .modal-container *') || // Skip modal-card
        target.className.includes?.('footer-tabs') || // Skip footer-bar icon
        target.matches?.('.full-page *') || // Skip full-page popup, like payment in stk/cm.
        target.className === 'inputNode' ||
        this.middlewareCondition(target)
      )
    },
    closeMobilePanel() {
      if (this.isSubPanel) editorUtils.setCurrActiveSubPanel('none')
      else editorUtils.setShowMobilePanel(false)
    },
    headerbarHeight() {
      return document.querySelector('.mobile-editor .header-bar')?.clientHeight ?? 0
    },
    fixSize(panel = null as string | null): boolean {
      if (panel === null) panel = this.currActivePanel
      return this.fixSizePanels.includes(panel)
    },
    initPanelHeight() {
      const parentElementHeight = this.panelParentHeight()
      if (this.halfSizeInInitState) return parentElementHeight * 0.5
      return parentElementHeight - (this.headerbarHeight() + 30)
    },
    currPanelHeight() {
      return (this.$refs.panel as HTMLElement).clientHeight
    },
    _panelParentHeight() {
      return 0
    },
    panelParentHeight() {
      return this._panelParentHeight() - this.userInfo.statusBarHeight
    },
    // eslint-disable-next-line vue/no-unused-properties
    dragPanelStart(event: MouseEvent | PointerEvent) {
      if (this.fixSize()) {
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
        this.panelDragHeight = panelParentHeight - (this.headerbarHeight() + 30)
        this.$emit('panelHeight', this.panelDragHeight + 30) // 30 = 15 padding * 2
      } else {
        this.panelDragHeight = panelParentHeight * 0.5
        this.$emit('panelHeight', this.panelDragHeight + 30)
      }

      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
    },
    // eslint-disable-next-line vue/no-unused-properties
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    },
    // eslint-disable-next-line vue/no-unused-properties
    switchTab(panelType: string, props?: IFooterTabProps) {
      if (this.currActiveSubPanel === panelType) {
        this.setCurrActiveSubPanel('none')
      } else {
        this.setCurrActiveSubPanel(panelType)
        if (props) {
          if (panelType === 'color' && props.currColorEvent) {
            colorUtils.setCurrEvent(props.currColorEvent as string)
          }
        }
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    getBasicBindMethods() {
      const pushHistory = (history: string) => {
        this.panelHistory.push(history)
      }
      const leaveExtraPanel = () => {
        this.extraPanel = ''
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
      return { pushHistory, leaveExtraPanel, openExtraColorModal, openExtraPanelReplace }
    },
  }
})
</script>

<style lang="scss">
.mobile-panel {
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;
  @include pic {
    box-shadow: 0px -2px 5px rgba(60, 60, 60, 0.1);
  }
  @include stk {
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.3);
  }
  @include cm {
    position: relative;
    z-index: unset;
  }
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &.not-rounded {
    border-radius: 0;
  }

  &.panel-padding {
    padding: 16px;
  }

  &.at-bottom {
    z-index: setZindex(mobile-panel-bottom);
  }

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

  &__left-btn.insert {
    transform: translate(-2px, -6px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__right-btn.insert {
    transform: translate(-6px, -4px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
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
    &.insert-left {
      width: 32px;
      height: 32px;
      transform: none;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    &.insert-right {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  &__bottom-section {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-auto-columns: minmax(0, 1fr);
    width: 100%;
    height: 100%;
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
    @include setColors(blue-1, black-5) using ($color) {
      background-color: $color;
    }
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
      @include setColors(gray-4, black-4) using ($color) {
        background-color: $color;
      }
      height: 3px;
      width: 24px;
    }
  }
}
</style>
