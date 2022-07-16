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
    div(class="my-design-mobile__content relative")
      component(v-if="currLocation !== ''"
                :is="mydesignView"
                class="design-view"
                @clearSelection="handleClearSelection")
      transition(name="slide-fade")
        div(v-if="isShowMessage" class="my-design-mobile__message")
          div(class="my-design-mobile__message__icon")
            svg-icon(:iconName="messageItemIcon(messageQueue[0])"
                    iconColor="white"
                    iconWidth="24px")
          div(class="my-design-mobile__message__text") {{ messageItemText(messageQueue[0]) }}
    div(class="my-design-mobile__tab-bar")
      div(v-for="tabButton in tabButtons"
          class="my-design-mobile__tab-button pointer"
          :class="{active: tabButton.condition(currLocation)}"
          @click="handleGoTo(tabButton.tab)")
        svg-icon(:iconName="tabButton.icon"
                  iconColor="gray-2"
                  iconWidth="24px")
        div(class="my-design-mobile__tab-button__text") {{ tabButton.text }}
    div(v-if="confirmMessage !== '' || bottomMenu !== ''" class="dim-background"
        @click.stop.prevent="setBottomMenu('')")
    transition(name="slide-full")
      bottom-menu(v-if="bottomMenu !== '' || isAnySelected"
                  class="bottom-menu"
                  :bottomMenu="bottomMenu"
                  :selectedNum="selectedNum"
                  :isAnySelected="isAnySelected"
                  @close="setBottomMenu('')"
                  @clear="handleClearSelection"
                  @menuAction="handleDesignMenuAction")
    div(v-if="confirmMessage === 'delete-forever'" class="dim-background" @click.stop="closeConfirmMessage")
      div(class="delete-forever-message")
        div(class="delete-forever-message__close pointer"
            @click="closeConfirmMessage")
          svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
        div(class="delete-forever-message__text")
          span {{$t('NN0200')}}
        div(class="delete-forever-message__description")
          span {{$t('NN0201')}}
        div(class="delete-forever-message__buttons")
          div(class="delete-forever-message__cancel" @click="closeConfirmMessage")
            span {{$t('NN0203')}}
          div(class="delete-forever-message__confirm" @click="deleteForeverConfirmed")
            span {{$t('NN0034')}}
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
import { IDesign, IFolder, IPathedFolder, IMobileMessageItem } from '@/interfaces/design'
import generalUtils from '@/utils/generalUtils'

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
      messageQueue: [] as IMobileMessageItem[],
      messageTimer: -1,
      isShowMessage: false,
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
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isAnySelected(): boolean {
      return this.selectedNum > 0
    },
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
    handleCloseMenu() {
      if (this.isAnySelected) {
        this.handleClearSelection()
      } else {
        this.setBottomMenu('')
      }
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
    handleDesignMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      switch (event) {
        case 'deleteItem':
          this.pushItem('delete')
          break
        case 'favorDesign':
          this.pushItem('favor-design')
          break
        case 'unfavorDesign':
          this.pushItem('unfavor-design')
          break
        case 'recoverItem':
          if (payload.type === 'design') {
            this.pushItem('undo-design')
          }
          if (payload.type === 'folder') {
            this.pushItem('undo-folder')
          }
          break
        case 'deleteForever':
          this.designBuffer = payload
          this.confirmMessage = 'delete-forever'
          break
      }
    },
    pushItem(type: IMobileMessageItem['type']) {
      this.messageQueue.push({ type })
      if (this.messageQueue.length === 1) {
        this.showMessage()
      }
    },
    showMessage() {
      const item = this.messageQueue[0]
      if (item) {
        this.isShowMessage = true
        setTimeout(() => {
          this.isShowMessage = false
          setTimeout(() => {
            this.messageQueue.shift()
            this.showMessage()
          }, 500)
        }, 3000)
      }
    },
    messageItemIcon(item: IMobileMessageItem): string {
      switch (item.type) {
        case 'delete':
          return 'trash'
        case 'favor-design':
          return 'favorites-fill'
        case 'unfavor-design':
          return 'favorites'
        case 'undo-design':
        case 'undo-folder':
          return 'undo'
        default:
          return ''
      }
    },
    messageItemText(item: IMobileMessageItem): string {
      switch (item.type) {
        case 'delete':
          return `${this.$t('NN0685')}`
        case 'favor-design':
          return `${this.$t('NN0683')}`
        case 'unfavor-design':
          return `${this.$t('NN0684')}`
        case 'undo-design':
          return `${this.$t('NN0686')}`
        case 'undo-folder':
          return `${this.$t('NN0687')}`
        default:
          return ''
      }
    },
    deleteForeverConfirmed() {
      if (this.designBuffer) {
        designUtils.deleteForever(this.designBuffer)
        this.designBuffer = undefined
        return
      }
      if (this.pathedFolderBuffer) {
        designUtils.deleteFolderForever(this.pathedFolderBuffer.folder)
        this.pathedFolderBuffer = undefined
        return
      }
      if (this.isAnySelected) {
        designUtils.deleteAllForever(Object.values(this.selectedDesigns), Object.values(this.selectedFolders))
      }
    },
    closeConfirmMessage() {
      this.confirmMessage = ''
      this.pathedFolderBuffer = undefined
      this.designBuffer = undefined
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
    z-index: 20;
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
    width: 100%;
    height: $tab-bar-height;
    position: fixed;
    left: 0;
    bottom: 0;
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
  &__message {
    z-index: 1;
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: setColor(gray-1-5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px 16px;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 5px;
    &__icon {
      @include size(24px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      @include body-SM;
      color: white;
      white-space: nowrap;
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

$messageTypes: delete-all, delete-folder, delete-forever;

@each $messageType in $messageTypes {
  .#{$messageType}-message {
    position: relative;
    background-color: white;
    display: flex;
    flex-direction: column;
    width: 80vw;
    border-radius: 5px;
    &__close {
      position: absolute;
      top: 16px;
      right: 14px;
      @include size(20px, 20px);
      border-radius: 50%;
      background: setColor(gray-4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 22px;
      > span {
        @include text-H6;
        color: setColor(gray-2);
      }
    }
    &__description {
      margin-top: 42px;
      padding: 0 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      > span {
        @include body-SM;
        color: setColor(gray-2);
      }
    }
    &__buttons {
      margin-top: 42px;
      margin-bottom: 16px;
      padding: 0 28px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      > div {
        min-width: calc(50% - 36px);
        height: 32px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0 12px;
        > span {
          @include btn-SM;
        }
      }
    }
    &__cancel {
      background-color: setColor(gray-4);
      > span {
        display: block;
        color: black;
      }
    }
    &__confirm {
      background-color: setColor(red-1);
      > span {
        display: block;
        color: white;
      }
    }
  }
}

.slide-full-enter-active,
.slide-full-leave-active {
  transition: 0.2s;
}

.slide-full-enter,
.slide-full-leave-to {
  transform: translateY(100%);
}

.slide-fade-enter-active {
  transition: 0.3s ease;
}

.slide-fade-leave-active {
  transition: 0.5s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  top: -25%;
  opacity: 0;
}
</style>
