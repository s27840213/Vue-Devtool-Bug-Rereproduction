<template lang="pug">
  div(class="folder-gallery")
    div(v-if="allFolders.length > 0" class="folder-gallery__header")
      div(class="folder-gallery__expand-icon-container"
          @click="toggleExpansion")
        svg-icon(:style="expansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="folder-gallery__title")
        span 資料夾
    div(v-if="isExpanded" class="folder-gallery__folders")
      folder-item(v-for="[parents, folder] in allFolders"
                  :path="parents"
                  :config="folder"
                  @goto="handleGotoFolder(folder.id)"
                  :undraggable="limitFunctions"
                  :undroppable="limitFunctions"
                  :nameIneditable="limitFunctions"
                  :isSelected="checkFolderSelected(folder.id)"
                  :isAnySelected="isAnySelected"
                  :menuItemNum="menuItemSlots.length"
                  @moveItem="handleMoveItem"
                  @select="selectFolder(parents, folder)"
                  @deselect="deselectFolder(parents, folder)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="folder-menu-item" @click="handleFolderMenuAction(menuItemSlot.icon, parents, folder)")
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
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import FolderItem from '@/components/mydesign/FolderItem.vue'

export default Vue.extend({
  components: {
    FolderItem
  },
  data() {
    return {
      isExpanded: true
    }
  },
  props: {
    path: Array,
    menuItems: Array,
    allFolders: Array,
    selectedNum: Number,
    limitFunctions: Boolean,
    useDelete: Boolean,
    selectable: Boolean
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      selectedFolders: 'getSelectedFolders'
    }),
    menuItemSlots(): {name: string, icon: string, text: string}[] {
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
      removeFolderFromSelection: 'UPDATE_removeFolderFromSelection'
    }),
    expansionIconStyles() {
      return this.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    handleFolderMenuAction(icon: string, parents: string[], folder: IFolder) {
      if (this.useDelete && icon === 'trash') icon = 'delete'
      const extraEvent = designUtils.dispatchFolderMenuAction(icon, parents, folder)
      if (extraEvent) {
        this.$emit('menuAction', extraEvent)
      }
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    handleGotoFolder(id: string) {
      this.setExpand({
        path: this.path,
        isExpanded: true
      })
      this.setCurrLocation(`${this.currLocation}/${id}`)
    },
    toggleExpansion() {
      this.isExpanded = !this.isExpanded
    },
    checkFolderSelected(id: string): boolean {
      return !!this.selectedFolders[id] && this.selectable
    },
    selectFolder(parents: string[], folder: IFolder) {
      if (!this.selectable) return
      this.addFolderToSelection({ parents, folder })
    },
    deselectFolder(parents: string[], folder: IFolder) {
      if (!this.selectable) return
      this.removeFolderFromSelection({ parents, folder })
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
    gap: 30px;
    margin-bottom: 45px;
  }
}
</style>
