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
        template(v-for="(parent, index) in parents")
          span(class="folder-design-view__path__node" @click="goToParent(index)") {{ parent + ' ' }}
          span {{ ' > ' }}
          span {{ ' ' }}
        span(class="folder-design-view__path__node") {{ folder.name }}
      div(class="folder-design-view__actions")
        div(class="folder-design-view__more")
          svg-icon(class="header-icon"
                  iconName="more_horizontal"
                  iconWidth="18px"
                  iconColor="gray-2")
        div(class="folder-design-view__new-folder")
          svg-icon(class="header-icon"
                  iconName="folder_plus"
                  iconWidth="18px"
                  iconColor="gray-2")
        div(class="folder-design-view__sort-by")
          svg-icon(class="header-sort"
                  iconName="sequence"
                  iconWidth="18px"
                  iconColor="gray-2")
          span(class="header-sort") 排序方式
    div(class="horizontal-rule")
    div(v-if="folder.subFolders.length > 0" class="folder-design-view__folder-header")
      div(class="folder-design-view__expand-icon-container"
          @click="toggleFoldersExpansion")
        svg-icon(:style="foldersExpansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="folder-design-view__folder-title")
        span 資料夾
    div(v-if="foldersExpanded && folder.subFolders.length > 0" class="folder-design-view__folders")
      folder-item(v-for="subFolder in folder.subFolders"
                  :path="path"
                  :name="subFolder.name"
                  @goto="handleGotoFolder(subFolder.name)")
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
                  :menuItemNum="menuItemSlots.length"
                  @like="toggleFavorite(design)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, path, design, checkFavorite(design.id))")
            div(class="design-menu-item__icon")
              svg-icon(:iconName="menuItemSlot.icon"
                      iconWidth="10px"
                      iconColor="gray-2")
            div(class="design-menu-item__text")
              span {{ menuItemSlot.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import { IDesign, IFolder, IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { mapGetters, mapMutations } from 'vuex'
import FolderItem from '@/components/navigation/mydesign/FolderItem.vue'
import DesignItem from '@/components/navigation/mydesign/DesignItem.vue'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
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
      menuItems: designUtils.makeNormalMenuItems()
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder',
      folders: 'getFolders',
      favoriteDesigns: 'getFavoriteDesigns'
    }),
    path(): string[] {
      return designUtils.makePath(this.currentSelectedFolder)
    },
    folder(): IFolder {
      return designUtils.search(this.folders, this.path) as IFolder
    },
    parents(): string[] {
      const path = this.path
      return path.slice(0, path.length - 1)
    },
    designs(): IDesign[] {
      const designs = generalUtils.deepCopy(this.folder.designs)
      designUtils.sortByName(designs)
      return designs
    },
    favoriteIds(): string[] {
      return this.favoriteDesigns.map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    },
    menuItemSlots(): {name: string, icon: string, text: string}[] {
      return this.menuItems.map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrentSelectedFolder: 'SET_currSelectedFolder',
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
    goToParent(index: number) {
      const selectedParents = this.parents.slice(0, index + 1)
      this.setCurrentSelectedFolder(`f:${selectedParents.join('/')}`)
    },
    handleGotoFolder(name: string) {
      this.setExpand({
        path: this.path,
        isExpanded: true
      })
      this.setCurrentSelectedFolder(`${this.currentSelectedFolder}/${name}`)
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
      this.$nextTick(() => {
        const folderNameInput = this.$refs.folderName as HTMLInputElement
        folderNameInput.focus()
      })
    },
    handleFolderNameEditEnd() {
      this.isFolderNameEditing = false
      this.isFolderNameMouseOver = false
      if (this.editableFolderName === '' || this.editableFolderName === this.folder.name) return
      if (designUtils.checkExistingFolderName(this.folders, this.parents, this.editableFolderName)) return
      this.setFolderName({
        path: this.path,
        newFolderName: this.editableFolderName
      })
      this.setCurrentSelectedFolder(`f:${[...this.parents, this.editableFolderName].join('/')}`)
    },
    handleDesignMenuAction(icon: string, path: string[], design: IDesign, isInFavorites: boolean) {
      designUtils.dispatchDesignMenuAction(icon, path, design, isInFavorites)
    },
    checkFolderNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        this.handleFolderNameEditEnd()
      }
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
  &__sort-by {
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
    gap: 30px;
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
</style>
