<template lang="pug">
section
  div(class="nav-folder"
      :class="[`nav-folder-${level}`, {'bg-blue-1': folder.isCurrLocation}]"
      :style="draggedOverStyles()"
      :draggable="!isNameEditing && !isTempFolder"
      :folderid="folder.id"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover.prevent
      @drop="handleDrop"
      @click="handleSelection"
      @click.right.prevent="handleNameEditStart")
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
    input(ref="name"
          :class="`nav-folder-${level}__input`"
          v-if="isNameEditing"
          v-model="editableName"
          v-click-outside="handleNameEditEnd"
          @change="handleNameEditEnd"
          @keyup="checkNameEnter"
          @click.stop
          @click.right.stop)
    div(v-else
        :class="`nav-folder-${level}__text`"
        style="pointer-events: none") {{ folder.name }}
  sidebar-folder(v-for="subFolder in checkExpand(realFolders)"
    :key="subFolder.id"
    :folder="subFolder" :level="level+1" :parents="[...parents, folder.id]"
    @moveItem="handleMoveItem"
    @showHint="handleShowHint")
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
import { IDesign, IFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import vClickOutside from 'click-outside-vue3'
import { PropType, defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  name: 'sidebar-folder',
  components: {
  },
  data() {
    return {
      isDragged: false,
      isDraggedOver: false,
      isNameEditing: false,
      editableName: '',
      draggedFolderCoordinate: { x: 0, y: 0 },
      lastOnId: ''
    }
  },
  props: {
    folder: {
      type: Object as PropType<IFolder>,
      required: true
    },
    parents: {
      type: Array,
      required: true
    },
    level: {
      type: Number,
      required: true
    }
  },
  emits: ['moveItem', 'showHint'],
  directives: {
    clickOutside: vClickOutside.directive
  },
  watch: {
    'folder.isExpanded': function(newVal) {
      if (newVal) {
        this.fetchStructuralFolders({ path: `${designUtils.appendPath(this.parents as string[], this.folder as IFolder).slice(1).join(',')}` })
      }
    },
    'folder.id': function(newVal) {
      designUtils.off(`edit-sidebar-${this.lastOnId}`)
      this.lastOnId = newVal
      designUtils.on(`edit-sidebar-${newVal}`, () => {
        this.handleNameEditStart()
      })
    }
  },
  mounted() {
    this.lastOnId = this.folder.id
    designUtils.on(`edit-sidebar-${this.folder.id}`, () => {
      this.handleNameEditStart()
    })
  },
  unmounted() {
    designUtils.off(this.lastOnId)
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
      return designUtils.sortByCreateTime([...this.folder.subFolders])
    },
    isTempFolder(): boolean {
      return this.folder.id.endsWith('_new')
    }
  },
  methods: {
    ...mapActions('design', {
      fetchStructuralFolders: 'fetchStructuralFolders'
    }),
    ...mapMutations('design', {
      setCurrLocation: 'SET_currLocation',
      setExpand: 'SET_expand',
      setDraggingFolder: 'SET_draggingFolder',
      removeFolder: 'UPDATE_removeFolder'
    }),
    expandIconStyles() {
      return this.folder.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    draggedOverStyles() {
      return {
        'background-color': (this.isDraggedOver && !this.folder.isCurrLocation) ? 'rgba(78, 171, 230, 0.3)' : '',
        cursor: this.isTempFolder ? 'not-allowed' : ''
      }
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
    handleSelection() {
      if (this.isTempFolder) return
      this.setCurrLocation(`f:${designUtils.appendPath(this.parents as string[], this.folder as IFolder).join('/')}`)
    },
    handleDragEnter() {
      if (this.folderUndroppable()) return
      this.isDraggedOver = true
    },
    handleDragLeave() {
      if (this.folderUndroppable()) return
      this.isDraggedOver = false
    },
    handleDrop() {
      this.isDraggedOver = false
      if (this.folderUndroppable() || this.isDragged) return
      const destination = designUtils.appendPath(this.parents as string[], this.folder as IFolder)
      if (this.draggingType === 'design') {
        const design = this.draggingDesign as IDesign | undefined
        if (!design) return
        if (this.isMultiSelected && this.selectedDesigns[design.asset_index.toString()]) {
          designUtils.moveAll(Object.values(this.selectedDesigns), destination)
          this.$emit('moveItem', {
            type: 'multi',
            data: design,
            dest: this.folder.name
          })
        } else {
          designUtils.move(design, destination)
          this.$emit('moveItem', {
            type: 'design',
            data: design,
            dest: this.folder.name
          })
        }
      } else if (this.draggingType === 'folder') {
        if (!this.draggingFolder) return
        if (designUtils.isParentOrEqual(this.draggingFolder, { parents: this.parents as string[], folder: this.folder as IFolder })) return
        designUtils.moveFolder(this.draggingFolder, destination).then(() => {
          if (this.draggingFolder.folder.isCurrLocation) {
            this.setCurrLocation(`f:${designUtils.appendPath(destination, this.draggingFolder.folder as IFolder).join('/')}`)
          }
          this.$emit('moveItem', {
            type: 'folder',
            data: this.draggingFolder.folder,
            dest: this.folder.name
          })
        })
      }
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleNameEditStart() {
      this.editableName = this.folder.name
      this.isNameEditing = true
      this.$nextTick(() => {
        const nameInput = this.$refs.name as HTMLInputElement
        const nav = document.querySelector('.nav') as HTMLElement
        if (nav) {
          nav.click()
        }
        nameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.isTempFolder) {
        if (this.editableName === '') {
          this.removeFolder({
            parents: this.parents,
            folder: this.folder
          })
        } else {
          designUtils.createFolder(this.parents as string[], this.folder, this.editableName)
        }
      } else {
        if (this.editableName === '' || (this.editableName === this.folder.name)) return
        this.checkNameLength()
        designUtils.setFolderName(this.folder, this.editableName, this.parents as string[])
      }
    },
    handleShowHint(folderId: string) {
      this.$emit('showHint', folderId)
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.folder.name) {
        this.handleNameEditEnd()
      }
      this.checkNameLength()
    },
    checkNameLength() {
      if (this.editableName.length > 64) {
        this.editableName = this.editableName.substring(0, 64)
        this.$emit('showHint', this.folder.id)
      }
    },
    toggleExpansion() {
      this.setExpand({
        path: designUtils.appendPath(this.parents as string[], this.folder as IFolder),
        isExpanded: !this.folder.isExpanded
      })
    },
    checkExpand(folders: IFolder[]): IFolder[] {
      if (this.folder.isExpanded) {
        return designUtils.sortByCreateTime([...folders])
      } else {
        return []
      }
    },
    folderUndroppable(): boolean {
      return (designUtils.isMaxLevelReached(this.level) && this.draggingFolder) || this.isTempFolder
    }
  }
})
</script>

<style lang="scss" scoped>
@function paddingForLevel($level) {
  @return 0 10px 0 25px * $level + 33px;
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
    height: 40px;
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
      font-weight: fontWeightForLevel($i);
      letter-spacing: 2.5px;
      white-space: nowrap;
    }
    &__input {
      width: 144px;
      padding: 4px 5px;
      text-align: left;
      color: white;
      font-size: 14px;
      font-weight: fontWeightForLevel($i);
      letter-spacing: 2.5px;
      background-color: setColor(nav-input);
      border: 1px solid #606A95;
      box-sizing: border-box;
      border-radius: 2px;
    }
  }
}
.nav-folder {
  &__expand-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  }
  &__expand-icon {
    transition: 0.1s linear
  }
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

.fade {
  &-enter-active, &-leave-active {
    transition: .2s;
  }
  &-enter-from, &-leave-to {
    opacity: 0;
  }
}
</style>
