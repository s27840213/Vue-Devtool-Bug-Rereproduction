<template lang="pug">
  div(class="sidebar")
    div(class="nav")
      div(class="nav-container")
        div(class="nav-item-new-folder")
          div(class="nav-item-new-folder__container"
              @click="handleNewFolder")
            div(class="nav-item-new-folder__icon")
              svg-icon(iconName="plus-origin"
                  iconColor="gray-4"
                  iconWidth="18px")
            div(class="nav-item-new-folder__text") 新建資料夾
        div(class="nav-item" :class="{'bg-blue-1': (currLocation === 'a')}"
            :style="draggedOverStyles('a')"
            @dragenter="handleDragEnter('a')"
            @dragleave="handleDragLeave('a')"
            @dragover.prevent
            @drop="handleDrop('a')"
            @click="handleSelection('a')")
          svg-icon(iconName="all"
              iconColor="white"
              iconWidth="20px"
              style="pointer-events: none")
          div(class="nav-item__text"
              style="pointer-events: none") 我所有設計
        div(class="nav-item" :class="{'bg-blue-1': (currLocation === 'h')}"
            @click="handleSelection('h')")
          svg-icon(iconName="heart"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text") 我的最愛
        sidebar-folder(v-for="folder in realFolders" :folder="folder" :level="0" :parents="[ROOT]"
                      @moveItem="handleMoveItem"
                      @showHint="handleShowHint")
        div(class="nav-item" :class="{'bg-blue-1': (currLocation === 't')}"
            :style="draggedOverStyles('t')"
            @dragenter="handleDragEnter('t')"
            @dragleave="handleDragLeave('t')"
            @dragover.prevent
            @drop="handleDrop('t')"
            @click="handleSelection('t')")
          svg-icon(iconName="trash"
              iconColor="white"
              iconWidth="20px"
              style="pointer-events: none")
          div(class="nav-item__text"
              style="pointer-events: none") 垃圾桶
        transition(name="fade")
          svg-icon(v-if="isShowHint"
                  class="nav-item__name-hint-arrow"
                  :style="hintArrowStyles()"
                  iconName="arrow-up"
                  iconWidth="13.76px"
                  iconHeight="9.79px"
                  iconColor="red-1")
        transition(name="fade")
          div(v-if="isShowHint"
              class="nav-item__name-hint-text"
              :style="hintTextStyles()")
            span 不可超過64個字元，請縮減名稱。
</template>
<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import SidebarFolder from '@/components/mydesign/SidebarFolder.vue'
import designUtils from '@/utils/designUtils'
import { IDesign, IFolder, IPathedFolder, IQueueItem } from '@/interfaces/design'

export default Vue.extend({
  components: {
    SidebarFolder
  },
  data() {
    return {
      ROOT: designUtils.ROOT,
      isShowHint: true,
      messageTimer: -1,
      hintTopBase: 0,
      isAllDraggedOver: false,
      isTrashDraggedOver: false
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      draggingType: 'getDraggingType',
      draggingDesign: 'getDraggingDesign',
      draggingFolder: 'getDraggingFolder',
      selectedDesigns: 'getSelectedDesigns',
      folders: 'getFolders'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    },
    realFolders(): IFolder[] {
      if (this.folders.length > 0) {
        return designUtils.sortById([...this.folders[0].subFolders])
      }
      return []
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrLocation: 'SET_currLocation'
    }),
    draggedOverStyles(type: string) {
      switch (type) {
        case 'a':
          return (this.isAllDraggedOver && this.currLocation !== 'a') ? { 'background-color': '#2C2F43' } : {}
        case 't':
          return (this.isTrashDraggedOver && this.currLocation !== 't') ? { 'background-color': '#2C2F43' } : {}
      }
    },
    hintArrowStyles() {
      return { top: `${this.hintTopBase + 2}px` }
    },
    hintTextStyles() {
      return { top: `${this.hintTopBase + 8}px` }
    },
    handleSelection(selection: string) {
      this.setCurrLocation(selection)
    },
    handleDragEnter(type: string) {
      switch (type) {
        case 'a':
          this.isAllDraggedOver = true
          break
        case 't':
          this.isTrashDraggedOver = true
          break
      }
    },
    handleDragLeave(type: string) {
      switch (type) {
        case 'a':
          this.isAllDraggedOver = false
          break
        case 't':
          this.isTrashDraggedOver = false
          break
      }
    },
    handleDrop(type: string) {
      const destination = [this.ROOT]
      switch (type) {
        case 'a':
          this.isAllDraggedOver = false
          if (this.draggingType === 'design') {
            const design = this.draggingDesign as IDesign | undefined
            if (!design) return
            if (this.isMultiSelected && this.selectedDesigns[design.id]) {
              designUtils.moveAll(Object.values(this.selectedDesigns), destination)
              this.$emit('moveItem', {
                type: 'multi',
                data: design,
                dest: designUtils.ROOT_DISPLAY
              })
            } else {
              designUtils.move(design, destination)
              this.$emit('moveItem', {
                type: 'design',
                data: design,
                dest: designUtils.ROOT_DISPLAY
              })
            }
          } else if (this.draggingType === 'folder') {
            const { parents = [], folder = undefined } = (this.draggingFolder as IPathedFolder | undefined) ?? {}
            if (!folder) return
            designUtils.moveFolder({ parents, folder }, destination).then(() => {
              if (folder.isCurrLocation) {
                this.setCurrLocation(`f:${this.ROOT}/${folder.id}`)
              }
              this.$emit('moveItem', {
                type: 'folder',
                data: folder,
                dest: designUtils.ROOT_DISPLAY
              })
            })
          }
          break
        case 't':
          this.isTrashDraggedOver = false
          if (this.draggingType === 'design') {
            const design = this.draggingDesign as IDesign | undefined
            if (!design) return
            if (this.isMultiSelected && this.selectedDesigns[design.id]) {
              this.$emit('deleteAll')
            } else {
              designUtils.delete(design)
              this.$emit('deleteItem', {
                type: 'design',
                data: design
              })
            }
          } else if (this.draggingType === 'folder') {
            // const { parents = [], folder = undefined } = (this.draggingFolder as IPathedFolder | undefined) ?? {}
            // if (!folder) return
            // TODO: check empty by API
            // this.$emit('deleteFolder', {
            //   pathedFolder: { parents, folder },
            //   empty: folder.designs.length + folder.subFolders.length === 0
            // })
          }
          break
      }
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleShowHint(folderId: string) {
      const sidebarFolder = document.querySelector(`.nav-folder[folderid="${folderId}"]`) as HTMLElement
      const rect = sidebarFolder.getBoundingClientRect()
      this.hintTopBase = rect.top + rect.height
      if (this.messageTimer) {
        clearTimeout(this.messageTimer)
      }
      this.isShowHint = true
      this.messageTimer = setTimeout(() => {
        this.isShowHint = false
        this.messageTimer = -1
      }, 3000)
    },
    handleNewFolder() {
      const folderId = designUtils.addNewFolder([designUtils.ROOT])
      this.$nextTick(() => {
        const folderItemName = document.querySelector(`.nav-folder[folderid="${folderId}"]`)
        if (folderItemName) {
          setTimeout(() => { folderItemName.dispatchEvent(new MouseEvent('contextmenu')) }, 0)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(240px, 100%);
  background-color: setColor(nav-design);
  z-index: setZindex(sidebar);
}

.nav {
  @include size(100%, 100%);
  overflow: auto;
}

.nav-container {
  margin-top: 78px;
  min-width: 100%;
  width: fit-content;
}

.nav-item {
  grid-template-columns: 20px auto;
  padding: 10px 10px 10px 32px;
  width: 100%;
  display: grid;
  grid-column-gap: 10px;
  align-items: center;
  box-sizing: border-box;
  transition: background-color 0.2s;
  margin-bottom: 10px;
  cursor: pointer;
  &__text {
    font-family: 'NotoSansTC';
    text-align: left;
    color: white;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2.5px;
  }
  &__name-hint-arrow {
    position: fixed;
    left: 112.8px;
    z-index: 1000;
  }
  &__name-hint-text {
    position: fixed;
    display: flex;
    left: 8px;
    width: 208.8px;
    height: 20px;
    align-items: center;
    justify-content: center;
    background-color: setColor(red-1);
    border-radius: 2px;
    padding: 2px 8px;
    z-index: 1000;
    > span {
      font-family: "NotoSansTC";
      font-weight: 400;
      font-size: 10px;
      line-height: 20px;
      display: block;
      letter-spacing: 0.12em;
      text-indent: 0.12em;
      color: white;
    }
  }
}

.nav-item-new-folder {
  padding-left: 18px;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  margin-bottom: 10px;
  &:hover {
    .nav-item-new-folder {
      &__container {
        border-color: white;
      }
      &__icon {
        svg {
          color: white;
        }
      }
      &__text {
        color: white;
      }
    }
  }
  &__container {
    grid-template-columns: 20px auto;
    padding: 10px 18px 10px 13px;
    width: 171px;
    display: grid;
    grid-column-gap: 10px;
    align-items: center;
    box-sizing: border-box;
    border: 1px solid setColor(gray-3);
    border-radius: 4px;
    cursor: pointer;
  }
  &__icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__text {
    font-family: 'NotoSansTC';
    text-align: left;
    color: white;
    font-size: 14px;
    font-weight: 700;
    color: setColor(gray-4);
  }
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
