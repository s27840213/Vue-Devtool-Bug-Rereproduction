<template lang="pug">
div(v-if="allFolders.length > 0 || isFoldersLoading" class="folder-gallery")
  div(v-if="allFolders.length > 0" class="folder-gallery__header")
    div(class="folder-gallery__expand-icon-container"
        @click="toggleExpansion")
      svg-icon(:style="expansionIconStyles()"
              iconName="caret-down"
              iconWidth="10px"
              iconHeight="5px"
              iconColor="gray-2")
    div(class="folder-gallery__title")
      span {{$tc('NN0253', 2)}}
  div(v-if="isExpanded" class="folder-gallery__folders")
    folder-item(v-for="(folder, index) in allFolders"
                :path="path"
                :config="folder"
                :index="index"
                @goto="handleGotoFolder(folder.id)"
                :undraggable="limitFunctions"
                :undroppable="limitFunctions"
                :nameIneditable="limitFunctions"
                :isSelected="checkFolderSelected(folder.id)"
                :isAnySelected="isAnySelected"
                :menuItemNum="menuItemSlots.length"
                @moveItem="handleMoveItem"
                @select="selectFolder(folder)"
                @deselect="deselectFolder(folder)"
                @metaSelectFolder="metaSelectFolder(index)")
      template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
        div(class="folder-menu-item" @click="handleFolderMenuAction(menuItemSlot.icon, folder)")
          div(class="folder-menu-item__icon")
            svg-icon(:iconName="menuItemSlot.icon"
                    iconWidth="10px"
                    iconColor="gray-2")
          div(class="folder-menu-item__text")
            span {{ menuItemSlot.text }}
          div(v-if="menuItemSlot.extendable" class="folder-menu-item__right")
            svg-icon(iconName="chevron-right"
                    iconWidth="10px"
                    iconColor="gray-2")
  div(v-if="isExpanded && isFoldersLoading" class="folder-gallery__loading")
    svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import FolderItem from '@/components/mydesign/FolderItem.vue'

export default defineComponent({
  components: {
    FolderItem
  },
  data() {
    return {
      isExpanded: true
    }
  },
  props: {
    path: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    },
    menuItems: {
      type: Array,
      required: true
    },
    allFolders: {
      type: Array as PropType<IFolder[]>,
      required: true
    },
    selectedNum: {
      type: Number,
      required: true
    },
    limitFunctions: {
      type: Boolean,
      default: false
    },
    useDelete: {
      type: Boolean,
      default: false
    },
    selectable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['menuAction', 'moveItem'],
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      selectedFolders: 'getSelectedFolders',
      isFoldersLoading: 'getIsFoldersLoading'
    }),
    menuItemSlots(): {name: string, icon: string, text: string, extendable?: boolean}[] {
      return (this.menuItems as {icon: string, text: string, extendable?: boolean}[]).map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    },
    isAnySelected(): boolean {
      return this.selectedNum > 0 && this.selectable
    }
  },
  methods: {
    ...mapMutations('design', {
      setExpand: 'SET_expand',
      setCurrLocation: 'SET_currLocation',
      addFolderToSelection: 'UPDATE_addFolderToSelection',
      removeFolderFromSelection: 'UPDATE_removeFolderFromSelection',
      metaSelectFolder_: 'UPDATE_metaSelectFolder'
    }),
    expansionIconStyles() {
      return this.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    handleFolderMenuAction(icon: string, folder: IFolder) {
      if (this.useDelete && icon === 'trash') icon = 'delete'
      designUtils.dispatchFolderMenuAction(icon, folder, (extraEvent) => {
        if (extraEvent) {
          this.$emit('menuAction', extraEvent)
        }
      })
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleGotoFolder(id: string) {
      if (this.currLocation === 't') return
      this.setCurrLocation(`${this.currLocation}/${id}`)
      this.setExpand({
        path: this.path,
        isExpanded: true
      })
    },
    toggleExpansion() {
      this.isExpanded = !this.isExpanded
    },
    checkFolderSelected(id: string): boolean {
      return !!this.selectedFolders[id] && this.selectable
    },
    selectFolder(folder: IFolder) {
      if (!this.selectable) return
      this.addFolderToSelection(folder)
    },
    deselectFolder(folder: IFolder) {
      if (!this.selectable) return
      this.removeFolderFromSelection(folder)
    },
    metaSelectFolder(index: number) {
      if (!this.selectable) return
      this.metaSelectFolder_({
        folders: this.allFolders,
        index
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.folder-gallery {
  &__header {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 20px;
  }
  &__title {
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
    gap: 20px;
    margin-bottom: 45px;
    flex-wrap: wrap;
  }
  &__loading {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}

.folder-menu-item {
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
</style>
