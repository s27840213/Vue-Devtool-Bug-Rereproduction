import i18n from '@/i18n'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import { ICurrSelectedInfo, IFooterTabProps } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import editorUtils from '@/utils/editorUtils'
import eventUtils from '@/utils/eventUtils'
import pageUtils from '@/utils/pageUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

type IExtraPanelName = '' | 'color' | 'replace'

export default defineComponent({
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
    // eslint-disable-next-line vue/no-unused-properties
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    },
    footerTabsRef: {
      type: HTMLElement
    },
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
      currSubColorEvent: '',
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
      return this.extraPanel === '' && this.noPaddingPanels.includes(this.currActivePanel)
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
    fixSize(): boolean {
      return this.fixSizePanels.includes(this.currActivePanel)
    },
    extraFixSizeCondition(): boolean { // For panel that fix in some condition
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
          maxHeight: this.fixSize || this.extraFixSizeCondition
            ? '100%' : Math.min(this.panelDragHeight, this.panelParentHeight()) + 'px',
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
    dynamicBindProps(): { [index: string]: any } {
      return {}
    },
    // eslint-disable-next-line vue/no-unused-properties
    dynamicBindMethod(): { [index: string]: any } {
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
    middlewareCondition(): boolean {
      return false
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      return !(target.matches?.('.header-bar .panel-icon *') || // Skip header-bar icon
        target.matches?.('.modal-container, .modal-container *') || // Skip modal-card
        target.className.includes?.('footer-tabs') || // Skip footer-bar icon
        target.className === 'inputNode' ||
        this.middlewareCondition()
      )
    },
    closeMobilePanel() {
      if (this.isSubPanel) editorUtils.setCurrActiveSubPanel('none')
      else editorUtils.setShowMobilePanel(false)
    },
    headerbarHeight() {
      return document.querySelector('.mobile-editor .header-bar')?.clientHeight ?? 0
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
            this.currSubColorEvent = props.currColorEvent
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
