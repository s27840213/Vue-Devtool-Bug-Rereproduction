<template lang="pug">
  section
    div(:class="[`nav-folder-${level}`, {'bg-blue-1': folder.isSelected}]"
        :style="draggedOverStyles()"
        :draggable="true"
        @dragstart="handleDragStart"
        @drag="handleDragging"
        @dragend="handleDragEnd"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover.prevent
        @drop="handleDrop"
        @click="handleSelection")
      div(class="nav-folder__expand-icon-container"
          @click.stop="toggleExpansion")
        svg-icon(class="nav-folder__expand-icon"
            iconName="chevron-down"
            iconColor="white"
            iconWidth="15px"
            :style="expandIconStyles()")
      svg-icon(iconName="folder"
          iconColor="white"
          iconWidth="20px"
          style="pointer-events: none")
      div(:class="`nav-folder-${level}__text`"
          style="pointer-events: none") {{ folder.name }}
    sidebar-folder(v-for="subFolder in checkExpand(folder.subFolders)" :folder="subFolder" :level="level+1" :parents="[...parents, folder.name]")
    div(class="dragged-folder" :style="draggedFolderStyles()")
      div(class="nav-folder-0")
        svg-icon(iconName="folder"
          iconColor="white"
          iconWidth="20px"
          style="pointer-events: none")
        div(:class="`nav-folder-${level}__text`"
            style="pointer-events: none") {{ folder.name }}
</template>
<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFolder, IPathedDesign, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  name: 'sidebar-folder',
  components: {
  },
  data() {
    return {
      isDragged: false,
      isDraggedOver: false,
      draggedFolderCoordinate: { x: 0, y: 0 }
    }
  },
  props: {
    folder: Object,
    parents: Array,
    level: Number
  },
  computed: {
    ...mapGetters('design', {
      currentSelectedFolder: 'getCurrSelectedFolder',
      draggingType: 'getDraggingType',
      draggingDesign: 'getDraggingDesign',
      draggingFolder: 'getDraggingFolder',
      selectedDesigns: 'getSelectedDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrentSelectedFolder: 'SET_currSelectedFolder',
      setExpand: 'SET_expand',
      setDraggingFolder: 'SET_draggingFolder'
    }),
    expandIconStyles() {
      return this.folder.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    draggedOverStyles() {
      return (this.isDraggedOver && !this.folder.isSelected) ? { 'background-color': '#2C2F43' } : {}
    },
    draggedFolderStyles(): {[key: string]: string} {
      if (this.isDragged) {
        return {
          left: `${this.draggedFolderCoordinate.x}px`,
          top: `${this.draggedFolderCoordinate.y}px`,
          display: 'block'
        }
      } else {
        return {}
      }
    },
    handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '0'
      this.setDraggingFolder({
        parents: this.parents,
        folder: this.folder
      })
      document.addEventListener('dragover', this.preventDefaultDragOver, false)
    },
    handleDragging(e: DragEvent) {
      this.isDragged = true
      const target = e.target as HTMLElement
      target.style.opacity = '1'
      this.draggedFolderCoordinate = {
        x: e.pageX,
        y: e.pageY
      }
    },
    handleDragEnd() {
      this.isDragged = false
      this.setDraggingFolder(undefined)
      document.removeEventListener('dragover', this.preventDefaultDragOver, false)
    },
    preventDefaultDragOver(e: DragEvent) {
      e.preventDefault()
    },
    handleSelection() {
      this.setCurrentSelectedFolder(`f:${[...this.parents, this.folder.name].join('/')}`)
    },
    handleDragEnter() {
      this.isDraggedOver = true
    },
    handleDragLeave() {
      this.isDraggedOver = false
    },
    handleDrop() {
      this.isDraggedOver = false
      if (this.isDragged) return
      if (this.draggingType === 'design') {
        const { path = [], design = undefined } = (this.draggingDesign as IPathedDesign | undefined) ?? {}
        if (!design) return
        if (this.isMultiSelected && this.selectedDesigns[design.id]) {
          designUtils.moveAll(Object.values(this.selectedDesigns), [...(this.parents as string[]), this.folder.name as string])
        } else {
          designUtils.move(design, path, [...(this.parents as string[]), this.folder.name as string])
        }
      } else if (this.draggingType === 'folder') {
        const { parents = [], folder = undefined } = (this.draggingFolder as IPathedFolder | undefined) ?? {}
        if (!folder) return
        if (designUtils.isParentOrEqual({ parents, folder }, { parents: this.parents as string[], folder: this.folder as IFolder })) return
        designUtils.moveFolder(folder, parents, [...(this.parents as string[]), this.folder.name as string])
        if (folder.isSelected) {
          this.setCurrentSelectedFolder(`f:${[...(this.parents as string[]), this.folder.name as string, folder.name].join('/')}`)
        }
      }
    },
    toggleExpansion() {
      // const pseudoSelectInfo = `f:${[...this.parents, this.folder.name].join('/')}`
      // if (this.currentSelectedFolder.startsWith(pseudoSelectInfo) && this.currentSelectedFolder !== pseudoSelectInfo) return
      this.setExpand({
        path: [...this.parents, this.folder.name],
        isExpanded: !this.folder.isExpanded
      })
    },
    checkExpand(folders: IFolder[]): IFolder[] {
      if (this.folder.isExpanded) {
        return folders
      } else {
        return []
      }
    }
  }
})
</script>

<style lang="scss" scoped>
@function paddingForLevel($level) {
  @return 10px 10px 10px 25px * $level + 18px;
}

@function fontWeightForLevel($level) {
  @if $level == 0 {
    @return 700;
  } @else {
    @return 400;
  }
}

$maxLevels: 5;

@for $i from 0 through $maxLevels {
  .nav-folder-#{$i} {
    grid-template-columns: 15px 20px auto;
    padding: paddingForLevel($i);
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
      font-weight: fontWeightForLevel($i);
      letter-spacing: 2.5px;
      white-space: nowrap;
    }
  }
}
.nav-folder__expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
}
.nav-folder__expand-icon {
  transition: 0.1s linear
}
.dragged-folder {
  > .nav-folder-0 {
    grid-template-columns: 20px auto;
    margin-bottom: unset;
    padding-left: 10px;
  }
  display: none;
  position: fixed;
  transform: translate(-50%, -24px);
  pointer-events: none;
  z-index: 1000;
  border-radius: 6px;
  background-color: setColor(nav);
  box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
}
</style>
