<template lang="pug">
  div(class="folder-item")
    div(class="folder-item__block"
        :class="isMouseOver ? 'block-over' : 'block'"
        :draggable="!undraggable"
        @dragstart="handleDragStart"
        @drag="handleDragging"
        @dragend="handleDragEnd"
        v-on="undroppable ? {} : { dragenter: handleMouseEnter, dragleave: handleMouseLeave }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @dragover.prevent
        @drop="handleDrop"
        @click="emitGoto")
      svg-icon(style="pointer-events: none"
              iconName="folder"
              iconWidth="24px"
              iconColor="gray-2")
    div(class="folder-item__name")
      span {{ config.name }}
    div(class="dragged-folder" :style="draggedFolderStyles()")
      div
        div(class="dragged-folder__icon")
          svg-icon(style="pointer-events: none"
                iconName="folder"
                iconWidth="24px"
                iconColor="gray-2")
        div(class="dragged-folder__name")
          span {{ config.name }}
</template>

<script lang="ts">
import { IFolder, IPathedDesign, IPathedFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    path: Array,
    config: Object,
    undraggable: Boolean,
    undroppable: Boolean
  },
  data() {
    return {
      isDragged: false,
      isMouseOver: false,
      draggedFolderCoordinate: { x: 0, y: 0 }
    }
  },
  computed: {
    ...mapGetters('design', {
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
      setDraggingFolder: 'SET_draggingFolder'
    }),
    emitGoto() {
      this.$emit('goto')
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
        parents: this.path,
        folder: this.config
      })

      if (!e.dataTransfer) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'

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
    handleMouseEnter() {
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
    },
    handleDrop() {
      this.isMouseOver = false
      if (this.undroppable) return
      if (this.isDragged) return
      const destination = designUtils.appendPath(this.path as string[], this.config as IFolder)
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
        if (designUtils.isParentOrEqual({ parents, folder }, { parents: this.path as string[], folder: this.config as IFolder })) return
        designUtils.moveFolder(folder, parents, destination)
        this.$emit('moveItem', {
          type: 'folder',
          data: { parents: destination, folder }
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-item {
  &__block {
    width: 63px;
    height: 63px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-radius: 4px;
    cursor: pointer;
  }
  &__name {
    width: 63px;
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      text-align: center;
      font-family: Mulish;
      font-size: 14px;
      font-weight: 400;
      color: setColor(gray-1);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
    }
  }
}

.dragged-folder {
  display: none;
  position: fixed;
  transform: translate(-50%, -24px);
  pointer-events: none;
  z-index: 1000;
  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
  }
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
  }
  &__name {
    width: 63px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
    margin-left: 5px;
    margin-right: 5px;
    > span {
      text-align: center;
      font-family: Mulish;
      font-size: 14px;
      font-weight: 400;
      color: setColor(gray-1);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
    }
  }
}

.block {
  border: 1px solid setColor(gray-4);
}

.block-over {
  border: none;
  background-color: setColor(gray-5);
}
</style>
