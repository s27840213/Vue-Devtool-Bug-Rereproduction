<template lang="pug">
  div(class="my-design-mobile")
    div(class="my-design-mobile__nav-bar relative")
      div(class="my-design-mobile__nav-bar__prev pointer"
          @click="handlePrevPage")
        svg-icon(iconName="chevron-left" iconColor="gray-1" iconWidth="24px")
      div(class="my-design-mobile__nav-bar__title") {{ title }}
      div(class="my-design-mobile__nav-bar__menu")
        div(v-for="button in menuButtons"
            class="my-design-mobile__nav-bar__menu-button pointer"
            @click="button.action")
          svg-icon(:iconName="button.icon"
                    iconColor="gray-1"
                    :iconWidth="renderedWidth(button)"
                    :iconHeight="renderedHeight(button)")
    div(class="my-design-mobile__content")
    div(class="my-design-mobile__tab-bar")
      div(v-for="tabButton in tabButtons"
          class="my-design-mobile__tab-button pointer"
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
                  v-click-outside="() => { bottomMenu = '' }"
                  @close="bottomMenu = ''")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import BottomMenu from '@/components/mydesign/BottomMenu.vue'
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
  text: string
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
      bottomMenu: '',
      isMoveToFolderPanelOpen: false,
      isMovingSingleToFolder: false,
      errorMessageTimer: -1,
      tabButtons: [
        {
          icon: 'all',
          text: `${this.$t('NN0187')}`,
          tab: 'a'
        },
        {
          icon: 'heart',
          text: `${this.$t('NN0188')}`,
          tab: 'h'
        },
        {
          icon: 'folder',
          text: `${this.$tc('NN0253', 2)}`,
          tab: 'l'
        },
        {
          icon: 'trash',
          text: `${this.$t('NN0189')}`,
          tab: 't'
        }
      ] as ITabButton[]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    BottomMenu
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
      isErrorShowing: 'getIsErrorShowing'
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
              this.bottomMenu = 'trash-info'
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
              console.log('show sorting')
            }
          }]
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
      setIsErrorShowing: 'SET_isErrorShowing'
    }),
    handlePrevPage() {
      if (['a', 'h', 'l', 't'].includes(this.currLocation)) {
        this.$router.push({ name: 'Home' })
      } else {
        // TODO: go to parent folder or folder list (if current folder is top-level)
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
.my-design-mobile {
  @include size(100vw, 100vh);
  display: flex;
  flex-direction: column;
  &__nav-bar {
    height: 44px;
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
    flex-grow: 1;
  }
  &__tab-bar {
    height: 56px;
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
  }
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
