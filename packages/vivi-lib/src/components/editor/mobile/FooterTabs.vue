<template lang="pug">
div(class="footer-tabs")
  div(class="footer-tabs__content" :style="contentStyles")
    div(class="footer-tabs__container"
        :class="{main: !isInEditor}"
        :style="containerStyles()"
        @scroll.passive="updateContainerOverflow"
        ref="container")
      template(v-for="tab in homeTabs" :key="tab.icon")
        div(v-if="!tab.hidden"
            class="footer-tabs__item"
            :class="{'click-disabled': (tab.disabled || isLocked)}"
            @click="handleTabAction(tab)")
          color-btn(v-if="tab.icon === 'color'" size="22px"
                    class="click-disabled"
                    :color="globalSelectedColor")
          svg-icon(v-else class="click-disabled"
            :iconName="tab.icon"
            :iconColor="homeTabColor(tab)"
            :iconWidth="'24px'"
            :style="textIconStyle")
          span(class="no-wrap click-disabled text-capitalize"
            :class="`text-${homeTabColor(tab)}`") {{tab.text}}
          pro-item(v-if="tab.forPro" :theme="'top-right-corner'" draggable="false" :style="{right: 'unset', transform: 'translateX(100%)'}")
    transition(name="panel-up")
      div(v-if="isSettingTabsOpen" class="footer-tabs__sub-tabs" :style="subTabStyles()")
        div(class="footer-tabs__unfold"
            :style="innerContainerStyles"
            @click="handleTabAction(mainMenu)")
          svg-icon(class="click-disabled"
            :iconName="mainMenu.icon"
            :iconColor="mainMenu.color"
            :iconWidth="'24px'"
            :style="textIconStyle")
        div(class="footer-tabs__container"
            :style="containerStyles(true)"
            @scroll.passive="updateContainerOverflow" ref="sub-container")
          template(v-for="(tab) in settingTabs")
            div(v-if="!tab.hidden" :key="tab.icon"
                class="footer-tabs__item"
                :class="{'click-disabled': (tab.disabled || isLocked || extraDisableCondition(tab))}"
                @click="handleTabAction(tab)")
              color-btn(v-if="tab.icon === 'color'" size="22px"
                        class="click-disabled"
                        :color="globalSelectedColor")
              svg-icon(v-else class="click-disabled"
                :iconName="tab.icon"
                :iconColor="settingTabColor(tab)"
                :iconWidth="'24px'"
                :style="textIconStyle")
              span(class="no-wrap click-disabled"
                :class="`text-${settingTabColor(tab)}`") {{tab.text}}
              pro-item(v-if="tab.forPro" :theme="'top-right-corner'" draggable="false")
</template>

