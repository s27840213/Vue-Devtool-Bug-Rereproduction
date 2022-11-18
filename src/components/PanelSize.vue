<template lang="pug">
  div(class="mobile-panel p-15"
      :style="panelStyle"
      v-click-outside="vcoConfig()"
      ref="panel"
      @touchmove="handleTouchMove")
    div(class="mobile-panel__top-section self-padding")
      div(class="mobile-panel__drag-bar"
        @pointerdown="dragPanelStart"
        @touchstart="disableTouchEvent")
          div
      div
        div(class="mobile-panel__btn mobile-panel__left-btn")
          svg-icon(
            class="click-disabled"
            :iconName="leftBtnName"
            :iconColor="'white'"
            :iconWidth="'20px'")
          div(class="mobile-panel__btn-click-zone"
            @pointerdown="leftButtonAction"
            @touchstart="disableTouchEvent")
        div(class="mobile-panel__btn mobile-panel__right-btn")
          svg-icon(
            class="click-disabled"
            :iconName="rightBtnName"
            :iconColor="'white'"
            :iconWidth="'20px'")
          div(class="mobile-panel__btn-click-zone"
            @pointerdown="rightButtonAction"
            @touchstart="disableTouchEvent")
    div(class="mobile-panel__bottom-section")
      PageSizeSelector(:isMobile="true"
        :isValidate="isConfirmClicked"
        defaultFormat="custom"
        ref="pageSizeSelector"
        @select="selectFormat")
</template>
<script lang="ts">
import Vue from 'vue'
import designUtils from '@/utils/designUtils'
import PageSizeSelector from '@/components/mydesign/PageSizeSelector.vue'

import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import { ILayout } from '@/interfaces/layout'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import _ from 'lodash'

