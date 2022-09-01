<template lang="pug">
  lazy-load(
      target=".mobile-editor__page-preview"
      :threshold="[0,1]"
      :minHeight="contentWidth"
      @loaded="handleLoaded")
    div(v-if="!allPageMode" :style="loadingStyle")
    div(v-else class="page-preview-page"
      :style="styles2"
      :class="`${type === 'full' ? 'full-height' : ''} page-preview_${index}`"
      ref="pagePreview")
      div(class="page-preview-page-content pointer"
          :style="styles"
          @click="clickPage"
          @dblclick="dbclickPage()"
          draggable="true",
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          ref="content")
        page-content(
          class="click-disabled"
          :style="contentScaleStyles"
          :config="config"
          :pageIndex="index"
          :contentScaleRatio="scaleRatio"
          :handleSequentially="true"
          :isPagePreview="true")
        div(class="page-preview-page__highlighter"
          :class="{'focused': currFocusPageIndex === index}"
          :style="hightlighterStyles")
        div(v-if="isMouseOver && showMoreBtn"
          class="page-preview-page-content-more"
          @click="toggleMenu()")
          svg-icon(class="pb-5"
            :iconName="'more_vertical'"
            :iconWidth="'25px'")
        div(v-if="isMenuOpen && currFocusPageIndex === index"
          class="menu"
          v-click-outside="closeMenu")
          template(v-for="menuItem in menuItems")
            div(class="menu-item"
              @click="handleMenuAction(menuItem.icon)")
              div(class="menu-item-icon")
                svg-icon(:iconName="menuItem.icon"
                  iconWidth="15px"
                  iconColor="gray-2")
              div(class="menu-item-text")
                span {{ menuItem.text }}
        div(v-if="type === 'panel'"
          class="page-preview-page-icon")
          span {{index+1}}
      div(class="page-preview-page__background"
        :style="styles")
      div(v-if="type === 'full'"
        class="page-preview-page-title")
        span(:style="{'color': currFocusPageIndex === index ? '#4EABA6' : '#000'}") {{index+1}}
</template>
<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapGetters, mapMutations, mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import StepsUtils from '@/utils/stepsUtils'
import editorUtils from '@/utils/editorUtils'
import LazyLoad from '@/components/LazyLoad.vue'

