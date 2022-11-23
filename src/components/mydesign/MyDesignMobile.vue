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
          @click="() => { !button.disabled && button.action() }")
        svg-icon(:iconName="button.icon"
                  :iconColor="button.disabled? 'gray-4' : 'gray-2'"
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
                :menuStack="menuStack"
                @close="setBottomMenu('')"
                @clear="handleClearSelection"
                @menuAction="handleMenuAction"
                @back="handlePrevMenu"
                @push="handlePushMenu")
  div(v-if="confirmMessage !== ''" class="dim-background" @click.stop="closeConfirmMessage")
    div(class="message" @click.stop)
      div(class="message__close pointer"
          @click.stop="closeConfirmMessage")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
      div(class="message__text")
        span {{getMessageText()}}
      div(class="message__description")
        span(v-html="getMessageDescription()")
      div(class="message__buttons")
        div(class="message__cancel" @click.stop="closeConfirmMessage")
          span {{$t('NN0203')}}
        div(class="message__confirm" @click.stop="confirmAction")
          span {{$t('NN0034')}}
  div(v-if="isErrorShowing" class="dim-background" @click.stop="closeErrorMessage")
    div(class="message" @click.stop)
      div(class="message__close-minimal pointer"
          @click.stop="closeErrorMessage")
        svg-icon(iconName="close" iconColor="gray-2" iconWidth="20px")
      div(class="message__text")
        span {{$t('NN0456')}}
      div(class="message__description")
        span {{$t('NN0242')}}
      div(class="message__ok" @click.stop="closeErrorMessage")
        span {{$t('NN0563')}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
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
  disabled?: boolean,
  action: () => void
}

interface ITabButton {
  icon: string,
  tab: string,
  text: string,
  condition: (currLocation: string) => boolean
}

