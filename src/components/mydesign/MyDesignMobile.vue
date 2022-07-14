<template lang="pug">
  div(class="my-design-mobile")
    div(class="my-design-mobile__nav-bar relative")
      div(class="my-design-mobile__nav-bar__prev pointer"
          @click="handlePrevPage")
        svg-icon(iconName="chevron-left" iconColor="gray-1" iconWidth="24px")
      div(class="my-design-mobile__nav-bar__title" :title="title") {{ title }}
      div(class="my-design-mobile__nav-bar__menu")
        div(v-for="button in menuButtons"
            class="my-design-mobile__nav-bar__menu-button pointer"
            @click="button.action")
          svg-icon(:iconName="button.icon"
                    iconColor="gray-1"
                    :iconWidth="renderedWidth(button)"
                    :iconHeight="renderedHeight(button)")
    div(class="my-design-mobile__content")
      component(v-if="currLocation !== ''"
                :is="mydesignView"
                class="design-view"
                @deleteItem="handleDeleteItem"
                @clearSelection="handleClearSelection"
                @recoverItem="handleRecoverItem"
                @deleteFolder="handleDeleteFolder"
                @moveItem="handleMoveItem"
                @deleteForever="handleDeleteForever"
                @deleteFolderForever="handleDeleteFolderForever"
                @moveDesignToFolder="handleMoveDesignToFolder"
                @downloadDesign="handleDownloadDesign")
    div(class="my-design-mobile__tab-bar")
      div(v-for="tabButton in tabButtons"
          class="my-design-mobile__tab-button pointer"
          :class="{active: tabButton.condition(currLocation)}"
          @click="handleGoTo(tabButton.tab)")
        svg-icon(:iconName="tabButton.icon"
                  iconColor="gray-2"
                  iconWidth="24px")
        div(class="my-design-mobile__tab-button__text") {{ tabButton.text }}
    div(v-if="confirmMessage !== '' || bottomMenu !== ''" class="dim-background")
    transition(name="slide-full")
      bottom-menu(v-if="bottomMenu !== ''"
                  class="bottom-menu"
                  :bottomMenu="bottomMenu"
                  v-click-outside="() => { setBottomMenu('') }"
                  @close="setBottomMenu('')")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import BottomMenu from '@/components/mydesign/BottomMenu.vue'
import MobileAllDesignView from '@/components/mydesign/design-views/MobileAllDesignView.vue'
import MobileFavoriteDesignView from '@/components/mydesign/design-views/MobileFavoriteDesignView.vue'
import MobileListDesignView from '@/components/mydesign/design-views/MobileListDesignView.vue'
import MobileFolderDesignView from '@/components/mydesign/design-views/MobileFolderDesignView.vue'
import MobileTrashDesignView from '@/components/mydesign/design-views/MobileTrashDesignView.vue'
import vClickOutside from 'v-click-outside'
import designUtils from '@/utils/designUtils'
import { IDesign, IFolder, IPathedFolder, IQueueItem } from '@/interfaces/design'

interface IMenuButton {
  icon: string,
  width?: string,
  height?: string,
  action: () => void
}

interface ITabButton {
  icon: string,
  tab: string,
  text: string,
  condition: (currLocation: string) => boolean
}

