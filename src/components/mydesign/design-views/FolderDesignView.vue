<template lang="pug">
  div(class="folder-design-view")
    div(class="folder-design-view__folder-name")
      span
        div(v-if="isFolderNameEditing"
            class="input-container"
            v-click-outside="handleFolderNameEditEnd")
          input(ref="folderName"
                v-model="editableFolderName"
                @change="handleFolderNameEditEnd"
                @keyup="checkFolderNameEnter")
          div(class="pen-container")
            svg-icon(iconName="pen"
                    iconWidth="20px"
                    iconColor="gray-3")
        button(v-else
              @mouseenter="handleFolderNameMouseEnter"
              @mouseleave="handleFolderNameMouseLeave"
              @click="handleFolderNameClick")
          span(:title="folderName") {{ folderName }}
          svg-icon(iconName="pen"
                  iconWidth="20px"
                  iconColor="gray-3")
        transition(name="fade")
          svg-icon(v-if="isShowHint"
                  class="folder-design-view__folder-name-hint-arrow"
                  iconName="arrow-up"
                  iconWidth="13.76px"
                  iconHeight="9.79px"
                  iconColor="red-1")
        transition(name="fade")
          div(v-if="isShowHint" class="folder-design-view__folder-name-hint-text")
            span {{$t('NN0226')}}
    div(class="folder-design-view__toolbar")
      div(class="folder-design-view__path")
        template(v-for="(parent, index) in shownParents")
          span(class="folder-design-view__path__node"
              :style="nodeStyles(false)"
              @click="goToParent(index + 1)") {{ parent + ' ' }}
          span(class="folder-design-view__path__text") {{ ' > ' }}
          span(class="folder-design-view__path__text") {{ ' ' }}
        span(class="folder-design-view__path__node"
            :style="nodeStyles(true)"
            :title="folderName") {{ folderName }}
      div(class="folder-design-view__actions")
        div(class="folder-design-view__more"
            @click="toggleFolderMenu"
            v-click-outside="closeFolderMenu")
          div(ref="more"
              class="folder-design-view__more__icon")
            svg-icon(class="header-icon"
                    iconName="more_vertical"
                    iconWidth="18px"
                    iconColor="gray-2")
          div(v-if="isFolderMenuOpen"
              class="folder-design-view__more__menu"
              @click.stop)
            div(class="folder-design-view__more__menu__title")
              span(:title="folderName") {{ folderName }}
            div(class="folder-design-view__more__menu__text")
              span {{ `${$t('NN0196', { name:folder ? folder.author : '' })} | ${$t('NN0197', { num:itemCount })}` }}
            div(class="folder-design-view__more__menu__divider")
            div(class="folder-design-view__more__menu__actions")
              div(@click="handleFolderNameClick")
                div(class="more-menu-icon")
                  svg-icon(iconName="pen"
                          iconWidth="15px"
                          iconColor="gray-2")
                div(class="more-menu-text")
                  span {{$t('NN0198')}}
              div(@click="handleDeleteFolder")
                div(class="more-menu-icon")
                  svg-icon(iconName="trash"
                          iconWidth="15px"
                          iconColor="gray-2")
                div(class="more-menu-text")
                  span {{$t('NN0199')}}
        div(ref="newFolder"
            class="folder-design-view__new-folder"
            :style="newFolderStyles()"
            @click="handleNewFolder")
          svg-icon(class="header-icon"
                  iconName="folder_plus"
                  iconWidth="18px"
                  :iconColor="isMaxLevelReached ? 'gray-3' : 'gray-2'")
        div(class="folder-design-view__sort-by"
            @click="toggleSortMenu"
            v-click-outside="closeSortMenu")
          svg-icon(class="header-sort"
                  iconName="sequence"
                  iconWidth="18px"
                  iconColor="gray-2")
          span(class="header-sort") {{$t('NN0191')}}
          div(v-if="isSortMenuOpen"
              class="folder-design-view__sort-by__menu"
              @click.stop)
            div(v-for="sortMenuItem in sortMenuItems"
                @click="handleSortByClick(sortMenuItem.payload)")
              div(class="sort-menu-icon")
                svg-icon(:iconName="sortMenuItem.icon"
                        iconWidth="15px"
                        iconColor="gray-2"
                        :style="sortMenuItem.style")
              div(class="sort-menu-text")
                span {{ sortMenuItem.text }}
              div(v-if="checkSortSelected(sortMenuItem.payload)" class="sort-menu-right")
                svg-icon(iconName="done"
                        iconWidth="15px"
                        iconColor="gray-2")
        btn-new-design
    div(class="horizontal-rule")
    folder-gallery(:path="path"
                  :menuItems="[]"
                  :allFolders="allFolders"
                  :selectedNum="selectedNum"
                  @menuAction="handleMenuAction"
                  @moveItem="handleMoveItem")
    design-gallery(:menuItems="menuItems"
                  :allDesigns="allDesigns"
                  :selectedNum="selectedNum"
                  @menuAction="handleMenuAction"
                  @loadMore="handleLoadMore")
    div(v-if="isEmpty && !isDesignsLoading && !isFoldersLoading" class="folder-design-view__empty")
      img(class="folder-design-view__empty__img" :src="require('@/assets/img/png/mydesign/empty-folder.png')")
      span(class="folder-design-view__empty__text") {{$t('NN0239')}}
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import { IFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import FolderGallery from '@/components/mydesign/FolderGallery.vue'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'
import hintUtils from '@/utils/hintUtils'
import BtnNewDesign from '@/components/new-design/BtnNewDesign.vue'

export default Vue.extend({
  mounted() {
    hintUtils.bind(this.$refs.more as HTMLElement, `${this.$t('NN0225')}`, 500)
    hintUtils.bind(this.$refs.newFolder as HTMLElement, `${this.$t('NN0190')}`, 500)
    this.refreshItems()
    this.refreshItemCount()
    window.addEventListener('resize', this.handleResize)
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  components: {
    FolderGallery,
    DesignGallery,
    BtnNewDesign
  },
  data() {
    return {
      isFolderNameMouseOver: false,
      isFolderNameEditing: false,
      editableFolderName: '',
      isShowHint: false,
      messageTimer: -1,
      menuItems: designUtils.makeNormalMenuItems(),
      isFolderMenuOpen: false,
      isSortMenuOpen: false,
      windowWidth: window.innerWidth,
      sortMenuItems: [
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(-90deg)',
          text: `${this.$t('NN0192')}`,
          payload: ['name', false]
        },
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(90deg)',
          text: `${this.$t('NN0193')}`,
          payload: ['name', true]
        },
        {
          icon: 'clock',
          style: '',
          text: `${this.$t('NN0194')}`,
          payload: ['update', true]
        },
        {
          icon: 'clock',
          style: '',
          text: `${this.$t('NN0195')}`,
          payload: ['update', false]
        }
      ]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    },
    currLocation() {
      this.isFolderNameMouseOver = false
      this.isFolderNameEditing = false
      this.isFolderMenuOpen = false
      this.refreshItems()
      this.refreshItemCount()
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      folders: 'getFolders',
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders',
      sortByField: 'getSortByField',
      sortByDescending: 'getSortByDescending',
      isDesignsLoading: 'getIsDesignsLoading',
      isFoldersLoading: 'getIsFoldersLoading',
      itemCount: 'getItemCount'
    }),
    path(): string[] {
      return designUtils.makePath(this.currLocation)
    },
    folder(): IFolder {
      return designUtils.search(this.folders, this.path) as IFolder
    },
    parents(): string[] {
      const path = this.path
      return path.slice(0, path.length - 1)
    },
    shownParents(): string[] {
      const parentNames = designUtils.getFolderNames(this.folders, this.parents)
      return parentNames.slice(1)
    },
    folderName(): string {
      return this.folder?.name ?? '...'
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isEmpty(): boolean {
      return this.allFolders.length + this.allDesigns.length === 0
    },
    isMaxLevelReached(): boolean {
      return designUtils.isMaxLevelReached(this.parents.length - 1)
    }
  },
  methods: {
    ...mapActions('design', {
      fetchFolderDesigns: 'fetchFolderDesigns',
      fetchFolderFolders: 'fetchFolderFolders',
      fetchItemCount: 'fetchItemCount',
      fetchMoreFolderDesigns: 'fetchMoreFolderDesigns'
    }),
    ...mapMutations('design', {
      setCurrLocation: 'SET_currLocation',
      setSortByField: 'SET_sortByField',
      setSortByDescending: 'SET_sortByDescending'
    }),
    newFolderStyles() {
      return this.isMaxLevelReached ? { pointerEvents: 'none' } : {}
    },
    nodeStyles(isCurrent: boolean) {
      const basicWidth = (this.windowWidth - 570) / (this.parents.length + 2)
      return {
        maxWidth: `${isCurrent ? basicWidth * 2 : basicWidth}px`
      }
    },
    goToParent(index: number) {
      const selectedParents = this.parents.slice(0, index + 1)
      this.setCurrLocation(`f:${selectedParents.join('/')}`)
    },
    handleFolderNameMouseEnter() {
      this.isFolderNameMouseOver = true
    },
    handleFolderNameMouseLeave() {
      this.isFolderNameMouseOver = false
    },
    handleFolderNameClick() {
      this.editableFolderName = this.folderName
      this.isFolderNameEditing = true
      this.isFolderMenuOpen = false
      this.$nextTick(() => {
        const folderNameInput = this.$refs.folderName as HTMLInputElement
        folderNameInput.focus()
      })
    },
    handleFolderNameEditEnd() {
      this.isFolderNameEditing = false
      this.isFolderNameMouseOver = false
      if (this.editableFolderName === '' || this.editableFolderName === this.folderName) return
      this.checkNameLength()
      designUtils.setFolderName(this.folder, this.editableFolderName, this.parents)
    },
    handleMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
    },
    handleDeleteFolder() {
      this.$emit('deleteFolder', {
        pathedFolder: {
          parents: this.parents,
          folder: this.folder
        },
        empty: this.isEmpty
      })
    },
    handleNewFolder() {
      const folderId = designUtils.addNewFolder(this.path, true)
      this.$nextTick(() => {
        const folderItemName = document.querySelector(`.folder-item__name[folderid="${folderId}"] span`)
        if (folderItemName) {
          setTimeout(() => { folderItemName.dispatchEvent(new MouseEvent('dblclick')) }, 0)
        }
      })
    },
    handleSortByClick(payload: [string, boolean]) {
      this.setSortByField(payload[0])
      this.setSortByDescending(payload[1])
      this.refreshItems()
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleLoadMore() {
      designUtils.fetchDesigns(async () => {
        await this.fetchMoreFolderDesigns({
          path: this.path.slice(1).join(',')
        })
      }, false)
    },
    handleResize() {
      this.windowWidth = window.innerWidth
    },
    checkFolderNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableFolderName === this.folderName) {
        this.handleFolderNameEditEnd()
      }
      this.checkNameLength()
    },
    checkNameLength() {
      if (this.editableFolderName.length > 64) {
        this.editableFolderName = this.editableFolderName.substring(0, 64)
        if (this.messageTimer) {
          clearTimeout(this.messageTimer)
        }
        this.isShowHint = true
        this.messageTimer = setTimeout(() => {
          this.isShowHint = false
          this.messageTimer = -1
        }, 3000)
      }
    },
    checkSortSelected(payload: [string, boolean]) {
      return this.sortByField === payload[0] && this.sortByDescending === payload[1]
    },
    toggleFolderMenu() {
      this.isFolderMenuOpen = !this.isFolderMenuOpen
    },
    toggleSortMenu() {
      this.isSortMenuOpen = !this.isSortMenuOpen
    },
    closeFolderMenu() {
      this.isFolderMenuOpen = false
    },
    closeSortMenu() {
      this.isSortMenuOpen = false
    },
    refreshDesigns() {
      designUtils.fetchDesigns(async () => {
        await this.fetchFolderDesigns({
          path: this.path.slice(1).join(',')
        })
      })
    },
    refreshFolders() {
      designUtils.fetchFolders(async () => {
        await this.fetchFolderFolders({
          path: this.path.slice(1).join(',')
        })
      })
    },
    refreshItemCount() {
      this.fetchItemCount({
        path: this.path.slice(1).join(',')
      })
    },
    refreshItems() {
      this.refreshDesigns()
      this.refreshFolders()
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-design-view {
  @include hover-scrollbar();
  box-sizing: border-box;
  padding: 0 43px 0 55px; // padding-right: 55 - 12(scrollbar width)
  text-align: left;
  &__folder-name {
    margin-top: 94px;
    width: calc(0.8 * (100vw - 360px)); // To prevent file name overflow the screen.
    > span {
      position: relative;
      width: 100%;
      font-size: 24px;
      font-weight: 700;
      line-height: 40px;
      color: setColor(bu);
      > button {
        display: flex;
        align-items: center;
        max-width: 100%;
        height: 40px;
        padding: 0;
        box-sizing: border-box;
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
        letter-spacing: inherit;
        color: inherit;
        border: none;
        &:hover {
          border-bottom: 1px dashed setColor(gray-3);
          > svg {
            opacity: 1;
          }
        }
        > span {
          max-width: 100%;
          overflow: hidden;
          text-align: left;
          text-overflow: ellipsis;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          color: inherit;
          white-space: nowrap;
        }
        > svg {
          opacity: 0;
        }
      }
      > div.input-container {
        display: flex;
        align-items: center;
        width: 321px;
        height: 40px;
        padding: 0;
        box-sizing: border-box;
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
        letter-spacing: inherit;
        color: inherit;
        border: none;
        border-bottom: 1px dashed setColor(gray-3);
        > input {
          height: calc(100% - 1px);
          padding: 0;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          color: inherit;
        }
      }
    }
  }
  &__folder-name-hint-arrow {
    position: absolute;
    left: 15px;
    top: 45px;
  }
  &__folder-name-hint-text {
    position: absolute;
    display: flex;
    left: 0px;
    top: 51px;
    height: 20px;
    align-items: center;
    justify-content: center;
    background-color: setColor(red-1);
    border-radius: 2px;
    padding: 2px 8px;
    width: max-content;
    z-index: 1;
    > span {
      font-weight: 400;
      font-size: 10px;
      line-height: 20px;
      display: block;
      letter-spacing: 0.12em;
      text-indent: 0.12em;
      color: white;
    }
  }
  &__toolbar {
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__path {
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 20px;
    color: setColor(gray-2);
    white-space: pre-wrap;
    &__text {
      display: inline-block;
    }
    &__node {
      overflow: hidden;
      display: inline-block;
      text-overflow: ellipsis;
      cursor: pointer;
      white-space: nowrap;
      &:hover {
        border-top: 1px solid transparent;
        border-bottom: 1px solid setColor(gray-2);
      }
      // @media (min-width: 1360px) {
      //   max-width: 10vw;
      // }
    }
  }
  &__actions {
    display: flex;
    gap: 13px;
    align-items: center;
    > div {
      height: 36px;
      display: flex;
      align-items: center;
      white-space: nowrap;
    }
  }
  &__more {
    position: relative;
    &__icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__menu {
      position: absolute;
      width: 159px;
      top: calc(100% + 5px);
      right: 0;
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 2px;
      z-index: 1;
      &__title {
        margin-top: 13px;
        margin-left: 8px;
        height: 22px;
        > span {
          width: 143px;
          white-space: nowrap;
          text-overflow: ellipsis;
          display: block;
          overflow: hidden;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          color: setColor(gray-2);
        }
      }
      &__text {
        margin-left: 8px;
        > span {
          width: 143px;
          display: block;
          font-weight: 400;
          font-size: 10px;
          line-height: 16px;
          letter-spacing: 0.07em;
          color: setColor(gray-3);
        }
      }
      &__divider {
        margin: 10px 8px 5px 6px;
        width: 145px;
        height: 1px;
        background-color: setColor(gray-4);
      }
      &__actions {
        display: flex;
        flex-direction: column;
        > div {
          height: 30px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          &:hover {
            background-color: setColor(gray-5);
          }
          > .more-menu-icon {
            margin-left: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 15px;
            height: 15px;
          }
          > .more-menu-text {
            height: 16px;
            display: flex;
            align-items: center;
            > span {
              font-weight: 400;
              font-size: 12px;
              line-height: 16px;
              letter-spacing: 0.03em;
              color: setColor(gray-2);
            }
          }
        }
      }
    }
  }
  &__sort-by {
    position: relative;
    cursor: pointer;
    gap: 5px;
    padding: 0px 10px;
    border: 1px solid setColor(gray-3);
    border-radius: 6px;
    box-sizing: border-box;
    > span {
      font-size: 12px;
      letter-spacing: 0.045em;
    }
    &:hover {
      border-color: setColor(blue-1);
      .header-sort {
        color: setColor(blue-1);
      }
    }
    &__menu {
      position: absolute;
      min-width: 178px;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 2px;
      display: flex;
      flex-direction: column;
      > div {
        position: relative;
        height: 30px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        &:hover {
          background-color: setColor(gray-5);
        }
        > .sort-menu-icon {
          margin-left: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
        }
        > .sort-menu-text {
          height: 16px;
          display: flex;
          align-items: center;
          margin-right: 30px;
          > span {
            font-weight: 400;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.03em;
            color: setColor(gray-2);
            white-space: nowrap;
          }
        }
        > .sort-menu-right {
          position: absolute;
          right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
        }
      }
    }
  }
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 35px;
    height: calc(100% - 270px);
    &__text {
      display: block;
      font-weight: 400;
      font-size: 30px;
      line-height: 30px;
      color: setColor(gray-3);
    }
  }
}

.header-icon {
  cursor: pointer;
  &:hover {
    color: setColor(blue-1);
    background-color: setColor(gray-6);
  }
}

.pen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  margin-top: 13px;
  margin-bottom: 38px;
}

.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.2s;
  }
  &-enter,
  &-leave-to {
    opacity: 0;
  }
}
</style>