<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import ProItem from '@/components/payment/ProItem.vue'
import i18n from '@/i18n'
import { ICurrSelectedInfo, IFooterTab } from '@/interfaces/editor'
import { AllLayerTypes, IFrame, IGroup, IImage, ILayer } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import formatUtils from '@/utils/formatUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import shapeUtils from '@/utils/shapeUtils'
import { notify } from '@kyvg/vue3-notification'
import { isEqual } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    ColorBtn,
    ProItem,
  },
  props: {
    currTab: {
      default: 'none',
      type: String
    },
    // eslint-disable-next-line vue/no-unused-properties
    inAllPagesMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const mainMenu = { icon: 'unfold', color: 'blue-1' }

    return {
      mainMenu,
      // eslint-disable-next-line vue/no-unused-properties
      isFontsPanelOpened: false,
      disableTabScroll: false,
      leftOverflow: false,
      rightOverflow: false,
      clickedTab: '',
      // eslint-disable-next-line vue/no-unused-properties
      clickedTabTimer: -1,
      isSvgImage: false,
    }
  },
  computed: {
    ...mapState('mobileEditor', { mobilePanel: 'currActivePanel' }),
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode',
      isHandleShadow: 'shadow/isHandling',
      isUploadShadow: 'shadow/isUploading',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      hasCopiedFormat: 'getHasCopiedFormat',
      userInfo: 'webView/getUserInfo',
      isAdmin: 'user/isAdmin',
    }),
    isInEditor(): boolean {
      return true
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    isSettingTabsOpen(): boolean {
      return false
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    subActiveLayerIndex(): number {
      return layerUtils.subLayerIdx
    },
    subActiveLayer(): any {
      if (this.subActiveLayerIndex !== -1) {
        return (layerUtils.getCurrLayer as IGroup).layers[this.subActiveLayerIndex]
      }
      return undefined
    },
    subActiveLayerType(): string {
      const currLayer = layerUtils.getCurrLayer
      if (currLayer.type === 'group' && this.subActiveLayerIndex !== -1) {
        return (currLayer as IGroup).layers[this.subActiveLayerIndex].type
      }
      return ''
    },
    isCopyFormatDisabled(): boolean {
      if (this.selectedLayerNum === 1) { // not tmp
        const types = this.currSelectedInfo.types
        const currLayer = layerUtils.getCurrLayer
        if (types.has('group')) {
          if (this.subActiveLayerIndex !== -1) {
            if (['text', 'image'].includes(this.subActiveLayerType)) {
              return this.isLocked
            }
            if (this.subActiveLayerType === 'frame') {
              const frame = this.subActiveLayer as IFrame
              if (frame.clips.length === 1) {
                return this.isLocked
              }
            }
          }
        } else if (types.has('frame')) {
          const frame = currLayer as IFrame
          if (frame.clips.length === 1) {
            return this.isLocked
          } else {
            if (this.subActiveLayerIndex !== -1 && frame.clips[this.subActiveLayerIndex].type === 'image') {
              return this.isLocked
            }
          }
        } else {
          if (types.has('text') || types.has('image')) {
            return this.isLocked
          }
        }
      }
      return true
    },
    // eslint-disable-next-line vue/no-unused-properties
    backgroundImgControl(): boolean {
      return pageUtils.currFocusPage.backgroundImage.config?.imgControl ?? false
    },
    // eslint-disable-next-line vue/no-unused-properties
    backgroundLocked(): boolean {
      const { locked } = pageUtils.currFocusPage.backgroundImage.config
      return locked
    },
    mainTabsSize(): number {
      return 0
    },
    homeTabs(): Array<IFooterTab> {
      return []
    },
    settingTabs(): Array<IFooterTab> {
      return []
    },
    globalSelectedColor(): string {
      return colorUtils.globalSelectedColor.color
    },
    textIconStyle(): Record<string, string> {
      const textColor = colorUtils.globalSelectedColor.textColor
      return textColor === 'multi' ? {
        '--multi-text-color': '1' // For svg icon 'text-color-mobile.svg' rect fill multi-color
      } : {
        '--multi-text-color': '0',
        '--text-color': textColor // For svg icon 'text-color-mobile.svg' rect fill color
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    isWholeGroup(): boolean {
      /**
       * Select whole group and no sub-layer selected
       */
      return this.isGroup && this.groupTypes.size === 1 && layerUtils.subLayerIdx === -1
    },
    // eslint-disable-next-line vue/no-unused-properties
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return layerUtils.getSelectedLayer().locked
    },
    isGroup(): boolean {
      return layerUtils.getCurrLayer.type === LayerType.group
    },
    // eslint-disable-next-line vue/no-unused-properties
    isGroupOrTmp(): boolean {
      return (layerUtils.getCurrLayer.type === LayerType.tmp ||
      layerUtils.getCurrLayer.type === LayerType.group)
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer) => {
        return layer.type
      })
      return new Set(types)
    },
    // eslint-disable-next-line vue/no-unused-properties
    isInFrame(): boolean {
      const layer = layerUtils.getCurrLayer
      return layer.type === LayerType.frame && (layer as IFrame).clips[Math.max(layerUtils.subLayerIdx || 0, 0)].srcObj.assetId !== ''
    },
    contentEditable(): boolean {
      return this.currSelectedInfo.layers[0]?.contentEditable
    },
    customContentStyles(): { [index: string]: string }  {
      // used by extending class for their custom styles
      return {}
    },
    contentStyles(): { [index: string]: string }  {
      // should not be overridden, use customContentStyles to change styles instead
      return {
        transform: `translate(0,${this.contentEditable ? 100 : 0}%)`,
        opacity: `${this.contentEditable ? 0 : 1}`,
        ...this.customContentStyles
      }
    },
    innerContainerStyles(): { [index: string]: string } {
      return {
        paddingBottom: `${this.userInfo.homeIndicatorHeight + 8}px`
      }
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    // eslint-disable-next-line vue/no-unused-properties
    isLine(): boolean {
      return shapeUtils.isLine(this.currLayer as AllLayerTypes)
    },
    // eslint-disable-next-line vue/no-unused-properties
    isBasicShape(): boolean {
      return shapeUtils.isBasicShape(this.currLayer as AllLayerTypes)
    },
    // eslint-disable-next-line vue/no-unused-properties
    selectMultiple(): boolean {
      return this.selectedLayerNum > 1
    },
  },
  watch: {
    currSelectedLayers: {
      immediate: true,
      async handler() {
        const { layers, types } = this.currSelectedInfo as ICurrSelectedInfo
        if (types.has('image') && layers.length === 1) {
          const src = imageUtils.getSrc(layers[0] as IImage, 'tiny')
          const isSvg = await imageShadowPanelUtils.isSVG(src, layers[0] as IImage)
          this.isSvgImage = isSvg
        } else {
          this.isSvgImage = false
        }
      }
    },
    selectedLayerNum(newVal) {
      if (newVal === 0) {
        this.$emit('switchTab', 'none')
      }
    },
    tabs: {
      handler(newVal, oldVal) {
        if (this.disableTabScroll || isEqual(newVal, oldVal)) {
          this.disableTabScroll = false
          return
        }
        const elContainer = (this.isSettingTabsOpen ? this.$refs['sub-container'] : this.$refs.container) as HTMLElement
        if (elContainer) elContainer.scrollTo(0, 0)
        this.$nextTick(() => {
          this.updateContainerOverflow()
        })
      },
      deep: true
    },
    contentEditable(newVal) {
      if (newVal) {
        this.$emit('switchTab', 'none')
      }
    },
  },
  methods: {
    ...mapMutations({
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex',
      _setIsDragged: 'page/SET_IsDragged',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      setBgImageControl: 'SET_backgroundImageControl'
    }),
    extraDisableCondition(tab: IFooterTab): boolean {
      return tab.icon !== 'remove-bg' && this.inBgRemoveMode
    },
    updateContainerOverflow() {
      const elContainer = (this.isSettingTabsOpen ? this.$refs['sub-container'] : this.$refs.container) as HTMLElement
      if (!elContainer) return
      const { scrollLeft, scrollWidth, offsetWidth } = elContainer
      this.leftOverflow = scrollLeft > 0
      this.rightOverflow = scrollLeft + 0.5 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    },
    handleTabAction(tab: IFooterTab) {
      return false
    },
    // eslint-disable-next-line vue/no-unused-properties
    targetIs(type: string): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return this.subLayerType === type
        } else {
          return this.groupTypes.has(type)
        }
      } else {
        // if (this.currSelectedInfo.types.has('frame') && type === 'image') {
        //   return this.isInFrame
        // }
        return this.currSelectedInfo.types.has(type)
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    singleTargetType(): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return true
        } else {
          return this.groupTypes.size === 1
        }
      } else {
        return this.currSelectedInfo.types.size === 1
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    tabActive(tab: IFooterTab): boolean {
      if (this.currTab === 'color') {
        return this.currTab === tab.panelType &&
          ((colorUtils.currEvent === 'setTextColor' && tab.icon === 'text-color-mobile') ||
          (colorUtils.currEvent !== 'setTextColor' && tab.icon === 'color'))
      } else return this.currTab === tab.panelType || this.clickedTab === tab.icon
    },
    // eslint-disable-next-line vue/no-unused-properties
    handleLockedNotify() {
      notify({ group: 'copy', text: i18n.global.tc('NN0804') })
    },
    // eslint-disable-next-line vue/no-unused-properties
    handleCopyFormat() {
      if (this.isCopyFormatDisabled) return
      const types = this.currSelectedInfo.types
      const layer = this.currSelectedInfo.layers[0]
      if (types.has('group')) {
        const type = this.subActiveLayerType
        const subLayer = this.subActiveLayer
        if (type === 'text') {
          formatUtils.copyTextFormat(subLayer)
        }
        if (type === 'image') {
          formatUtils.copyImageFormat(subLayer)
        }
        if (type === 'frame') {
          formatUtils.copyImageFormat(subLayer.clips[0])
        }
      } else {
        if (types.has('text')) {
          formatUtils.copyTextFormat(layer)
        }
        if (types.has('image')) {
          formatUtils.copyImageFormat(layer)
        }
        if (types.has('frame')) {
          formatUtils.copyImageFormat(layer.clips[Math.max(0, this.subActiveLayerIndex)])
        }
      }
    },
    homeTabColor(icon: IFooterTab): string {
      return ''
    },
    settingTabColor(icon: IFooterTab): string {
      return ''
    },
    customContainerStyles(isSubContainer: boolean): { [index: string]: string } {
      // used by extending class for their custom styles
      return {}
    },
    containerStyles(isSubContainer = false): { [index: string]: string } {
      // should not be overridden, use customContainerStyles to change styles instead
      return {
        ...(!isSubContainer && !this.isInEditor && { gridTemplateColumns: `repeat(${this.mainTabsSize}, 1fr)` }),
        ...this.innerContainerStyles,
        ...this.customContainerStyles(isSubContainer),
      }
    },
    subTabStyles(): { [index: string]: string } {
      return {}
    },
  }
})
</script>

<style lang="scss">
.footer-tabs {
  overflow: hidden;
  @include setColors(gray-5, black-2) using ($color) {
    background-color: $color;
  }
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  &__content {
    display: grid;
    grid-template-columns: auto 1fr;
    transition: transform 0.3s, opacity 0.4s;
  }

  &__unfold {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px 12px 0px 24px;
    z-index: 1;
  }

  &__container {
    grid-column: 2/2;
    overflow: scroll;
    display: grid;
    grid-template-rows: auto;
    grid-auto-flow: column;
    grid-auto-columns: 62px;
    padding: 8px 12px;
    @include no-scrollbar;
    &.main {
      overflow: hidden;
      display: grid;
      align-items: center;
    }
  }

  &__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0px 4px;
    & .color-btn {
      margin: 1px;
    }
    > span {
      transition: background-color 0.2s, color 0.2s;
      @include body-XXS;
      transform: scale(calc(10 / 12));
      line-height: 20px;
    }
  }

  &__sub-tabs {
    width: 100%;
    position: absolute;
    display: grid;
    grid-template-columns: auto 1fr;
  }
}
</style>
