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
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 'a')}"
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
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 'h')}"
            @click="handleSelection('h')")
          svg-icon(iconName="heart"
              iconColor="white"
              iconWidth="20px")
          div(class="nav-item__text") 我的最愛
        sidebar-folder(v-for="folder in realFolders" :folder="folder" :level="0" :parents="[ROOT]"
                      @moveItem="handleMoveItem")
        div(class="nav-item" :class="{'bg-blue-1': (currentSelectedFolder === 't')}"
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
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import SidebarFolder from '@/components/navigation/mydesign/SidebarFolder.vue'
import designUtils from '@/utils/designUtils'
import { IFolder, IPathedDesign, IPathedFolder, IQueueItem } from '@/interfaces/design'

export default Vue.extend({
  components: {
    SidebarFolder
  },
  mounted() {
    this.setFolders(designUtils.makeDesignsForTesting())
  },
  data() {
    return {
      ROOT: designUtils.ROOT,
      isAllDraggedOver: false,
      isTrashDraggedOver: false
    }
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder',
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
        return this.folders[0].subFolders
      }
      return []
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrentSelectedFolder: 'SET_currSelectedFolder',
      setFolders: 'SET_folders'
    }),
    draggedOverStyles(type: string) {
      switch (type) {
        case 'a':
          return (this.isAllDraggedOver && this.currentSelectedFolder !== 'a') ? { 'background-color': '#2C2F43' } : {}
        case 't':
          return (this.isTrashDraggedOver && this.currentSelectedFolder !== 't') ? { 'background-color': '#2C2F43' } : {}
      }
    },
    handleSelection(selection: string) {
      this.setCurrentSelectedFolder(selection)
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
            const { path = [], design = undefined } = (this.draggingDesign as IPathedDesign | undefined) ?? {}
            if (!design) return
            if (this.isMultiSelected && this.selectedDesigns[design.id]) {
              designUtils.moveAll(Object.values(this.selectedDesigns), destination)
              this.$emit('moveItem', {
                type: 'multi',
                data: { path: destination, design }
              })
            } else {
              designUtils.move(design, path, destination)
              this.$emit('moveItem', {
                type: 'design',
                data: { path: destination, design }
              })
            }
          } else if (this.draggingType === 'folder') {
            const { parents = [], folder = undefined } = (this.draggingFolder as IPathedFolder | undefined) ?? {}
            if (!folder) return
            designUtils.moveFolder(folder, parents, destination)
            if (folder.isSelected) {
              this.setCurrentSelectedFolder(`f:${this.ROOT}/${folder.name}`)
            }
            this.$emit('moveItem', {
              type: 'folder',
              data: { parents: destination, folder }
            })
          }
          break
        case 't':
          this.isTrashDraggedOver = false
          if (this.draggingType === 'design') {
            const { path = [], design = undefined } = (this.draggingDesign as IPathedDesign | undefined) ?? {}
            if (!design) return
            if (this.isMultiSelected && this.selectedDesigns[design.id]) {
              this.$emit('deleteAll')
            } else {
              designUtils.delete({ path, design })
              this.$emit('deleteItem', {
                type: 'design',
                data: { path, design }
              })
            }
          } else if (this.draggingType === 'folder') {
            const { parents = [], folder = undefined } = (this.draggingFolder as IPathedFolder | undefined) ?? {}
            if (!folder) return
            this.$emit('deleteFolder', {
              pathedFolder: { parents, folder },
              empty: folder.designs.length + folder.subFolders.length === 0
            })
          }
          break
      }
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleNewFolder() {
      designUtils.addNewFolder(this.folders, [designUtils.ROOT])
    }
  }
})
</script>

<style lang="scss" scoped>
.sidebar {
  @include size(240px, 100%);
  background-color: setColor(nav);
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
}

.nav-item-new-folder {
  padding: 0px 67px 0px 18px;
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
    width: 100%;
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
</style>
