<template lang="pug">
  div(class="trash-design-view")
    div(class="trash-design-view__title")
      div(class="trash-design-view__folder-name")
        span 垃圾桶
      div(class="trash-design-view__info"
          @click="toggleInfo()"
          v-click-outside="closeInfo")
        svg-icon(iconName="info"
                iconWidth="16px"
                iconColor="bu")
        transition(name="slide-fade-img")
          img(v-if="isInfoOpen" class="trash-design-view__info__arrow" :src="require('@/assets/img/svg/left-arrow.svg')")
        transition(name="slide-fade-text")
          div(v-if="isInfoOpen" class="trash-design-view__info__text")
            span 30天後自動永久刪除。
    div(class="horizontal-rule")
    div(v-if="allFolders.length > 0" class="trash-design-view__folder-header")
      div(class="trash-design-view__expand-icon-container"
          @click="toggleFoldersExpansion")
        svg-icon(:style="foldersExpansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="trash-design-view__folder-title")
        span 資料夾
    div(v-if="foldersExpanded && allFolders.length > 0" class="trash-design-view__folders")
      folder-item(v-for="[parents, folder] in allFolders"
                  :path="parents"
                  :config="folder"
                  :undraggable="true"
                  :undroppable="true"
                  @moveItem="handleMoveItem")
    div(v-if="allDesigns.length > 0" class="trash-design-view__design-header")
      div(class="trash-design-view__expand-icon-container"
          @click="toggleDesignsExpansion")
        svg-icon(:style="designsExpansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="trash-design-view__design-title")
        span 設計
    div(v-if="designsExpanded" class="trash-design-view__designs")
      design-item(v-for="[path, design] in allDesigns"
                  :key="design.id"
                  :path="path"
                  :config="design"
                  :favorable="false"
                  :undraggable="true"
                  :menuItemNum="menuItemSlots.length")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, path, design)")
            div(class="design-menu-item__icon")
              svg-icon(:iconName="menuItemSlot.icon"
                      iconWidth="10px"
                      iconColor="gray-2")
            div(class="design-menu-item__text")
              span {{ menuItemSlot.text }}
            div(v-if="menuItemSlot.extendable" class="design-menu-item__right")
              svg-icon(iconName="chevron-right"
                      iconWidth="10px"
                      iconColor="gray-2")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import { IDesign, IFolder, IPathedDesign, IPathedFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import FolderItem from '@/components/navigation/mydesign/FolderItem.vue'
import DesignItem from '@/components/navigation/mydesign/DesignItem.vue'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: {
    FolderItem,
    DesignItem
  },
  data() {
    return {
      foldersExpanded: true,
      designsExpanded: true,
      isInfoOpen: false,
      menuItems: designUtils.makeTrashMenuItems()
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders',
      trashDesigns: 'getTrashDesigns',
      trashFolders: 'getTrashFolders',
      selectedDesigns: 'getSelectedDesigns'
    }),
    allDesigns(): [string[], IDesign][] {
      const designs = generalUtils.deepCopy(this.trashDesigns) as IPathedDesign[]
      designUtils.sortDesignsBy(designs, 'time', true)
      return designs.map((item) => [item.path, item.design])
    },
    allFolders(): [string[], IFolder][] {
      const folders = generalUtils.deepCopy(this.trashFolders) as IPathedFolder[]
      designUtils.sortFoldersBy(folders, 'time', true)
      return folders.map((item) => [item.parents, item.folder])
    },
    menuItemSlots(): {name: string, icon: string, text: string}[] {
      return this.menuItems.map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    }
  },
  methods: {
    // ...mapMutations('design', {
    // }),
    foldersExpansionIconStyles() {
      return this.foldersExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    designsExpansionIconStyles() {
      return this.designsExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    handleDesignMenuAction(icon: string, path: string[], design: IDesign) {
      if (icon === 'trash') {
        this.$emit('deleteForever', { path, design })
        return
      }
      if (icon === 'reduction') {
        this.$emit('recoverItem', {
          type: 'design',
          data: { path, design }
        })
      }
      designUtils.dispatchDesignMenuAction(icon, path, design)
    },
    handleMoveItem(item: IQueueItem) {
      this.$emit('moveItem', item)
    },
    toggleFoldersExpansion() {
      this.foldersExpanded = !this.foldersExpanded
    },
    toggleDesignsExpansion() {
      this.designsExpanded = !this.designsExpanded
    },
    toggleInfo() {
      this.isInfoOpen = !this.isInfoOpen
    },
    closeInfo() {
      this.isInfoOpen = false
    }
  }
})
</script>

<style lang="scss" scoped>
.trash-design-view {
  text-align: left;
  font-family: NotoSansTC;
  overflow-y: auto;
  > div {
    margin-left: 55px;
    margin-right: 65px;
  }
  &__title {
    margin-top: 94px;
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 5px;
  }
  &__folder-name {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    > span {
      font-size: 24px;
      font-weight: 700;
      line-height: 40px;
      letter-spacing: 0.205em;
      color: setColor(bu);
    }
  }
  &__folder-header, &__design-header {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 20px;
  }
  &__folder-title, &__design-title {
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
  &__designs {
    display: grid;
    grid-gap: 25px;
    justify-items: stretch;
    width: calc(100% - 120px);
    margin-bottom: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    @media(min-width: 976px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media(min-width: 1260px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @media(min-width: 1560px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
  &__info {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    &__arrow {
      position: absolute;
      left: calc(100% + 2px);
      width: 10.39px;
      height: 14.5px;
    }
    &__text {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: calc(100% + 11.5px);
      padding: 0px 8px;
      height: 28px;
      background-color: setColor(gray-2);
      border-radius: 5px;
      > span {
        font-family: Mulish;
        font-weight: 400;
        font-size: 12px;
        line-height: 28px;
        white-space: nowrap;
        color: white;
      }
    }
  }
}

.header-icon{
  cursor: pointer;
  &:hover {
    color: setColor(blue-1);
    background-color: setColor(gray-6);
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 120px);
  margin-top: 21px;
  margin-bottom: 58px;
}

.slide-fade-img, .slide-fade-text {
  &-enter-active, &-leave-active {
    transition: .2s;
  }
  &-enter, &-leave-to {
    opacity: 0;
  }
}

.slide-fade-img-enter, .slide-fade-img-leave-to {
  left: 100%
}

.slide-fade-text-enter, .slide-fade-text-leave-to {
  left: calc(100% + 9px);
}
</style>
