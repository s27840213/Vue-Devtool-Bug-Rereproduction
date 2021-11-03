<template lang="pug">
  div(class="folder-design-view")
    div(class="folder-design-view__folder-name")
      span
        div(v-if="isFolderNameEditing"
            v-click-outside="handleFolderNameEditEnd")
          input(ref="folderName"
                v-model="editableFolderName"
                @change="handleFolderNameEditEnd"
                @keyup="checkFolderNameEnter")
          div(class="pen-container")
            svg-icon(iconName="pen"
                    iconWidth="20px"
                    iconColor="gray-3")
          transition(name="fade")
            div(v-if="isShowHint" class="folder-design-view__folder-name-hint")
              span 不可超過64個字元，請縮減名稱。
        button(v-else
              @mouseenter="handleFolderNameMouseEnter"
              @mouseleave="handleFolderNameMouseLeave"
              @click="handleFolderNameClick")
          span {{ folder.name }}
          svg-icon(v-if="isFolderNameMouseOver"
                  iconName="pen"
                  iconWidth="20px"
                  iconColor="gray-3")
    div(class="folder-design-view__toolbar")
      div(class="folder-design-view__path")
        template(v-for="(parent, index) in shownParents")
          span(class="folder-design-view__path__node" @click="goToParent(index + 1)") {{ parent + ' ' }}
          span {{ ' > ' }}
          span {{ ' ' }}
        span(class="folder-design-view__path__node") {{ folder.name }}
      div(class="folder-design-view__actions")
        div(class="folder-design-view__more"
            @click="toggleFolderMenu"
            v-click-outside="closeFolderMenu")
          div(ref="more"
              class="folder-design-view__more__icon")
            svg-icon(class="header-icon"
                    iconName="more_horizontal"
                    iconWidth="18px"
                    iconColor="gray-2")
          div(v-if="isFolderMenuOpen"
              class="folder-design-view__more__menu"
              @click.stop)
            div(class="folder-design-view__more__menu__title")
              span {{ folder.name }}
            div(class="folder-design-view__more__menu__text")
              span {{ `由 ${folder.author} 創作 | ${designs.length}個項目` }}
            div(class="folder-design-view__more__menu__divider")
            div(class="folder-design-view__more__menu__actions")
              div(@click="handleFolderNameClick")
                div(class="more-menu-icon")
                  svg-icon(iconName="pen"
                          iconWidth="15px"
                          iconColor="gray-2")
                div(class="more-menu-text")
                  span 重新命名
              div(@click="handleDeleteFolder")
                div(class="more-menu-icon")
                  svg-icon(iconName="trash"
                          iconWidth="15px"
                          iconColor="gray-2")
                div(class="more-menu-text")
                  span 刪除資料夾
        div(ref="newFolder"
            class="folder-design-view__new-folder"
            @click="handleNewFolder")
          svg-icon(class="header-icon"
                  iconName="folder_plus"
                  iconWidth="18px"
                  iconColor="gray-2")
        div(class="folder-design-view__sort-by"
            @click="toggleSortMenu"
            v-click-outside="closeSortMenu")
          svg-icon(class="header-sort"
                  iconName="sequence"
                  iconWidth="18px"
                  iconColor="gray-2")
          span(class="header-sort") 排序方式
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
    div(class="horizontal-rule")
    div(v-if="subFolders.length > 0" class="folder-design-view__folder-header")
      div(class="folder-design-view__expand-icon-container"
          @click="toggleFoldersExpansion")
        svg-icon(:style="foldersExpansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="folder-design-view__folder-title")
        span 資料夾
    div(v-if="foldersExpanded && subFolders.length > 0" class="folder-design-view__folders")
      folder-item(v-for="subFolder in subFolders"
                  :path="path"
                  :config="subFolder"
                  @goto="handleGotoFolder(subFolder.id)"
                  @moveItem="handleMoveItem")
    div(v-if="designs.length > 0" class="folder-design-view__design-header")
      div(class="folder-design-view__expand-icon-container"
          @click="toggleDesignsExpansion")
        svg-icon(:style="designsExpansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="folder-design-view__design-title")
        span 設計
    div(v-if="designsExpanded" class="folder-design-view__designs")
      design-item(v-for="design in designs"
                  :key="design.id"
                  :path="path"
                  :config="design"
                  :favorable="true"
                  :isInFavorites="checkFavorite(design.id)"
                  :isSelected="checkSelected(design.id)"
                  :isAnySelected="isAnySelected"
                  :isMultiSelected="isMultiSelected"
                  :menuItemNum="menuItemSlots.length"
                  @like="toggleFavorite(design)"
                  @select="selectDesign(design)"
                  @deselect="deselectDesign(design)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, path, design)")
            div(class="design-menu-item__icon")
              svg-icon(:iconName="menuItemSlot.icon"
                      iconWidth="10px"
                      iconColor="gray-2")
            div(class="design-menu-item__text")
              span {{ menuItemSlot.text }}
            div(v-if="menuItemSlot.extendable" class="design-menu-item__right")
              svg-icon(iconName="chevron-right"
                      iconWidth="10px"
                      iconColor="gray-2")
    div(v-if="isEmpty" class="folder-design-view__empty")
      img(class="folder-design-view__empty__img" :src="require('@/assets/img/png/mydesign/empty-folder.png')")
      span(class="folder-design-view__empty__text") 此資料夾是空的
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import { IDesign, IFolder, IPathedDesign, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { mapGetters, mapMutations } from 'vuex'
import FolderItem from '@/components/mydesign/FolderItem.vue'
import DesignItem from '@/components/mydesign/DesignItem.vue'
import generalUtils from '@/utils/generalUtils'
import hintUtils from '@/utils/hintUtils'

export default Vue.extend({
  mounted() {
    hintUtils.bind(this.$refs.more as HTMLElement, '顯示更多', 500)
    hintUtils.bind(this.$refs.newFolder as HTMLElement, '新增資料夾', 500)
  },
  components: {
    FolderItem,
    DesignItem
  },
  data() {
    return {
      foldersExpanded: true,
      designsExpanded: true,
      isFolderNameMouseOver: false,
      isFolderNameEditing: false,
      editableFolderName: '',
      isShowHint: false,
      messageTimer: -1,
      menuItems: designUtils.makeNormalMenuItems(),
      isFolderMenuOpen: false,
      isSortMenuOpen: false,
      sortByField: 'name',
      sortByDescending: false,
      sortMenuItems: [
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(-90deg)',
          text: '名稱 ( 遞增 )',
          payload: ['name', false]
        },
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(90deg)',
          text: '名稱 ( 遞減 )',
          payload: ['name', true]
        },
        {
          icon: 'clock',
          style: '',
          text: '修改日期 ( 新到舊 )',
          payload: ['time', true]
        },
        {
          icon: 'clock',
          style: '',
          text: '修改日期 ( 舊到新 )',
          payload: ['time', false]
        }
      ]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  watch: {
    designs() {
      this.$emit('clearSelection')
    },
    currLocation() {
      this.isFolderNameMouseOver = false
      this.isFolderNameEditing = false
      this.isFolderMenuOpen = false
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      folders: 'getFolders',
      favoriteDesigns: 'getFavoriteDesigns',
      selectedDesigns: 'getSelectedDesigns'
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
    designs(): IDesign[] {
      const designs = generalUtils.deepCopy(this.folder.designs)
      designUtils.sortDesignsBy(designs, this.sortByField, this.sortByDescending)
      return designs
    },
    subFolders(): IFolder[] {
      const subFolders = generalUtils.deepCopy(this.folder.subFolders)
      designUtils.sortFoldersBy(subFolders, this.sortByField, this.sortByDescending)
      return subFolders
    },
    favoriteIds(): string[] {
      return this.favoriteDesigns.map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    },
    menuItemSlots(): {name: string, icon: string, text: string}[] {
      return this.menuItems.map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isAnySelected(): boolean {
      return this.selectedNum > 0
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    },
    isEmpty(): boolean {
      return this.folder.subFolders.length + this.designs.length === 0
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrLocation: 'SET_currLocation',
      setExpand: 'SET_expand',
      addToFavorite: 'UPDATE_addToFavorite',
      removeFromFavorite: 'UPDATE_removeFromFavorite',
      setFolderName: 'UPDATE_folderName'
    }),
    foldersExpansionIconStyles() {
      return this.foldersExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    designsExpansionIconStyles() {
      return this.designsExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    checkFavorite(id: string): boolean {
      return this.favoriteIds.includes(id)
    },
    checkSelected(id: string): boolean {
      return !!this.selectedDesigns[id]
    },
    goToParent(index: number) {
      const selectedParents = this.parents.slice(0, index + 1)
      this.setCurrLocation(`f:${selectedParents.join('/')}`)
    },
    handleGotoFolder(id: string) {
      this.setExpand({
        path: this.path,
        isExpanded: true
      })
      this.setCurrLocation(`${this.currLocation}/${id}`)
    },
    handleFolderNameMouseEnter() {
      this.isFolderNameMouseOver = true
    },
    handleFolderNameMouseLeave() {
      this.isFolderNameMouseOver = false
    },
    handleFolderNameClick() {
      this.editableFolderName = this.folder.name
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
      if (this.editableFolderName === '' || this.editableFolderName === this.folder.name) return
      // TODO: check if name is more than 64 characters
      this.setFolderName({
        path: this.path,
        newFolderName: this.editableFolderName
      })
    },
    handleDesignMenuAction(icon: string, path: string[], design: IDesign) {
      const extraEvent = designUtils.dispatchDesignMenuAction(icon, path, design)
      if (extraEvent) {
        const { event, payload } = extraEvent
        this.$emit(event, payload)
      }
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
      const folderId = designUtils.addNewFolder(this.path)
      this.$nextTick(() => {
        const folderItemName = document.querySelector(`.folder-item__name[folderid="${folderId}"] span`)
        if (folderItemName) {
          setTimeout(() => { folderItemName.dispatchEvent(new MouseEvent('dblclick')) }, 0)
        }
      })
    },
    handleSortByClick(payload: [string, boolean]) {
      this.sortByField = payload[0]
      this.sortByDescending = payload[1]
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    checkFolderNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableFolderName === this.folder.name) {
        this.handleFolderNameEditEnd()
      }
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
    toggleFoldersExpansion() {
      this.foldersExpanded = !this.foldersExpanded
    },
    toggleDesignsExpansion() {
      this.designsExpanded = !this.designsExpanded
    },
    toggleFavorite(design: IDesign) {
      const payload = {
        path: this.path,
        design
      }
      if (this.checkFavorite(design.id)) {
        this.removeFromFavorite(payload)
      } else {
        this.addToFavorite(payload)
      }
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
    selectDesign(design: IDesign) {
      this.$emit('selectDesign', {
        path: this.path,
        design
      })
    },
    deselectDesign(design: IDesign) {
      this.$emit('deselectDesign', {
        path: this.path,
        design
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-design-view {
  text-align: left;
  font-family: NotoSansTC;
  overflow-y: auto;
  > div {
    margin-left: 55px;
    margin-right: 65px;
  }
  &__folder-name {
    margin-top: 94px;
    > span {
      font-size: 24px;
      font-weight: 700;
      line-height: 40px;
      letter-spacing: 0.205em;
      color: setColor(bu);
      > button {
        display: flex;
        align-items: center;
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
        }
        > span {
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          color: inherit;
          white-space: nowrap;
        }
      }
      > div {
        position: relative;
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
  &__folder-name-hint {
    position: absolute;
    display: flex;
    right: -16px;
    top: 50%;
    transform: translate(100%, -50%);
    width: 208.8px;
    height: 20px;
    align-items: center;
    justify-content: center;
    background-color: setColor(red-1);
    border-radius: 2px;
    padding: 2px 8px;
    > span {
      font-family: "SFProDisplay";
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
    width: calc(100% - 120px);
  }
  &__path {
    font-size: 14px;
    line-height: 20px;
    color: setColor(gray-2);
    white-space: pre-wrap;
    &__node {
      cursor: pointer;
      &:hover {
        border-bottom: 1px solid;
      }
    }
  }
  &__actions {
    display: flex;
    gap: 13px;
    align-items: center;
    > div {
      height: 29px;
      display: flex;
      align-items: center;
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
          font-family: NotoSansTC;
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
          font-family: NotoSansTC;
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
          > .more-menu-text{
            height: 16px;
            display: flex;
            align-items: center;
            > span {
              font-family: NotoSansTC;
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
    margin-right: 38px;
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
      width: 178px;
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
        > .sort-menu-text{
          height: 16px;
          display: flex;
          align-items: center;
          > span {
            font-family: NotoSansTC;
            font-weight: 400;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.03em;
            color: setColor(gray-2);
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
  &__folder-header, &__design-header {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 20px;
  }
  &__folder-title, &__design-title {
    display: flex;
    align-items: center;
    height: 40px;
    > span {
      line-height: 40px;
      font-size: 24px;
      font-weight: 700;
      color: setColor(gray-2);
      letter-spacing: 0.205em;
    }
  }
  &__expand-icon-container {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    > svg {
      transition: 0.1s linear;
    }
  }
  &__folders {
    display: flex;
    gap: 40px;
    margin-bottom: 45px;
  }
  &__designs {
    display: grid;
    grid-gap: 25px;
    width: calc(100% - 120px);
    margin-bottom: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    @media(min-width: 976px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media(min-width: 1260px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @media(min-width: 1560px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 35px;
    width: calc(100% - 120px);
    height: calc(100% - 270px);
    &__text {
      display: block;
      font-family: NotoSansTC;
      font-weight: 400;
      font-size: 30px;
      line-height: 30px;
      color: setColor(gray-3);
    }
  }
}

.header-icon{
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
  width: calc(100% - 120px);
  margin-top: 24px;
  margin-bottom: 38px;
}

.fade {
  &-enter-active, &-leave-active {
    transition: .2s;
  }
  &-enter, &-leave-to {
    opacity: 0;
  }
}
</style>
