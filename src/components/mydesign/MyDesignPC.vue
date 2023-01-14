<template lang="pug">
div(class="my-design-pc")
  nu-header(v-header-border="true")
  div(class="my-design-pc__content")
    sidebar(@deleteItem="handleDeleteItem"
            @deleteFolder="handleDeleteFolder"
            @deleteAll="deleteAll"
            @moveItem="handleMoveItem")
    section(class="my-design-pc__design-view")
      transition(name="slide-down-fade")
        div(v-if="isMultiSelected" class="my-design-pc__multi")
          div(class="my-design-pc__multi__container")
            div(class="my-design-pc__multi__number")
              i18n-t(keypath="NN0254" tag="span")
                template(#selectedNum) {{selectedNum}}
            div(class="my-design-pc__multi__actions relative")
              div(ref="tgFav"
                  v-if="mydesignView !== 'trash-design-view'"
                  class="my-design-pc__multi__icon"
                  @click="toggleAllFavorite")
                svg-icon(iconName="heart"
                        iconWidth="21px"
                        iconColor="gray-2")
              div(ref="mvFolder"
                  v-if="(mydesignView !== 'favorite-design-view') && (mydesignView !== 'trash-design-view')"
                  class="my-design-pc__multi__icon"
                  @click="isMoveToFolderPanelOpen = true")
                svg-icon(iconName="folder"
                        iconWidth="21px"
                        iconColor="gray-2")
              div(ref="delDesign"
                  v-if="mydesignView !== 'trash-design-view'"
                  class="my-design-pc__multi__icon"
                  @mouseenter="handleFavDelMouseOver(true)"
                  @mouseleave="handleFavDelMouseOver(false)"
                  @click="deleteAll")
                svg-icon(iconName="trash"
                        iconWidth="21px"
                        iconColor="gray-2")
              transition(name="slide-fade-img")
                img(v-if="isFavDelMouseOver" class="my-design-pc__info__arrow" :src="require('@/assets/img/svg/left-arrow.svg')")
              transition(name="slide-fade-text")
                div(v-if="isFavDelMouseOver" class="my-design-pc__info__text")
                  span {{$t('NN0243')}}
              div(ref="recover"
                  v-if="mydesignView === 'trash-design-view'"
                  class="my-design-pc__multi__icon"
                  @click="recoverAll")
                svg-icon(iconName="reduction"
                        iconWidth="21px"
                        iconColor="gray-2")
              div(ref="delForever"
                  v-if="mydesignView === 'trash-design-view'"
                  class="my-design-pc__multi__icon"
                  @click="deleteAllForever")
                svg-icon(iconName="trash"
                        iconWidth="21px"
                        iconColor="gray-2")
            div(class="my-design-pc__multi__close"
                @click="handleClearSelection")
              svg-icon(iconName="close-large"
                      iconWidth="11px"
                      iconHeight="13px"
                      iconColor="gray-2")
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
      div(class="my-design-pc__message-stack" :style="stackStyles()")
        transition(name="slide-fade")
          div(v-if="isShowDeleteMessage" class="my-design-pc__message")
            div(class="my-design-pc__message__img" :style="messageImageStyles(deletedQueue[0])")
            div(class="my-design-pc__message__text")
              i18n-t(keypath="NN0250" tag="span")
                template(#item) {{messageItemName(deletedQueue[0])}}
                template(#folder) {{$t('NN0189')}}
            div(class="my-design-pc__message__button" @click="recover")
              span {{$t('NN0119')}}
        transition(name="slide-fade")
          div(v-if="isShowRecoverMessage" class="my-design-pc__message")
            div(class="my-design-pc__message__text")
              i18n-t(keypath="NN0250" tag="span")
                template(#item) {{messageItemName(recoveredQueue[0])}}
                template(#folder) {{messageDestName(recoveredQueue[0])}}
        transition(name="slide-fade")
          div(v-if="isShowMoveMessage" class="my-design-pc__message")
            div(class="my-design-pc__message__img" :style="messageImageStyles(movedQueue[0])")
            div(class="my-design-pc__message__text")
              i18n-t(keypath="NN0250" tag="span")
                template(#item) {{messageItemName(movedQueue[0])}}
                template(#folder) {{messageDestName(movedQueue[0])}}
        transition(name="slide-fade")
          div(v-if="isErrorShowing" class="my-design-pc__message")
            div(class="my-design-pc__message__text")
              span {{$t('NN0242')}}
      div(v-if="isMoveToFolderPanelOpen"
          class="my-design-pc__change-folder"
          :class="{centered: isMovingSingleToFolder}"
          v-click-outside="() => { isMoveToFolderPanelOpen = false }")
        div(class="my-design-pc__change-folder__container scrollbar-gray-thin")
          div(class="my-design-pc__change-folder__header")
            div(class="my-design-pc__change-folder__title")
              span {{$t('NN0206')}}
            div(class="my-design-pc__change-folder__hr")
          div(class="my-design-pc__change-folder__folders")
            structure-folder(v-for="folder in realFolders"
                            :folder="folder"
                            :parents="[]"
                            :level="0")
          div(class="my-design-pc__change-folder__footer")
            div(class="my-design-pc__change-folder__buttons")
              div(class="my-design-pc__change-folder__cancel"
                  @click="isMoveToFolderPanelOpen = false")
                span {{$t('NN0203')}}
              div(class="my-design-pc__change-folder__confirm"
                  :class="{'disabled': moveToFolderSelectInfo === ''}"
                  @click="handleMoveToFolder")
                span {{$t('NN0206')}}
  transition(name="scale-fade")
    div(v-if="confirmMessage === 'delete-all'" class="dim-background" @click="closeConfirmMessage")
      div(class="delete-all-message" @click.stop)
        div(class="delete-all-message__img")
          img(:src="require('@/assets/img/png/mydesign/delete-confirm.png')" width="55" height="57")
        div(class="delete-all-message__text")
          span {{$t('NN0244')}}
        div(class="delete-all-message__buttons")
          div(class="delete-all-message__cancel" @click.stop="closeConfirmMessage")
            span {{$t('NN0203')}}
          div(class="delete-all-message__confirm" @click.stop="confirmAction(deleteAllConfirmed)")
            span {{$t('NN0034')}}
    div(v-else-if="confirmMessage === 'delete-folder'" class="dim-background" @click="closeConfirmMessage")
      div(class="delete-folder-message" @click.stop)
        div(class="delete-folder-message__img")
          img(:src="require('@/assets/img/png/mydesign/delete-confirm.png')" width="76" height="79")
        div
          div(class="delete-folder-message__text")
            span(class="first-line") {{$t('NN0245')}}
            span {{$t('NN0246')}}
          div(class="delete-folder-message__buttons")
            div(class="delete-folder-message__cancel" @click.stop="closeConfirmMessage")
              span {{$t('NN0203')}}
            div(class="delete-folder-message__confirm" @click.stop="confirmAction(() => deleteFolder(pathedFolderBuffer))")
              span {{$t('NN0034')}}
    div(v-else-if="confirmMessage === 'delete-forever'" class="dim-background" @click="closeConfirmMessage")
      div(class="delete-forever-message" @click.stop)
        div(class="delete-forever-message__img")
          img(:src="require('@/assets/img/png/mydesign/delete-confirm.png')" width="55" height="57")
        div(class="delete-forever-message__text")
          span {{$tc('NN0202', isMultiSelected ? 2 : 1)}}
        div(class="delete-forever-message__description")
          span {{$tc('NN0201', isMultiSelected ? 2 : 1)}}
        div(class="delete-forever-message__buttons")
          div(class="delete-forever-message__cancel" @click.stop="closeConfirmMessage")
            span {{$t('NN0203')}}
          div(class="delete-forever-message__confirm" @click.stop="confirmAction(deleteForeverConfirmed)")
            span {{$t('NN0200')}}
  div(v-if="isMoveToFolderPanelOpen && isMovingSingleToFolder" class="dim-background")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'click-outside-vue3'
import Sidebar from '@/components/mydesign/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import AllDesignView from '@/components/mydesign/design-views/AllDesignView.vue'
import FavoriteDesignView from '@/components/mydesign/design-views/FavoriteDesignView.vue'
import TrashDesignView from '@/components/mydesign/design-views/TrashDesignView.vue'
import FolderDesignView from '@/components/mydesign/design-views/FolderDesignView.vue'
import StructureFolder from '@/components/mydesign/StructureFolder.vue'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import { IDesign, IFolder, IPathedFolder, IQueueItem } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import hintUtils from '@/utils/hintUtils'

export default defineComponent({
  emits: [],
  name: 'MyDesignPC',
  components: {
    Sidebar,
    NuHeader,
    AllDesignView,
    FavoriteDesignView,
    TrashDesignView,
    FolderDesignView,
    StructureFolder,
    PopupDownload
  },
  directives: {
    clickOutside: vClickOutside.directive
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
      this.setCurrLocation('a')
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
      isFavDelMouseOver: false,
      isMoveToFolderPanelOpen: false,
      isMovingSingleToFolder: false,
      errorMessageTimer: -1
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
    mydesignView(): string {
      switch (this.currLocation[0]) {
        case 'a':
          return 'all-design-view'
        case 'h':
          return 'favorite-design-view'
        case 't':
          return 'trash-design-view'
        case 'f':
          return 'folder-design-view'
        default:
          return 'all-design-view'
      }
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length + Object.keys(this.selectedFolders).length
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    },
    realFolders(): IFolder[] {
      return designUtils.sortByCreateTime([...this.copiedFolders])
    }
  },
  watch: {
    currLocation() {
      this.handleClearSelection()
    },
    isMultiSelected(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          if (this.mydesignView === 'trash-design-view') {
            hintUtils.bind(this.$refs.recover as HTMLElement, `${this.$t('NN0204')}`, 500)
            hintUtils.bind(this.$refs.delForever as HTMLElement, `${this.$t('NN0200')}`, 500)
          } else {
            hintUtils.bind(this.$refs.tgFav as HTMLElement, this.mydesignView === 'favorite-design-view' ? `${this.$t('NN0207')}` : `${this.$t('NN0205')}`, 500)
            hintUtils.bind(this.$refs.delDesign as HTMLElement, `${this.$t('NN0034')}`, 500)
            if (this.mydesignView !== 'favorite-design-view') {
              hintUtils.bind(this.$refs.mvFolder as HTMLElement, `${this.$t('NN0206')}`, 500)
            }
          }
        })
      }
    },
    isMoveToFolderPanelOpen(newVal) {
      if (newVal) {
        this.snapshotFolders()
      } else {
        this.designBuffer = undefined
        this.isMovingSingleToFolder = false
      }
    },
    isErrorShowing(newVal) {
      if (newVal) {
        if (this.errorMessageTimer > 0) {
          clearTimeout(this.errorMessageTimer)
        }
        this.errorMessageTimer = setTimeout(() => {
          this.setIsErrorShowing(false)
        }, 2000)
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
      setIsErrorShowing: 'SET_isErrorShowing'
    }),
    stackStyles() {
      return { top: this.isMultiSelected ? '82px' : '27px' }
    },
    messageImageStyles(item: IQueueItem) {
      if (item.type === 'design') {
        return { 'background-image': `url(${(item.data as IDesign).thumbnail})` }
      } else {
        return { display: 'none' }
      }
    },
    messageItemName(item: IQueueItem): string {
      if (item.type === 'multi') {
        return `${this.$t('NN0255')}`
      } else if (item.type === 'design') {
        return `${this.$tc('NN0252', 1)}`
      } else {
        return (item.data as IFolder).name + ' '
      }
    },
    messageDestName(item: IQueueItem): string {
      return item.dest ?? ''
    },
    showMessage(queue: IQueueItem[], flag: 'isShowMoveMessage' | 'isShowDeleteMessage' | 'isShowRecoverMessage', recordTimer: boolean) {
      const item = queue[0]
      if (item) {
        this[flag] = true
        const timer = setTimeout(() => {
          this[flag] = false
          setTimeout(() => {
            queue.shift()
            this.showMessage(queue, flag, recordTimer)
          }, 1000)
        }, 5000)
        if (recordTimer) {
          this.messageTimer = timer
        }
      }
    },
    showDeleteMessage() {
      this.showMessage(this.deletedQueue, 'isShowDeleteMessage', true)
    },
    showRecoverMessage() {
      this.showMessage(this.recoveredQueue, 'isShowRecoverMessage', false)
    },
    showMoveMessage() {
      this.showMessage(this.movedQueue, 'isShowMoveMessage', false)
    },
    handleClearSelection() {
      this.isMoveToFolderPanelOpen = false
      this.$nextTick(() => {
        this.clearSelection()
      })
    },
    handlePushItem(item: IQueueItem, queue: IQueueItem[], messageShower: () => void, beforePush?: (item: IQueueItem) => void) {
      if (beforePush) {
        beforePush(item)
      }
      queue.push(item)
      if (queue.length === 1) {
        messageShower()
      }
    },
    handleDeleteItem(item: IQueueItem) {
      this.handlePushItem(item, this.deletedQueue, this.showDeleteMessage)
    },
    handleRecoverItem(item: IQueueItem) {
      this.handlePushItem(item, this.recoveredQueue, this.showRecoverMessage, (item: IQueueItem) => {
        if (this.checkRecoveredItemShowing(item)) {
          clearTimeout(this.messageTimer)
          this.isShowDeleteMessage = false
          setTimeout(() => {
            this.deletedQueue.shift()
            this.showDeleteMessage()
          }, 500)
        }
      })
    },
    handleMoveItem(item: IQueueItem) {
      this.handlePushItem(item, this.movedQueue, this.showMoveMessage)
    },
    handleDeleteFolder(payload: { pathedFolder: IPathedFolder, empty: boolean }) {
      const { pathedFolder, empty } = payload
      if (empty) {
        this.deleteFolder(pathedFolder, () => {
          this.handleDeleteItem({
            type: 'folder',
            data: pathedFolder.folder,
            dest: `f:${pathedFolder.parents.join('/')}`
          })
        })
      } else {
        this.pathedFolderBuffer = pathedFolder
        this.confirmMessage = 'delete-folder'
      }
    },
    handleDeleteForever(payload: IDesign) {
      this.designBuffer = payload
      this.confirmMessage = 'delete-forever'
    },
    handleDeleteFolderForever(payload: IFolder) {
      this.pathedFolderBuffer = { parents: [], folder: payload }
      this.confirmMessage = 'delete-forever'
    },
    handleFavDelMouseOver(val: boolean) {
      this.isFavDelMouseOver = val && this.mydesignView === 'favorite-design-view'
    },
    handleMoveToFolder() {
      if (this.moveToFolderSelectInfo === '') return
      const destination = [designUtils.ROOT, ...(designUtils.makePath(this.moveToFolderSelectInfo))]
      if (this.isMovingSingleToFolder && this.designBuffer) {
        designUtils.move(this.designBuffer, destination)
        this.handleMoveItem({
          type: 'design',
          data: this.designBuffer,
          dest: designUtils.search(this.copiedFolders, destination.slice(1))?.name ?? ''
        })
        this.designBuffer = undefined
      } else {
        designUtils.moveAll(Object.values(this.selectedDesigns), destination)
        this.handleMoveItem({
          type: 'multi',
          data: (Object.values(this.selectedDesigns) as IDesign[])[0],
          dest: designUtils.search(this.copiedFolders, destination.slice(1))?.name ?? ''
        })
      }
      this.isMoveToFolderPanelOpen = false
    },
    handleMoveDesignToFolder(design: IDesign) {
      this.designBuffer = design
      this.isMovingSingleToFolder = true
      this.isMoveToFolderPanelOpen = true
    },
    handleDownloadDesign(design: IDesign) {
      this.designBuffer = design
      this.confirmMessage = 'download'
    },
    checkRecoveredItemShowing(item: IQueueItem): boolean {
      const currentShowing = this.deletedQueue[0]
      if (!currentShowing) return false
      if (item.type !== currentShowing.type) return false
      if (item.type === 'design') {
        return (item.data as IDesign).asset_index === (currentShowing.data as IDesign).asset_index
      }
      if (item.type === 'folder') {
        return (item.data as IFolder).id === (currentShowing.data as IFolder).id
      }
      return false
    },
    deleteFolder(pathedFolder?: IPathedFolder, callback?: () => void) {
      if (!pathedFolder) return
      this.pathedFolderBuffer = undefined
      designUtils.deleteFolder(pathedFolder).then(() => {
        if (callback) callback()
        if (this.currLocation !== `f:${designUtils.createPath(pathedFolder).join('/')}`) return
        if (pathedFolder.parents.length > 1) {
          this.setCurrLocation(`f:${pathedFolder.parents.join('/')}`)
        } else {
          this.setCurrLocation('a')
        }
      })
    },
    recover() {
      const item = this.deletedQueue[0]
      if (item) {
        clearTimeout(this.messageTimer)
        if (item.type === 'design') {
          designUtils.recover(item.data as IDesign, item.dest)
        }
        if (item.type === 'folder') {
          designUtils.recoverFolder(item.data as IFolder, item.dest)
        }
        this.isShowDeleteMessage = false
        setTimeout(() => {
          this.deletedQueue.shift()
          this.showDeleteMessage()
        }, 500)
      }
    },
    toggleAllFavorite() {
      if (this.mydesignView === 'favorite-design-view') {
        designUtils.removeAllFromFavorite(Object.values(this.selectedDesigns))
      } else {
        designUtils.addAllToFavorite(Object.values(this.selectedDesigns))
      }
    },
    deleteAll() {
      this.confirmMessage = 'delete-all'
    },
    recoverAll() {
      designUtils.recoverAll(Object.values(this.selectedDesigns), Object.values(this.selectedFolders)).then((dest) => {
        if (dest === '') return
        this.handleRecoverItem({
          type: 'multi',
          data: undefined,
          dest
        })
      })
    },
    deleteAllForever() {
      this.confirmMessage = 'delete-forever'
    },
    deleteAllConfirmed() {
      designUtils.deleteAll(Object.values(this.selectedDesigns))
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
      if (this.isMultiSelected) {
        designUtils.deleteAllForever(Object.values(this.selectedDesigns), Object.values(this.selectedFolders))
      }
    },
    closeConfirmMessage() {
      this.confirmMessage = ''
      this.pathedFolderBuffer = undefined
      this.designBuffer = undefined
    },
    confirmAction(action: () => void) {
      action()
      this.closeConfirmMessage()
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design-pc {
  @include size(100%, 100%);
  max-height: 100%;
  &__content {
    position: relative;
    height: calc(100% - #{$header-height});
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: auto 1fr;
  }
  &__design-view {
    position: relative;
  }
  &__multi {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 55px;
    background-color: setColor(gray-6);
    box-shadow: 0px 5px 12px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    z-index: 1;
    &__container {
      position: relative;
      @include size(100%, 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 118px;
      padding-right: 154.72px;
      box-sizing: border-box;
    }
    &__number {
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      > span {
        font-weight: 700;
        font-size: 14px;
        line-height: 20px;
        color: setColor(gray-2);
      }
    }
    &__actions {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      height: 21px;
      display: flex;
      align-items: center;
      gap: 33px;
    }
    &__icon {
      width: 21px;
      height: 21px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background-color: setColor(gray-4);
      }
    }
    &__close {
      width: 11px;
      height: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
  &__message-stack {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  &__message {
    height: 49px;
    display: flex;
    align-items: center;
    gap: 14px;
    padding-left: 8px;
    padding-right: 10px;
    background-color: #373b53;
    border-radius: 10px;
    &__img {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      background-size: cover;
      background-position: center center;
    }
    &__text {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 25px;
      > span {
        font-weight: 400;
        font-size: 16px;
        line-height: 25px;
        color: white;
        letter-spacing: 0.205em;
        white-space: nowrap;
      }
    }
    &__button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 25px;
      background-color: setColor(blue-3);
      border-radius: 18px;
      cursor: pointer;
      > span {
        font-weight: 700;
        font-size: 16px;
        line-height: 25px;
        color: setColor(gray-2);
        letter-spacing: 0.205em;
      }
    }
  }
  &__change-folder {
    z-index: 1;
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    width: 415px;
    height: 627px;
    box-shadow: 0px 2px 9px rgba(151, 150, 150, 0.35);
    border-radius: 3px;
    &.centered {
      z-index: 1001;
      top: 50%;
      left: calc(50% - 120px);
      transform: translate(-50%, -50%);
    }
    &__container {
      position: relative;
      height: 100%;
      width: 100%;
      border-radius: 3px;
      overflow-y: auto;
    }
    &__header {
      position: sticky;
      top: 0;
      background-color: white;
      display: flex;
      height: 43px;
      flex-direction: column;
      align-items: center;
      z-index: 1;
      margin: 0 2px;
    }
    &__title {
      margin-top: 11px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      > span {
        font-size: 14px;
        font-weight: 700;
        line-height: 20px;
        letter-spacing: 2px;
        text-indent: 2px;
        display: block;
        color: setColor(gray-2);
      }
    }
    &__hr {
      margin-top: 10px;
      width: 365.5px;
      height: 2px;
      background-color: setColor(gray-4);
    }
    &__folders {
      width: calc(100% - 4px);
      min-height: calc(100% - 101px);
      margin: auto;
    }
    &__footer {
      position: sticky;
      bottom: 0;
      background-color: white;
      display: flex;
      height: 58px;
      flex-direction: column;
      align-items: center;
      margin: 0 2px;
    }
    &__buttons {
      height: 25px;
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }
    &__cancel {
      height: 25px;
      padding: 0 12px;
      background-color: setColor(gray-4);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      > span {
        font-size: 12px;
        line-height: 25px;
        display: block;
        color: setColor(gray-2);
      }
    }
    &__confirm {
      height: 25px;
      padding: 0 12px;
      background-color: setColor(blue-1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      > span {
        font-size: 12px;
        line-height: 25px;
        display: block;
        color: white;
      }
      &.disabled {
        background-color: setColor(gray-4);
        cursor: not-allowed;
        > span {
          color: setColor(gray-2);
        }
      }
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
      left: calc(100% + 11px);
      padding: 0px 8px;
      height: 28px;
      background-color: setColor(gray-2);
      border-radius: 5px;
      > span {
        font-weight: 400;
        font-size: 12px;
        line-height: 28px;
        white-space: nowrap;
        color: white;
      }
    }
  }
  &__download {
    width: 210px;
  }
}

.design-view {
  height: 100%;
  width: 100%;
}

.dim-background {
  @include size(125%, 125%);
  position: fixed;
  top: -12.5%;
  left: -12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(24, 25, 31, 0.7);
  z-index: 1000;
}

$messageTypes: delete-all, delete-folder, delete-forever;

@each $messageType in $messageTypes {
  .#{$messageType}-message {
    background-color: white;
    box-shadow: 0px 0px 12px rgba(151, 150, 150, 0.4);
    border-radius: 2px;
    display: flex;
    &__img {
      height: 57px;
    }
    &__text {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 26px;
      > span {
        font-weight: 700;
        font-size: 14px;
        line-height: 26px;
        color: setColor(gray-2);
      }
    }
    &__description {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 12px;
      > span {
        font-weight: 400;
        font-size: 12px;
        line-height: 12px;
        color: setColor(gray-3);
      }
    }
    &__buttons {
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 11px;
      > div {
        height: 25px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0 12px;
        > span {
          font-weight: 400;
          font-size: 12px;
          line-height: 25px;
        }
      }
    }
    &__cancel {
      background-color: setColor(gray-4);
      &:hover {
        background-color: setColor(red-2);
        > span {
          color: white;
        }
        & ~ div {
          background-color: setColor(gray-4);
          > span {
            color: white;
          }
        }
      }
      > span {
        display: block;
        color: black;
      }
    }
    &__confirm {
      background-color: setColor(red-1);
      &:hover {
        background-color: setColor(red-2);
      }
      > span {
        display: block;
        color: white;
      }
    }
  }
}

.delete-all-message {
  min-width: 243px;
  height: 158px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  &__buttons {
    margin-top: 8px;
  }
}

.delete-folder-message {
  width: 349px;
  gap: 16px;
  &__img {
    margin-top: 14px;
    margin-left: 14px;
    width: 76px;
    height: 79px;
  }
  &__text {
    display: flex;
    flex-direction: column;
    height: unset;
    > span {
      text-align: left;
      width: 240px;
      display: block;
      letter-spacing: 0.115em;
      margin-left: 3px;
      &.first-line {
        margin-top: 22px;
      }
    }
  }
  &__buttons {
    margin-top: 17px;
    margin-bottom: 37px;
  }
}

.delete-forever-message {
  min-width: 259px;
  height: 174px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  &__buttons {
    margin-top: 14px;
    height: 30px;
    > div {
      height: 30px;
    }
  }
}

.slide-fade-enter-active {
  transition: 0.3s ease;
}

.slide-fade-leave-active {
  transition: 0.5s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;
}

.slide-down-fade-enter-active,
.slide-down-fade-leave-active {
  transition: 0.2s;
}

.slide-down-fade-enter,
.slide-down-fade-leave-to {
  top: -55px;
  opacity: 0;
}

.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: 0.05s;
}

.scale-fade-enter,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.slide-fade-img,
.slide-fade-text {
  &-enter-active,
  &-leave-active {
    transition: 0.2s;
  }
  &-enter,
  &-leave-to {
    opacity: 0;
  }
}

.slide-fade-img-enter,
.slide-fade-img-leave-to {
  left: 100%;
}

.slide-fade-text-enter,
.slide-fade-text-leave-to {
  left: calc(100% + 9px);
}
</style>
