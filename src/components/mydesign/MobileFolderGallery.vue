<template lang="pug">
div(v-if="allFolders.length > 0 || isFoldersLoading" class="mobile-folder-gallery")
  div(v-if="!noHeader && allFolders.length > 0" class="mobile-folder-gallery__header")
    div(class="mobile-folder-gallery__title")
      span {{$tc('NN0253', 2)}}
    div(class="mobile-folder-gallery__expand-icon-container"
        @click="toggleExpansion")
      svg-icon(:style="expansionIconStyles()"
              iconName="chevron-left"
              iconWidth="24px"
              iconColor="gray-2")
  div(v-if="isExpanded" class="mobile-folder-gallery__folders")
    mobile-folder-item(v-for="(folder, index) in allFolders"
                :path="path"
                :config="folder"
                :index="index"
                @goto="handleGotoFolder(folder.id)"
                :isSelected="checkFolderSelected(folder.id)"
                :isAnySelected="isAnySelected"
                @select="selectFolder(folder)"
                @deselect="deselectFolder(folder)")
  div(v-if="isExpanded && isFoldersLoading" class="mobile-folder-gallery__loading")
    svg-icon(iconName="loading"
              iconWidth="32px"
              iconColor="gray-3")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import MobileFolderItem from '@/components/mydesign/MobileFolderItem.vue'

export default defineComponent({
  components: {
    MobileFolderItem
  },
  data() {
    return {
      isExpanded: true
    }
  },
  props: {
    path: {
      type: Array,
      required: true
    },
    allFolders: {
      type: Array,
      required: true
    },
    selectedNum: {
      type: Number,
      required: true
    },
    noHeader: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      selectedFolders: 'getSelectedFolders',
      isFoldersLoading: 'getIsFoldersLoading'
    }),
    isAnySelected(): boolean {
      return this.selectedNum > 0
    }
  },
  methods: {
    ...mapMutations('design', {
      setCurrLocation: 'SET_currLocation',
      addFolderToSelection: 'UPDATE_addFolderToSelection',
      removeFolderFromSelection: 'UPDATE_removeFolderFromSelection'
    }),
    expansionIconStyles() {
      return this.isExpanded ? { transform: 'rotate(90deg)' } : { transform: 'rotate(-90deg)' }
    },
    handleGotoFolder(id: string) {
      if (this.currLocation === 't') return
      if (this.currLocation === 'l') {
        this.setCurrLocation(`f:${designUtils.ROOT}/${id}`)
      } else {
        this.setCurrLocation(`${this.currLocation}/${id}`)
      }
    },
    toggleExpansion() {
      this.isExpanded = !this.isExpanded
    },
    checkFolderSelected(id: string): boolean {
      return !!this.selectedFolders[id]
    },
    selectFolder(folder: IFolder) {
      this.addFolderToSelection(folder)
    },
    deselectFolder(folder: IFolder) {
      this.removeFolderFromSelection(folder)
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-folder-gallery {
  margin-top: 16px;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 24px;
    padding-right: 16px;
    margin-top: 8px;
    margin-bottom: 21px;
  }
  &__title {
    display: flex;
    align-items: center;
    height: 20px;
    > span {
      line-height: 20px;
      font-size: 14px;
      font-weight: 600;
      color: setColor(gray-2);
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
    flex-direction: column;
  }
  &__loading {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}
</style>
