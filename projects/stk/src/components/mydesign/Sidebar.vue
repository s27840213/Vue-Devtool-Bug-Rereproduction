<template lang="pug">
div(class="sidebar")
  div(class="nav scrollbar-gray-thin")
    div(class="nav-container")
      div(class="nav-item-new-folder")
        div(class="nav-item-new-folder__container"
            @click="handleNewFolder")
          div(class="nav-item-new-folder__icon")
            svg-icon(iconName="plus-origin"
                iconColor="gray-4"
                iconWidth="18px")
          div(class="nav-item-new-folder__text") {{$t('NN0190')}}
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
            style="pointer-events: none") {{$t('NN0187')}}
      div(class="nav-item" :class="{'bg-blue-1': (currLocation === 'h')}"
          @click="handleSelection('h')")
        svg-icon(iconName="heart"
            iconColor="white"
            iconWidth="20px")
        div(class="nav-item__text")  {{$t('NN0188')}}
      sidebar-folder(v-for="folder in realFolders"
        :key="folder.id"
        :folder="folder" :level="0"
        :parents="[ROOT]"
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
            style="pointer-events: none")  {{$t('NN0189')}}
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
          span {{$t('NN0226')}}
</template>

<script lang="ts">
import SidebarFolder from '@/components/mydesign/SidebarFolder.vue'
import { IDesign, IFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  components: {
    SidebarFolder
  },
  data() {
    return {
      ROOT: designUtils.ROOT,
      isShowHint: false,
      messageTimer: -1,
      hintTopBase: 0,
      isAllDraggedOver: false,
      isTrashDraggedOver: false
    }
  },
  emits: ['moveItem', 'deleteAll', 'deleteFolder', 'deleteItem'],
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
        return designUtils.sortByCreateTime([...this.folders[0].subFolders])
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
          return (this.isAllDraggedOver && this.currLocation !== 'a') ? { 'background-color': 'rgba(78, 171, 230, 0.3)' } : {}
        case 't':
          return (this.isTrashDraggedOver && this.currLocation !== 't') ? { 'background-color': 'rgba(78, 171, 230, 0.3)' } : {}
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
            if (this.isMultiSelected && this.selectedDesigns[design.asset_index.toString()]) {
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
            if (!this.draggingFolder) return
            designUtils.moveFolder(this.draggingFolder, destination).then(() => {
              if (this.draggingFolder.folder.isCurrLocation) {
                this.setCurrLocation(`f:${this.ROOT}/${this.draggingFolder.folder.id}`)
              }
              this.$emit('moveItem', {
                type: 'folder',
                data: this.draggingFolder.folder,
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
            if (this.isMultiSelected && this.selectedDesigns[design.asset_index.toString()]) {
              this.$emit('deleteAll')
            } else {
              designUtils.delete(design)
              this.$emit('deleteItem', {
                type: 'design',
                data: design,
                dest: this.currLocation
              })
            }
          } else if (this.draggingType === 'folder') {
            const pathedFolder = this.draggingFolder
            if (!pathedFolder) return
            designUtils.checkEmpty(pathedFolder).then((empty) => {
              this.$emit('deleteFolder', {
                pathedFolder: pathedFolder,
                empty
              })
            })
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
      this.messageTimer = window.setTimeout(() => {
        this.isShowHint = false
        this.messageTimer = -1
      }, 3000)
    },
    handleNewFolder() {
      const folderId = designUtils.addNewFolder([designUtils.ROOT])
      this.$nextTick(() => {
        designUtils.emit(`edit-sidebar-${folderId}`)
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
    height: 20px;
    align-items: center;
    justify-content: center;
    background-color: setColor(red-1);
    border-radius: 2px;
    padding: 2px 8px;
    z-index: 1000;
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
    min-width: 171px;
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
    text-align: left;
    color: white;
    font-size: 14px;
    font-weight: 700;
    color: setColor(gray-4);
  }
}

.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.2s;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