export default defineComponent({
  name: 'MyDesignMobile',
  data() {
    return {
      messageQueue: [] as IMobileMessageItem[],
      messageTimer: -1,
      isShowMessage: false,
      pathedFolderBuffer: undefined as IPathedFolder | undefined,
      designBuffer: undefined as IDesign | undefined,
      confirmMessage: '',
      errorMessageTimer: -1,
      menuStack: [] as string[],
      tabButtons: [
        {
          icon: 'all',
          text: generalUtils.capitalizeFirstWord(`${this.$t('NN0080')}`),
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
    view: {
      type: String,
      required: true
    }
  },
  async created() {
    this.resetState()
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
    },
    bottomMenu(newVal) {
      if (newVal === '') {
        this.menuStack = []
      }
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
      return Object.keys(this.selectedDesigns).length + Object.keys(this.selectedFolders).length
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
          return generalUtils.capitalizeFirstWord(`${this.$t('NN0080')}`)
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
            disabled: designUtils.isMaxLevelReached(this.path.length - 2),
            action: () => {
              this.setPathBuffer(this.currLocation === 'l' ? [designUtils.ROOT] : this.path)
              this.setBottomMenu('new-folder')
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
      resetState: 'UPDATE_resetState',
      clearSelection: 'UPDATE_clearSelection',
      setCurrLocation: 'SET_currLocation',
      setFolders: 'SET_folders',
      snapshotFolders: 'UPDATE_snapshotFolders',
      setIsErrorShowing: 'SET_isErrorShowing',
      setBottomMenu: 'SET_bottomMenu',
      setDesignBuffer: 'SET_mobileDesignBuffer',
      setPathBuffer: 'SET_mobilePathBuffer'
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
    handlePushMenu(menu: string) {
      this.menuStack.push(menu)
    },
    handlePrevMenu() {
      if (this.menuStack.length) {
        const prev = this.menuStack.pop()
        this.setBottomMenu(prev)
      } else {
        this.setBottomMenu('')
      }
    },
    handleClearSelection() {
      this.$nextTick(() => {
        this.clearSelection()
      })
    },
    handleMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      switch (event) {
        case 'moveItem':
          switch (payload) {
            case 'design':
              this.pushItem('move-design')
              break
            case 'folder':
              this.pushItem('move-folder')
              break
            case 'multi':
              this.pushItem('move-designs')
              break
          }
          break
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
          switch (payload.type) {
            case 'design':
              this.pushItem('undo-design')
              break
            case 'folder':
              this.pushItem('undo-folder')
              break
            case 'multi':
              this.pushItem('undo-multi')
              break
          }
          break
        case 'rootDesign':
          this.pushItem('root-design')
          break
        case 'rootFolder':
          this.pushItem('root-folder')
          break
        case 'deleteForever':
          this.designBuffer = payload
          this.confirmMessage = 'delete-forever'
          break
        case 'deleteFolderForever':
          this.pathedFolderBuffer = { parents: [], folder: payload }
          this.confirmMessage = 'delete-forever'
          break
        case 'deleteAllForever':
          this.confirmMessage = 'delete-forever'
          break
        case 'moveDesignToFolder':
          this.menuStack.push(this.bottomMenu)
          this.snapshotFolders()
          this.setBottomMenu('move-folder')
          break
        case 'deleteAll':
          this.confirmMessage = 'delete-all'
          break
        case 'deleteFolder':
          this.pathedFolderBuffer = payload
          this.confirmMessage = 'delete-folder'
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
        case 'move-design':
        case 'move-designs':
        case 'move-folder':
        case 'root-design':
        case 'root-folder':
          return 'folder'
        case 'delete':
          return 'trash'
        case 'favor-design':
          return 'favorites-fill'
        case 'unfavor-design':
          return 'favorites'
        case 'undo-design':
        case 'undo-folder':
        case 'undo-multi':
          return 'undo'
        default:
          return ''
      }
    },
    messageItemText(item: IMobileMessageItem): string {
      switch (item.type) {
        case 'move-design':
          return `${this.$t('NN0682', { item: this.$tc('NN0252'), dest: this.$tc('NN0253').toLowerCase() })}`
        case 'move-designs':
          return `${this.$t('NN0682', { item: this.$tc('NN0252', 2), dest: this.$tc('NN0253').toLowerCase() })}`
        case 'move-folder':
          return `${this.$t('NN0682', { item: this.$tc('NN0253'), dest: this.$tc('NN0253').toLowerCase() })}`
        case 'root-design':
          return `${this.$t('NN0682', { item: this.$tc('NN0252'), dest: `${this.$t('NN0080')}`.toLowerCase() })}`
        case 'root-folder':
          return `${this.$t('NN0704')}`
        case 'delete':
          return `${this.$t('NN0685')}`
        case 'favor-design':
          return `${this.$t('NN0683')}`
        case 'unfavor-design':
          return `${this.$t('NN0684')}`
        case 'undo-design':
          return `${this.$t('NN0686', { item: this.$tc('NN0252') })}`
        case 'undo-folder':
          return `${this.$t('NN0686', { item: this.$tc('NN0253') })}`
        case 'undo-multi':
          return `${this.$t('NN0686', { item: this.$tc('NN0687', 2) })}`
        default:
          return ''
      }
    },
    getMessageText(): string {
      switch (this.confirmMessage) {
        case 'delete-forever':
          return `${this.$t('NN0200')}`
        case 'delete-all':
          return `${this.$t('NN0693')}`
        case 'delete-folder':
          return `${this.$t('NN0199')}`
        default:
          return ''
      }
    },
    getMessageDescription() {
      switch (this.confirmMessage) {
        case 'delete-forever':
          if (this.selectedNum > 1) {
            return `${this.$tc('NN0201', 2)}`
          } else {
            return `${this.$tc('NN0201', 1)}`
          }
        case 'delete-all':
          return `${this.$t('NN0244')}`
        case 'delete-folder':
          return `${this.$t('NN0694')}<br>${this.$t('NN0246')}`
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
    closeErrorMessage() {
      this.setIsErrorShowing(false)
    },
    confirmAction() {
      switch (this.confirmMessage) {
        case 'delete-forever':
          this.deleteForeverConfirmed()
          break
        case 'delete-all':
          designUtils.deleteAll(Object.values(this.selectedDesigns))
          break
        case 'delete-folder':
          if (this.pathedFolderBuffer) {
            designUtils.deleteFolder(this.pathedFolderBuffer)
          }
          break
      }
      this.closeConfirmMessage()
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
      transition: color 0.2s;
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

.message {
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
  &__close-minimal {
    position: absolute;
    top: 6px;
    right: 10px;
    @include size(20px, 20px);
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
  &__ok {
    margin-top: 42px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    > span {
      @include btn-SM;
      width: 60vw;
      padding: 10px 0;
      border-radius: 4px;
      background-color: setColor(blue-1);
      display: block;
      color: white;
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