export default Vue.extend({
  name: 'MyDesignMobile',
  data() {
    return {
      deletedQueue: [] as IQueueItem[],
      messageTimer: -1,
      isShowDeleteMessage: false,
      recoveredQueue: [] as IQueueItem[],
      isShowRecoverMessage: false,
      movedQueue: [] as IQueueItem[],
      isShowMoveMessage: false,
      pathedFolderBuffer: undefined as IPathedFolder | undefined,
      designBuffer: undefined as IDesign | undefined,
      confirmMessage: '',
      isMoveToFolderPanelOpen: false,
      isMovingSingleToFolder: false,
      errorMessageTimer: -1,
      tabButtons: [
        {
          icon: 'all',
          text: `${this.$t('NN0187')}`,
          tab: 'a',
          condition: (currLocation: string) => {
            return currLocation === 'a'
          }
        },
        {
          icon: 'heart',
          text: `${this.$t('NN0188')}`,
          tab: 'h',
          condition: (currLocation: string) => {
            return currLocation === 'h'
          }
        },
        {
          icon: 'folder',
          text: `${this.$tc('NN0253', 2)}`,
          tab: 'l',
          condition: (currLocation: string) => {
            return currLocation === 'l' || currLocation.startsWith('f')
          }
        },
        {
          icon: 'trash',
          text: `${this.$t('NN0189')}`,
          tab: 't',
          condition: (currLocation: string) => {
            return currLocation === 't'
          }
        }
      ] as ITabButton[]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    BottomMenu,
    MobileAllDesignView,
    MobileFavoriteDesignView,
    MobileListDesignView,
    MobileFolderDesignView,
    MobileTrashDesignView
  },
  props: {
    view: String
  },
  async created() {
    this.setFolders(designUtils.initializeFolders())
    await this.fetchStructuralFolders({ path: 'root' })
    if (this.view === 'all') {
      this.setCurrLocation('a')
      return
    }
    if (this.view === 'favor') {
      this.setCurrLocation('h')
      return
    }
    if (this.view === 'trash') {
      this.setCurrLocation('t')
      return
    }
    if (this.view === 'list') {
      this.setCurrLocation('l')
      return
    }
    if (!this.view) {
      this.setCurrLocation('a')
      return
    }
    const path = this.view.split('&')
    const success = await this.fetchFoldersAlong({ pathNodes: path })
    if (success) {
      this.setCurrLocation(`f:${designUtils.ROOT}/${path.join('/')}`)
    } else {
      this.setCurrLocation('a')
    }
  },
  watch: {
    currLocation() {
      this.handleClearSelection()
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      moveToFolderSelectInfo: 'getMoveToFolderSelectInfo',
      folders: 'getFolders',
      copiedFolders: 'getCopiedFolders',
      selectedDesigns: 'getSelectedDesigns',
      selectedFolders: 'getSelectedFolders',
      isErrorShowing: 'getIsErrorShowing',
      bottomMenu: 'getBottomMenu'
    }),
    path(): string[] {
      return this.currLocation.startsWith('f:') ? designUtils.makePath(this.currLocation) : []
    },
    folder(): IFolder | undefined {
      return designUtils.search(this.folders, this.path)
    },
    title(): string {
      switch (this.currLocation) {
        case 'a':
          return `${this.$t('NN0187')}`
        case 'h':
          return `${this.$t('NN0188')}`
        case 't':
          return `${this.$t('NN0189')}`
        case 'l':
          return `${this.$tc('NN0253', 2)}`
        default:
          return this.folder?.name ?? ''
      }
    },
    menuButtons(): IMenuButton[] {
      switch (this.currLocation) {
        case 'a':
          return []
        case 'h':
          return []
        case 't':
          return [{
            icon: 'info-mobile',
            action: () => {
              this.setBottomMenu('trash-info')
            }
          }]
        default:
          return [{
            icon: 'folder_plus',
            action: () => {
              console.log('add folder')
            }
          }, {
            icon: 'sequence',
            action: () => {
              this.setBottomMenu('sort-menu')
            }
          }]
      }
    },
    mydesignView(): string {
      switch (this.currLocation[0]) {
        case 'a':
          return 'mobile-all-design-view'
        case 'h':
          return 'mobile-favorite-design-view'
        case 't':
          return 'mobile-trash-design-view'
        case 'l':
          return 'mobile-list-design-view'
        case 'f':
          return 'mobile-folder-design-view'
        default:
          return 'mobile-all-design-view'
      }
    }
  },
  methods: {
    ...mapActions('design', {
      fetchFoldersAlong: 'fetchFoldersAlong',
      fetchStructuralFolders: 'fetchStructuralFolders'
    }),
    ...mapMutations('design', {
      clearSelection: 'UPDATE_clearSelection',
      setCurrLocation: 'SET_currLocation',
      setFolders: 'SET_folders',
      snapshotFolders: 'UPDATE_snapshotFolders',
      setIsErrorShowing: 'SET_isErrorShowing',
      setBottomMenu: 'SET_bottomMenu'
    }),
    handlePrevPage() {
      if (['a', 'h', 'l', 't'].includes(this.currLocation)) {
        this.$router.push({ name: 'Home' })
      } else {
        if (this.path.length === 2) {
          this.setCurrLocation('l')
        } else {
          const selectedParents = this.path.slice(0, this.path.length - 1)
          this.setCurrLocation(`f:${selectedParents.join('/')}`)
        }
      }
    },
    handleGoTo(tab: string) {
      this.setCurrLocation(tab)
    },
    handleClearSelection() {
      this.isMoveToFolderPanelOpen = false
      this.$nextTick(() => {
        this.clearSelection()
      })
    },
    handleDeleteItem() {
      console.log('TODO')
    },
    handleRecoverItem() {
      console.log('TODO')
    },
    handleDeleteFolder() {
      console.log('TODO')
    },
    handleMoveItem() {
      console.log('TODO')
    },
    handleDeleteForever() {
      console.log('TODO')
    },
    handleDeleteFolderForever() {
      console.log('TODO')
    },
    handleMoveDesignToFolder() {
      console.log('TODO')
    },
    handleDownloadDesign() {
      console.log('TODO')
    },
    renderedWidth(button: IMenuButton) {
      return button.width ?? '24px'
    },
    renderedHeight(button: IMenuButton) {
      return button.height ?? button.width ?? '24px'
    }
  }
})
</script>

<style lang="scss" scoped>
$nav-bar-height: 44px;
$tab-bar-height: 56px;
$total-bar-height: $nav-bar-height + $tab-bar-height;

.my-design-mobile {
  @include size(100vw, 100vh);
  &__nav-bar {
    height: $nav-bar-height;
    background: #FFFFFF;
    box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    &__prev {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__title {
      font-weight: 500;
      font-size: 16px;
      line-height: 140%;
      color: setColor(gray-1);
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 40vw;
      white-space: nowrap;
    }
    &__menu {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      &-button {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
  &__content {
    height: calc(100vh - #{$total-bar-height});
  }
  &__tab-bar {
    height: $tab-bar-height;
    background: #FFFFFF;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }
  &__tab-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    &__text {
      font-weight: 400;
      font-size: 10px;
      line-height: 20px;
      color: setColor(gray-2);
    }
    &.active {
      & > svg, & > div {
        color: setColor(blue-1);
      }
    }
  }
}

.design-view {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  @include no-scrollbar;
}

.dim-background {
  @include size(100%, 100%);
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(24, 25, 31, 0.7);
  z-index: 1000;
}

.slide-full-enter-active,
.slide-full-leave-active {
  transition: 0.2s;
}

.slide-full-enter,
.slide-full-leave-to {
  transform: translateY(100%);
}
</style>
