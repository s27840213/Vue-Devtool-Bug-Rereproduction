<template lang="pug">
  div(class="page-preview-page")
    div(class="page-preview-page-content pointer"
      :class="{'focused': focusPageIndex === index}"
      @click="clickPage()"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave")
      div(v-if="isMouseOver"
        class="page-preview-page-content-more"
        @click="toggleMenu()")
        svg-icon(class="pb-5"
          :iconName="'more_horizontal'"
          :iconWidth="'25px'")
      div(v-if="isMenuOpen"
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
    div(class="page-preview-page-title")
      span(:style="{'color': focusPageIndex === index ? '#4EABA6' : '#000'}") {{index+1}}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  props: {
    index: Number,
    pagename: String
  },
  data() {
    return {
      menuItems: [
        {
          icon: 'copy',
          text: '複製'
        },
        {
          icon: 'trash',
          text: '刪除'
        }
      ],
      isMouseOver: false,
      isMenuOpen: false
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
      getPage: 'getPage',
      getPages: 'getPages'
    })
  },
  methods: {
    ...mapMutations({
      _addPageToPos: 'ADD_pageToPos',
      _deletePage: 'DELETE_page',
      _setFocusPage: 'page/SET_focusPage',
      _setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      _setCurrActivePageIndex: 'SET_currActivePageIndex'
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
      this._setFocusPage(this.index)
      this._setLastSelectedPageIndex(this.index)
      this._setCurrActivePageIndex(this.index)
    },
    handleMenuAction(icon: string) {
      console.log('d', this.index)
      this.closeMenu()
      let page = null
      switch (icon) {
        case 'copy':
          page = GeneralUtils.deepCopy(this.getPage(this.index))
          page.name += ' (copy)'
          page.designId = ''
          this._addPageToPos({
            newPage: page,
            pos: this.index + 1
          })
          GroupUtils.deselect()
          this._setFocusPage(this.index + 1)
          this._setLastSelectedPageIndex(this.index + 1)
          this._setCurrActivePageIndex(this.index + 1)
          break
        case 'trash':
          GroupUtils.deselect()
          this._deletePage(this.index)
          this._setFocusPage(this.index - 1)
          this._setLastSelectedPageIndex(this.index - 1)
          this._setCurrActivePageIndex(this.index - 1)
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
  width: 150px;
  height: 180px;
  transition: 0.25s ease-in-out;

  &-content {
    position: relative;
    width: 100%;
    height: 150px;
    background: rgb(242, 255, 228);
    border-radius: 5px;

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
      height: 35px;
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
          font-family: NotoSansTC;
          font-weight: 400;
          font-size: 14px;
          line-height: 12px;
          color: setColor(gray-2);
        }
      }
    }
  }
  &-title {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 30px;
    font-size: 16px;
  }
  &-last {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 150px;
    background: setColor(gray-4);

    > button {
      position: absolute;
      width: 150px;
      height: 150px;
    }
  }
}

.focused {
  border: 3px solid setColor(blue-1);
  color: setColor(blue-1);
}
</style>