export default Vue.extend({
  name: 'panel-size',
  props: {
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PageSizeSelector
  },
  data() {
    return {
      panelHeight: 0,
      panelTop: 0,
      panelPaddingBottom: window.innerHeight - window.visualViewport.height,
      lastPointerY: 0,
      isDraggingPanel: false,
      // initHeightPx: window.innerHeight,
      // maxHeightPx: window.innerHeight,
      selectedFormat: {} as ILayout,
      isConfirmClicked: false,
      isFullScreen: true,
      innerHeight: window.innerHeight,
      visualViewportHeight: window.visualViewport.height
    }
  },
  computed: {
    ...mapState('design', [
      'currLocation',
      'folders'
    ]),
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode',
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    selectedLayerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    panelStyle(): { [index: string]: string } {
      return Object.assign(
        {
          'row-gap': '10px',
          backgroundColor: 'white',
          // maxHeight: this.panelHeight + 'px',
          // bottom: (this.innerHeight - this.visualViewportHeight) + 'px'
          top: this.panelTop + 'px',
          paddingBottom: (this.panelPaddingBottom + 15) + 'px'
        }
      )
    },
    leftBtnName(): string {
      return 'close-circle'
    },
    rightBtnName(): string {
      return 'check-mobile-circle'
    },
    leftButtonAction(): (e: PointerEvent) => void {
      return () => {
        this.closeMobilePanel()
      }
    },
    rightButtonAction(): () => void {
      return () => {
        this.isConfirmClicked = true
        if (!(this.$refs.pageSizeSelector as any).isFormatApplicable) return // TODO: disable submit button
        const path = this.$route.name === 'MyDesign' ? this.currLocation.split('/').slice(1).join(',') : undefined
        const foldername = this.$route.name === 'MyDesign' ? designUtils.search(this.folders, designUtils.makePath(this.currLocation))?.name : undefined
        designUtils.newDesignWithLoginRedirect(this.selectedFormat.width, this.selectedFormat.height, undefined, path, foldername)
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    window.visualViewport.addEventListener('resize', this.handleVisualViewportResize)
    window.visualViewport.addEventListener('scroll', this.handleVisualViewportScroll)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.visualViewport.removeEventListener('resize', this.handleVisualViewportResize)
    window.visualViewport.removeEventListener('scroll', this.handleVisualViewportScroll)
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
    selectFormat(layout: ILayout) {
      this.selectedFormat = layout
    },
    vcoConfig() {
      return {
        handler: this.closeMobilePanel,
        middleware: this.middleware,
        events: ['contextmenu', 'touchstart', 'pointerdown']
      }
    },
    keepPanel(target: HTMLElement): boolean {
      if (!target || target.id === 'app') return false
      // If target is modal or panel-icon, don't close Panel.
      else if (target.className.includes?.('modal')) return true
      else if (target.className.includes?.('panel-icon')) return true
      return this.keepPanel(target.parentNode as HTMLElement)
    },
    middleware(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as HTMLElement
      // If target is a Svg <use>, its class will be SVGAnimatedString obj.
      // Ignor its className check using optional chaining "?.includes()"
      return !(this.keepPanel(target) ||
        target.className.includes?.('footer-tabs') ||
        target.className === 'inputNode'
      )
    },
    closeMobilePanel() {
      this.$emit('close')
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      this.isDraggingPanel = true
      this.lastPointerY = event.clientY
      this.panelHeight = (this.$refs.panel as HTMLElement).clientHeight
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelHeight -= event.clientY - this.lastPointerY
      this.panelTop += event.clientY - this.lastPointerY
      this.panelPaddingBottom += event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      const panelTopOffset = window.visualViewport.offsetTop
      if (this.panelTop > this.visualViewportHeight * 0.75 + panelTopOffset) {
        this.closeMobilePanel()
      } else if (this.panelTop <= this.visualViewportHeight * 0.25 + panelTopOffset) {
        this.panelTop = panelTopOffset
        this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight
        this.isFullScreen = true
      } else {
        this.panelTop = this.visualViewportHeight * 0.5 + panelTopOffset
        this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight * 0.5
        this.isFullScreen = false
      }

      // const maxHeightPx = this.maxHeightPx
      // if (this.panelHeight < maxHeightPx * 0.25) {
      //   this.closeMobilePanel()
      // } else if (this.panelHeight >= maxHeightPx * 0.75) {
      //   this.panelHeight = maxHeightPx
      //   this.isFullScreen = true
      // } else {
      //   this.panelHeight = maxHeightPx * 0.5
      //   this.isFullScreen = false
      // }

      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleVisualViewportScroll() {
      console.log('handleVisualViewportScroll')
      this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight + this.panelTop - window.visualViewport.offsetTop
    },
    handleResize() {
      console.log('handleResize')
      this.innerHeight = window.innerHeight
    },
    handleVisualViewportResize() {
      console.log('handleVisualViewportResize', window.innerHeight, window.visualViewport.height, this.panelPaddingBottom)

      // this.visualViewportHeight = window.visualViewport.height
      // this.maxHeightPx = window.visualViewport.height
      // if (window.visualViewport.height < this.panelHeight || (window.visualViewport.height > this.panelHeight && this.isFullScreen)) {
      //   this.panelHeight = window.visualViewport.height
      //   this.isFullScreen = true
      // }

      const dTop = window.visualViewport.height - this.visualViewportHeight
      // push panel up when keyboard shows
      // if (dTop < 0) { this.panelTop += dTop }
      // expand panel down when keyboard hides
      if (dTop > 0) { this.panelPaddingBottom -= dTop }

      this.visualViewportHeight = window.visualViewport.height
      if (this.panelTop < window.visualViewport.offsetTop || this.isFullScreen) {
        this.panelTop = window.visualViewport.offsetTop
        this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight
        this.isFullScreen = true
      } else {
        // push panel up to 50% visual viewport height if inputs covered by keyboard
        const panelVisualHieght = this.visualViewportHeight - this.panelTop - this.panelPaddingBottom
        if (panelVisualHieght < this.visualViewportHeight * 0.25) {
          this.panelTop = this.visualViewportHeight * 0.5 + window.visualViewport.offsetTop
          this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight * 0.5
        }
      }
    },
    handleTouchMove(evt: Event) {
      evt.preventDefault()
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  height: 100%;
  width: 100%;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: setZindex(popup);
  border-radius: 10px 10px 0 0;
  box-shadow: 0px -2px 5px setColor(gray-4, 0.5);

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

  &__btn {
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
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    @include no-scrollbar;
  }

  &__inner-tab {
    margin: 15px 0 14px 0;
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
    padding: 10px 20px;
    border-radius: 5px;
    > div {
      background-color: setColor(gray-4);
      height: 3px;
      width: 24px;
    }
  }
}
</style>