export default Vue.extend({
  props: {
    type: String,
    index: Number,
    config: {
      type: Object,
      required: true
    },
    showMoreBtn: {
      default: true,
      type: Boolean
    },
    target: {
      type: String,
      default: '.mobile-editor__page-preview'
    }
  },
  components: {
    PageContent: () => import('@/components/editor/page/PageContent.vue'),
    LazyLoad
  },
  data() {
    return {
      menuItems: [
        {
          icon: 'copy',
          text: i18n.t('NN0251')
        },
        {
          icon: 'trash',
          text: i18n.t('NN0034')
        }
      ],
      isMouseOver: false,
      isMenuOpen: false,
      contentWidth: 0,
      asyncTaskQueue: [] as unknown as Array<() => Promise<void>>,
      isHandlingAsyncTask: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapState({
      currActivePageIndex: 'currActivePageIndex'
    }),
    ...mapGetters({
      middlemostPageIndex: 'getMiddlemostPageIndex',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      getPage: 'getPage',
      isDragged: 'page/getIsDragged',
      allPageMode: 'mobileEditor/getMobileAllPageMode'
    }),
    pageWidth(): number {
      return this.config.width
    },
    pageHeight(): number {
      return this.config.height
    },
    scaleRatio(): number {
      return this.contentWidth / this.pageWidth
    },
    contentScaleStyles(): { [index: string]: string } {
      return {
        // transform: `scale(${this.scaleRatio})`
      }
    },
    styles(): { [index: string]: string } {
      return {
        height: `${this.pageHeight * this.scaleRatio}px`
      }
    },
    styles2(): { [index: string]: string } {
      if (this.type === 'panel' &&
        this.isDragged && this.index !== pageUtils.currFocusPageIndex) {
        return {
          'z-index': '-1'
        }
      } else {
        return {
        }
      }
    },
    hightlighterStyles(): { [index: string]: string } {
      return {
        width: `${this.contentWidth + 20}px`,
        height: `${this.pageHeight * this.scaleRatio + 20}px`
      }
    },
    loadingStyle(): { [index: string]: string } {
      return {
        width: '100%',
        height: '100%'
      }
    }
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setmiddlemostPageIndex: 'SET_middlemostPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex',
      _setIsDragged: 'page/SET_IsDragged',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
    },
    handleMouseEnter() {
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
    },
    clickPage() {
      const clickFocusedPreview = this.index === this.currFocusPageIndex
      if (clickFocusedPreview) {
        editorUtils.setMobileAllPageMode(false)
        editorUtils.setCurrCardIndex(this.index)
      }

      this._setmiddlemostPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)
      if (this.type === 'panel') {
        pageUtils.jumpIntoPage(this.index)
      }

      if (GeneralUtils.isTouchDevice() && clickFocusedPreview) {
        this.$nextTick(() => {
          if (pageUtils.isDetailPage) {
            pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 'auto')
          }
          pageUtils.fitPage()
        })
      }
    },
    dbclickPage() {
      this._setmiddlemostPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)
      if (this.type === 'full') {
        this._setIsShowPagePreview(false)
        pageUtils.jumpIntoPage(pageUtils.currFocusPageIndex)
      }
    },
    handleDragStart(e: DragEvent) {
      this._setIsDragged(true)
      this.isMouseOver = false
      this._setmiddlemostPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)

      const target = e.target as HTMLElement
      setTimeout(function () {
        target.style.visibility = 'hidden'
      }, 0)

      if (!e.dataTransfer) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'

      document.addEventListener('dragover', this.preventDefaultDragOver, false)
    },
    handleDragEnd(e: DragEvent) {
      this._setIsDragged(false)

      const target = e.target as HTMLElement
      setTimeout(function () {
        target.style.visibility = 'visible'
      }, 0)

      document.removeEventListener('dragover', this.preventDefaultDragOver, false)
    },
    preventDefaultDragOver(e: DragEvent) {
      e.preventDefault()
    },
    handleMenuAction(icon: string) {
      this.closeMenu()
      let page = null
      switch (icon) {
        case 'copy':
          page = GeneralUtils.deepCopy(this.getPage(this.index))
          page.designId = ''
          this._addPageToPos({
            newPage: page,
            pos: this.index + 1
          })
          GroupUtils.deselect()
          this._setmiddlemostPageIndex(this.index + 1)
          this._setCurrActivePageIndex(this.index + 1)
          StepsUtils.record()
          break
        case 'trash':
          GroupUtils.deselect()
          this._deletePage(this.index)
          this._setmiddlemostPageIndex(this.index - 1)
          this._setCurrActivePageIndex(this.index - 1)
          StepsUtils.record()
          break
        default:
          break
      }
    },
    handleLoaded() {
      this.$nextTick(() => {
        const contentRef = (this.$refs.content as HTMLElement)
        this.contentWidth = contentRef ? (this.$refs.content as HTMLElement).offsetWidth : 0
      })
    }
  }
})
</script>
<style lang="scss" scoped>
.page-preview-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  transition: 0.25s ease-in-out;
  max-width: 100%;
  &-content {
    position: relative;
    box-sizing: border-box;
    box-shadow: 0px 0px 10px setColor(gray-2, 0.4);
    transform-origin: 0 0;
    z-index: 1;
    &-more {
      position: absolute;
      right: 8px;
      top: 5px;
    }
    .menu {
      position: absolute;
      width: 120px;
      box-sizing: border-box;
      border-radius: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      right: 8px;
      top: 35px;
    }
    .menu-item {
      position: relative;
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: start;
      gap: 10px;
      cursor: pointer;
      &:hover {
        background-color: setColor(blue-3);
      }
      &-icon {
        margin-left: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      &-text {
        display: flex;
        align-items: center;
        justify-content: start;
        > span {
          font-weight: 400;
          font-size: 12px;
          line-height: 12px;
          color: setColor(gray-2);
        }
      }
    }
  }
  &__highlighter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    z-index: -1;
  }
  &-title {
    position: absolute;
    bottom: -8px;
    transform: translate(0, 100%);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    font-size: 16px;
    font-weight: bold;
  }
  &-icon {
    position: absolute;
    left: 7px;
    top: 7px;
    width: 20px;
    height: 20px;
    background: black;
    color: white;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
  }
  &__background {
    position: absolute;
    width: 100%;
    background: setColor(gray-3, 0.3);
    z-index: -1;
  }
}
.focused {
  border: 3px solid setColor(blue-1);
  color: setColor(blue-1);
  box-sizing: border-box;
  background: linear-gradient(90deg, rgba(#59c3e1, 0.3), rgba(#50a2d8, 0.3));
}
</style>
