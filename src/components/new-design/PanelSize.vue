<template lang="pug">
div(class="mobile-panel p-15"
    :style="panelStyle"
    v-click-outside="closeMobilePanel"
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
import PageSizeSelector from '@/components/new-design/PageSizeSelector.vue'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'

import { ILayout } from '@/interfaces/layout'
import eventUtils from '@/utils/eventUtils'
import vClickOutside from 'click-outside-vue3'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'panel-size',
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PageSizeSelector
  },
  emits: ['close'],
  data() {
    return {
      panelTop: 0,
      panelPaddingBottom: window.innerHeight - window.visualViewport!.height,
      lastPointerY: 0,
      isDraggingPanel: false,
      selectedFormat: {} as ILayout,
      isConfirmClicked: false,
      isFullScreen: true,
      innerHeight: window.innerHeight,
      visualViewportHeight: window.visualViewport!.height
    }
  },
  computed: {
    ...mapState('design', [
      'currLocation',
      'folders'
    ]),
    ...mapGetters({
      userInfo: 'webView/getUserInfo'
    }),
    panelStyle(): { [index: string]: string } {
      return Object.assign(
        {
          'row-gap': '10px',
          backgroundColor: 'white',
          top: this.panelTop + this.userInfo.statusBarHeight + 'px',
          paddingBottom: (this.panelPaddingBottom + this.userInfo.homeIndicatorHeight + this.userInfo.statusBarHeight + 15) + 'px'
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
        designUtils.newDesignWithLoginRedirect(this.selectedFormat.width, this.selectedFormat.height, this.selectedFormat.unit, undefined, path, foldername)
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    window.visualViewport!.addEventListener('resize', this.handleVisualViewportResize)
    window.visualViewport!.addEventListener('scroll', this.handleVisualViewportScroll)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.visualViewport!.removeEventListener('resize', this.handleVisualViewportResize)
    window.visualViewport!.removeEventListener('scroll', this.handleVisualViewportScroll)
  },
  methods: {
    selectFormat(layout: ILayout) {
      this.selectedFormat = layout
    },
    closeMobilePanel() {
      this.$emit('close')
    },
    dragPanelStart(event: MouseEvent | PointerEvent) {
      this.isDraggingPanel = true
      this.lastPointerY = event.clientY
      eventUtils.addPointerEvent('pointermove', this.dragingPanel)
      eventUtils.addPointerEvent('pointerup', this.dragPanelEnd)
    },
    dragingPanel(event: MouseEvent | PointerEvent) {
      this.panelTop += event.clientY - this.lastPointerY
      this.panelPaddingBottom += event.clientY - this.lastPointerY
      this.lastPointerY = event.clientY
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      const panelTopOffset = window.visualViewport!.offsetTop
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

      eventUtils.removePointerEvent('pointermove', this.dragingPanel)
      eventUtils.removePointerEvent('pointerup', this.dragPanelEnd)
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleVisualViewportScroll() {
      this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight + this.panelTop - window.visualViewport!.offsetTop
    },
    handleResize() {
      this.innerHeight = window.innerHeight
    },
    handleVisualViewportResize() {
      const dTop = window.visualViewport!.height - this.visualViewportHeight
      // push panel up when keyboard shows
      // if (dTop < 0) { this.panelTop += dTop }

      // expand panel down when keyboard hides
      if (dTop > 0) { this.panelPaddingBottom = Math.max(this.panelTop, this.panelPaddingBottom - dTop) }

      this.visualViewportHeight = window.visualViewport!.height
      if (this.panelTop < window.visualViewport!.offsetTop || this.isFullScreen) {
        this.panelTop = window.visualViewport!.offsetTop
        this.panelPaddingBottom = this.innerHeight - this.visualViewportHeight
        this.isFullScreen = true
      } else {
        // push panel up to 50% visual viewport height if inputs covered by keyboard
        const panelVisualHieght = this.visualViewportHeight - this.panelTop - this.panelPaddingBottom
        if (panelVisualHieght < this.visualViewportHeight * 0.25) {
          this.panelTop = this.visualViewportHeight * 0.5 + window.visualViewport!.offsetTop
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
