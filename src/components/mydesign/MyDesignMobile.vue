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
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import designUtils from '@/utils/designUtils'
import { IDesign, IFolder, IPathedFolder, IQueueItem } from '@/interfaces/design'

interface IMenuButton {
  icon: string,
  width?: string,
  height?: string,
  action: () => void
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
      errorMessageTimer: -1
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
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
    currLocation(newVal) {
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
          return []
        case 'l':
          return []
        default:
          return []
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
}
</style>
