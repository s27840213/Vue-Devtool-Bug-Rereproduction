<template lang="pug">
div(class="folder-item")
  div(class="folder-item__block"
      :class="isMouseOver ? 'block-over' : 'block'"
      :style="{'cursor' : isTempFolder ? 'not-allowed' : ''}"
      :draggable="!undraggable && !isTempFolder"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd"
      v-on="undroppable || isTempFolder ? {} : { dragenter: handleDragEnter, dragleave: handleDragLeave }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @dragover.prevent
      @drop="handleDrop"
      @click="emitGoto")
    svg-icon(style="pointer-events: none"
            iconName="folder"
            iconWidth="24px"
            iconColor="gray-2")
    div(class="folder-item__controller")
      div(class="folder-item__controller-content")
        div(v-if="isSelected"
          class="folder-item__checkbox-checked"
          @click.stop="emitDeselect")
          svg-icon(iconName="done"
                  iconWidth="10px"
                  iconHeight="8px"
                  iconColor="white")
        div(v-if="menuItems.length > 0 && !isSelected && (isMouseOver || isAnySelected)"
          class="folder-item__checkbox"
          @click.stop="emitSelect")
        div(v-if="menuItems.length > 0 && isMouseOver"
          class="folder-item__more"
          @click.stop="toggleMenu()")
          svg-icon(iconName="more_vertical"
                  iconWidth="24px"
                  iconColor="gray-2")
        div(v-if="menuItems.length > 0 && isMenuOpen && isMouseOver"
            class="folder-item__menu"
            v-click-outside="closeMenu")
          slot(v-for="(dummy, index) in menuItems" :name="`i${index}`") {{ index }}
  div(ref="nameblock"
      class="folder-item__name"
      :folderid="config.id"
      v-click-outside="() => { isNameEditing && handleNameEditEnd() }")
    input(ref="name"
          v-if="isNameEditing"
          v-model="editableName"
          @change="handleNameEditEnd"
          @keyup="checkNameEnter")
    span(v-else
        :title="config.name"
        @dblclick="handleNameEditStart"
        @click.right.stop.prevent="handleNameEditStart") {{ config.name }}
  transition(name="fade")
    div(v-if="isShowHint" class="folder-item__name-hint" :style="hintStyles()")
      span {{$t('NN0226')}}
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
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import { IDesign, IFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'

export default defineComponent({
  props: {
    path: Array,
    config: Object,
    menuItemNum: Number,
    undraggable: Boolean,
    undroppable: Boolean,
    nameIneditable: Boolean,
    isAnySelected: Boolean,
    isSelected: Boolean,
    index: Number
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      isDragged: false,
      isMouseOver: false,
      isNameEditing: false,
      isMenuOpen: false,
      editableName: '',
      isShowHint: false,
      messageTimer: -1,
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
    },
    menuItems(): any[] {
      return Array(this.menuItemNum ?? 0)
    },
    isTempFolder(): boolean {
      return this.config.id.endsWith('_new')
    }
  },
  watch: {
    'config.name': {
      handler: function (newVal) {
        this.editableName = newVal
      }
    }
  },
  methods: {
    ...mapMutations('design', {
      setDraggingFolder: 'SET_draggingFolder',
      removeFolder: 'UPDATE_removeFolder',
      deleteFolder: 'UPDATE_deleteFolder'
    }),
    emitGoto(e: MouseEvent) {
      if (this.isAnySelected) {
        if (e.shiftKey) {
          this.$emit('metaSelectFolder')
          return
        }
        this.$emit(this.isSelected ? 'deselect' : 'select')
        return
      }
      if (this.isTempFolder) return
      this.$emit('goto')
    },
    draggedFolderStyles(): { [key: string]: string } {
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
    hintStyles(): { [key: string]: string } {
      const nameblock = (this.$refs.nameblock as HTMLElement)
      if (nameblock) {
        const rect = nameblock.getBoundingClientRect()
        return { top: `${rect.top + rect.height + 10}px`, left: `${rect.left + rect.width / 2}px` }
      } else {
        return { top: '0', left: '0' }
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
    handleDragEnter() {
      if (this.folderUndroppable()) return
      this.handleMouseEnter()
    },
    handleDragLeave() {
      if (this.folderUndroppable()) return
      this.handleMouseLeave()
    },
    handleMouseEnter() {
      if (this.isTempFolder) return
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
      this.isMenuOpen = false
    },
    handleDrop() {
      this.isMouseOver = false
      if (this.folderUndroppable() || this.undroppable || this.isDragged) return
      const destination = designUtils.appendPath(this.path as string[], this.config as IFolder)
      if (this.draggingType === 'design') {
        const design = this.draggingDesign as IDesign | undefined
        if (!design) return
        if (this.isMultiSelected && this.selectedDesigns[design.asset_index.toString()]) {
          designUtils.moveAll(Object.values(this.selectedDesigns), destination)
          this.$emit('moveItem', {
            type: 'multi',
            data: design,
            dest: this.config.name
          })
        } else {
          designUtils.move(design, destination)
          this.$emit('moveItem', {
            type: 'design',
            data: design,
            dest: this.config.name
          })
        }
      } else if (this.draggingType === 'folder') {
        if (!this.draggingFolder) return
        if (designUtils.isParentOrEqual(this.draggingFolder, { parents: this.path as string[], folder: this.config as IFolder })) return
        designUtils.moveFolder(this.draggingFolder, destination).then(() => {
          this.$emit('moveItem', {
            type: 'folder',
            data: this.draggingFolder.folder,
            dest: this.config.name
          })
        })
      }
    },
    handleNameEditStart() {
      if (this.nameIneditable) return
      this.editableName = this.config.name
      this.isNameEditing = true
      this.$nextTick(() => {
        const nameInput = this.$refs.name as HTMLInputElement
        nameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.config.id.endsWith('_new')) {
        if (this.editableName === '') {
          this.removeFolder({
            parents: this.path,
            folder: this.config
          })
          this.deleteFolder(this.config)
        } else {
          designUtils.createFolder(this.path as string[], this.config, this.editableName)
        }
      } else {
        if (this.editableName === '' || this.editableName === this.config.name) return
        this.checkNameLength()
        designUtils.setFolderName(this.config, this.editableName, this.path as string[])
      }
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.config.name) {
        this.handleNameEditEnd()
      }
      this.checkNameLength()
    },
    checkNameLength() {
      if (this.editableName.length > 64) {
        this.editableName = this.editableName.substring(0, 64)
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
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
    },
    emitSelect(e: MouseEvent) {
      if (e.shiftKey) {
        this.$emit('metaSelectFolder')
        return
      }
      this.$emit('select')
    },
    emitDeselect(e: MouseEvent) {
      if (e.shiftKey) {
        this.$emit('metaSelectFolder')
        return
      }
      this.$emit('deselect')
    },
    folderUndroppable(): boolean {
      return (designUtils.isMaxLevelReached(this.path.length - 1) && this.draggingFolder) || this.isTempFolder
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  &__block {
    position: relative;
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
  &__controller {
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    height: 100%;
    &-content {
      position: relative;
      width: 100%;
      height: 100%;
    }
  }
  &__checkbox {
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: white;
    left: 6px;
    top: 7px;
    border: 1px solid #969bab;
    box-sizing: border-box;
    cursor: pointer;
  }
  &__checkbox-checked {
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: setColor(blue-1);
    left: 6px;
    top: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  &__more {
    position: absolute;
    width: 15px;
    height: 15px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    right: 6px;
    top: 7px;
    cursor: pointer;
  }
  &__menu {
    position: absolute;
    min-width: 77px;
    box-sizing: border-box;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: white;
    box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
    left: 100%;
    top: 7px;
    z-index: 2;
    & .folder-menu-item {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: start;
      gap: 5px;
      padding: 6px 0;
      cursor: pointer;
      &:hover {
        background-color: setColor(gray-5);
      }
      &__icon {
        margin-left: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 10px;
        height: 10px;
      }
      &__text {
        display: flex;
        align-items: center;
        justify-content: start;
        height: 12px;
        transform: scale(0.8);
        transform-origin: left;
        > span {
          font-weight: 400;
          font-size: 12px;
          line-height: 12px;
          color: setColor(gray-2);
          white-space: nowrap;
        }
      }
      &__right {
        position: absolute;
        right: 3px;
        top: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-50%);
      }
    }
  }
  &__name {
    width: 120px;
    height: 40px;
    display: flex;
    align-items: start;
    justify-content: center;
    > span {
      text-align: center;
      font-size: 12px;
      font-weight: 400;
      color: setColor(gray-1);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
    }
    > input {
      width: 108px;
      text-align: center;
      font-size: 12px;
      font-weight: 400;
      color: setColor(gray-1);
      padding: 0 5px;
      background-color: setColor(gray-5);
      border: 1px solid setColor(gray-4);
      box-sizing: border-box;
      border-radius: 2px;
    }
  }
  &__name-hint {
    position: fixed;
    display: flex;
    transform: translate(-50%);
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
