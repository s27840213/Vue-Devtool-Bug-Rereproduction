<template lang="pug">
  div(class="page-preview-page"
    :style="styles2()"
    :class="{'full-height': type === 'full'}")
    div(class="page-preview-page-content pointer"
      :style="styles()"
      @click="clickPage()"
      @dblclick="dbclickPage()"
      draggable="true",
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="content")
      page-content(:style="contentScaleStyles" :config="config" :pageIndex="index" :scaleRatio="scaleRatio")
      div(class="page-preview-page__highlighter"
        :class="{'focused': lastSelectedPageIndex === index}"
        :style="hightlighterStyles()")
      div(v-if="isMouseOver"
        class="page-preview-page-content-more"
        @click="toggleMenu()")
        svg-icon(class="pb-5"
          :iconName="'more_vertical'"
          :iconWidth="'25px'")
      div(v-if="isMenuOpen && lastSelectedPageIndex === index"
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
      :style="styles()")
    div(v-if="type === 'full'"
      class="page-preview-page-title")
      span(:style="{'color': lastSelectedPageIndex === index ? '#4EABA6' : '#000'}") {{index+1}}
</template>
<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapState, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import PageContent from '@/components/editor/page/PageContent.vue'
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import StepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  components: {
    PageContent
  },
  props: {
    type: String,
    index: Number,
    config: {
      type: Object,
      required: true
    }
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
      contentWidth: 0
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapState('page', [
      'focusPageIndex'
    ]),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getPage: 'getPage',
      isDragged: 'page/getIsDragged'
    }),
    scaleRatio(): number {
      return this.contentWidth / (this.config as IPage).width
    },
    contentScaleStyles(): { [index: string]: string } {
      return {
        transform: `scale(${this.scaleRatio})`
      }
    }
  },
  mounted() {
    this.contentWidth = (this.$refs.content as HTMLElement).offsetWidth
  },
  methods: {
    styles() {
      return {
        height: `${this.config.height * this.scaleRatio}px`
      }
    },
    styles2() {
      if (this.type === 'panel' &&
        this.isDragged && this.index !== this.lastSelectedPageIndex) {
        return {
          'z-index': '-1'
        }
      } else {
        return {
        }
      }
    },
    hightlighterStyles() {
      return {
        width: `${this.contentWidth}px`,
        height: `${this.config.height * this.scaleRatio}px`
      }
    },
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
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
      this._setLastSelectedPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)
      if (this.type === 'panel') {
        pageUtils.jumpIntoPage(this.index)
      }
    },
    dbclickPage() {
      this._setLastSelectedPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)
      if (this.type === 'full') {
        this._setIsShowPagePreview(false)
        pageUtils.jumpIntoPage(this.lastSelectedPageIndex)
      }
    },
    handleDragStart(e: DragEvent) {
      this._setIsDragged(true)
      this.isMouseOver = false
      this._setLastSelectedPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)

      const target = e.target as HTMLElement
      setTimeout(function() {
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
      setTimeout(function() {
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
          this._setLastSelectedPageIndex(this.index + 1)
          this._setCurrActivePageIndex(this.index + 1)
          StepsUtils.record()
          break
        case 'trash':
          GroupUtils.deselect()
          this._deletePage(this.index)
          this._setLastSelectedPageIndex(this.index - 1)
          this._setCurrActivePageIndex(this.index - 1)
          StepsUtils.record()
          break
        default:
          break
      }
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
    top: 0;
    left: 0;
  }
  &-title {
    position: absolute;
    bottom: -30px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 30px;
    font-size: 16px;
    font-family: Mulish;
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
    background: setColor(gray-3);
    z-index: -1;
  }
}
.focused {
  border: 3px solid setColor(blue-1);
  color: setColor(blue-1);
  box-sizing: border-box;
}
</style>
