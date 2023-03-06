<template lang="pug">
div(class="bottom-menu" :style="rootStyles")
  div(class="bottom-menu__wrapper relative")
    div(v-if="isPrevButtonNeeded" class="bottom-menu__prev pointer"
        @click.stop="handlePrevMenu")
      svg-icon(iconName="chevron-left" iconColor="gray-3" iconWidth="20px")
    div(class="bottom-menu__close pointer"
        @click.stop="handleCloseMenu")
      svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
    template(v-if="isAnySelected && bottomMenu === ''")
      div(class="multi-menu")
        div(class="multi-menu__title")
          i18n-t(keypath="NN0254" tag="span")
            template(#selectedNum) {{selectedNum}}
        div(class="menu__hr")
        div(class="multi-menu__actions")
          div(v-for="multiMenuItem in multiMenuItems"
              class="multi-menu__action"
              @click.stop="multiMenuItem.action")
            svg-icon(:iconName="multiMenuItem.icon" iconWidth="24px" iconColor="gray-2")
    template(v-else)
      div(v-if="bottomMenu === 'trash-info'" class="trash-info") {{$t('NN0241')}}
      div(v-if="bottomMenu === 'new-folder'" class="new-folder")
        div(class="new-folder__name-editor")
          input(ref="name"
                class="new-folder__input"
                :placeholder="$t('NN0691')"
                v-model="editableName"
                @change="handleNewFolder"
                @keyup="checkNameLength")
          div(v-if="editableName.length" class="new-folder__icon" @click.stop="handleClearNewFolderName")
            svg-icon(iconName="close" iconColor="gray-3" iconWidth="24px")
        div(v-if="isShowHint" class="menu__hint in-new-folder") {{ $t('NN0226') }}
        div(class="new-folder__confirm"
            :class="{disabled: !editableName.length}"
            @click.stop="handleNewFolder") {{ $t('NN0190') }}
      div(v-if="bottomMenu === 'sort-menu'" class="sort-menu menu")
        div(v-for="sortMenuItem in sortMenuItems"
            class="menu__item pointer"
            :class="{selected: checkSortSelected(sortMenuItem.payload)}"
            @click.stop="handleSortByClick(sortMenuItem.payload)")
          div(class="menu__item-icon")
            svg-icon(:iconName="sortMenuItem.icon"
                    iconWidth="24px"
                    iconColor="gray-2"
                    :style="sortMenuItem.style")
          div(class="menu__item-text")
            span {{ sortMenuItem.text }}
      div(v-if="bottomMenu === 'design-menu'" class="design-menu menu")
        template(v-if="currLocation !== 't'")
          div(class="menu__editable-name")
            div(v-if="isNameEditing"
                class="menu__editable-name__text menu__editable-name__text-editor")
              input(ref="name"
                    v-model="editableName"
                    @change="handleNameEditEnd"
                    @keyup="checkNameEnter")
            div(v-else class="menu__editable-name__text")
              span(:title="designBuffer.name") {{ designBuffer.name }}
            div(v-if="!isNameEditing" class="menu__editable-name__icon"
                @click.stop="handleNameClick")
              svg-icon(iconName="pen" iconWidth="18px" iconColor="gray-2")
          div(v-if="!isNameEditing" class="menu__description" @click.stop.prevent) {{ `${designBuffer.width} x ${designBuffer.height} ${designBuffer.unit}` }}
          div(v-if="isNameEditing" style="width: 100%; height: 8px;")
          div(v-else class="menu__hr")
        div(v-else style="margin-top: 20px;")
        template(v-if="!isNameEditing")
          div(v-for="designMenuItem in designMenuItems"
              class="menu__item"
              @click.stop="handleDesignMenuAction(designMenuItem.icon)")
            div(class="menu__item-icon")
              svg-icon(:iconName="designMenuItem.icon"
                      :iconWidth="designMenuItem.icon === 'confirm-circle' ? '22px' : '24px'"
                      :iconColor="designMenuItem.icon === 'favorites-fill' ? 'gray-3' : 'gray-2'")
            div(class="menu__item-text")
              span {{ designMenuItem.text }}
      div(v-if="bottomMenu === 'folder-menu'" class="folder-menu menu")
        template(v-if="currLocation !== 't'")
          div(class="menu__editable-name")
            div(v-if="isNameEditing"
                class="menu__editable-name__text menu__editable-name__text-editor")
              input(ref="name"
                    v-model="editableName"
                    @change="handleNameEditEnd"
                    @keyup="checkNameEnter")
            div(v-else class="menu__editable-name__text")
              span(:title="folderBuffer.folder.name") {{ folderBuffer.folder.name }}
            div(v-if="!isNameEditing" class="menu__editable-name__icon"
                @click.stop="handleNameClick")
              svg-icon(iconName="pen" iconWidth="18px" iconColor="gray-2")
          template(v-if="!isNameEditing")
            div(v-if="itemCount >= 0" class="menu__description" @click.stop.prevent) {{ $t('NN0197', { num: itemCount }) }}
            div(v-else class="menu__description" @click.stop.prevent) ...
          div(v-if="isNameEditing && isShowHint" class="menu__hint in-folder-menu") {{ $t('NN0226') }}
          div(v-if="isNameEditing" style="width: 100%; height: 8px;")
          div(v-else class="menu__hr")
        div(v-else style="margin-top: 20px;")
        template(v-if="!isNameEditing")
          div(v-for="folderMenuItem in folderMenuItems"
              class="menu__item"
              @click.stop="handleFolderMenuAction(folderMenuItem.icon)")
            div(class="menu__item-icon")
              svg-icon(:iconName="folderMenuItem.icon"
                      :iconWidth="folderMenuItem.icon === 'confirm-circle' ? '22px' : '24px'"
                      iconColor="gray-2")
            div(class="menu__item-text")
              span {{ folderMenuItem.text }}
      div(v-if="bottomMenu === 'move-folder'" class="move-folder"
          @click.stop.prevent="clearMoveToFolderSelectInfo")
        div(class="move-folder__folders"
            @click.stop.prevent="clearMoveToFolderSelectInfo")
          mobile-structure-folder(v-for="folder in realFolders"
                          :folder="folder"
                          :parents="[]"
                          :level="0")
        div(class="move-folder__hr"
            @click.stop.prevent="clearMoveToFolderSelectInfo")
        div(class="move-folder__footer")
          div(class="move-folder__new-folder"
              :class="{disabled: isMaxLevelReached}"
              @click.stop.prevent="handleCreateFolder")
            div(class="move-folder__new-folder__icon")
              svg-icon(iconName="folder_plus"
                      :iconColor="isMaxLevelReached ? 'gray-4' : 'gray-2'"
                      iconWidth="24px")
            div(class="move-folder__new-folder__text" :class="{disabled: isMaxLevelReached}") {{ $t('NN0190') }}
          div(class="move-folder__confirm"
              :class="{'disabled': moveToFolderSelectInfo === ''}"
              @click.stop="handleMoveToFolder") {{ $t('NN0206') }}
</template>

<script lang="ts">
import MobileStructureFolder from '@/components/mydesign/MobileStructureFolder.vue'
import { IDesign, IFolder } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

const PREV_BUTTON_MENUS = ['new-folder', 'move-folder']

export default defineComponent({
  components: {
    MobileStructureFolder
  },
  emits: ['menuAction', 'back', 'clear', 'close', 'push'],
  data() {
    return {
      sortMenuItems: [
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(-90deg)',
          text: `${this.$t('NN0192')}`,
          payload: ['name', false]
        },
        {
          icon: 'chevron-duo-left',
          style: 'transform: rotate(90deg)',
          text: `${this.$t('NN0193')}`,
          payload: ['name', true]
        },
        {
          icon: 'clock',
          style: '',
          text: `${this.$t('NN0195')}`,
          payload: ['update', false]
        },
        {
          icon: 'clock',
          style: '',
          text: `${this.$t('NN0194')}`,
          payload: ['update', true]
        }
      ] as { icon: string, style: string, text: string, payload: [string, boolean] }[],
      isNameEditing: false,
      editableName: '',
      messageTimer: -1,
      isShowHint: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    bottomMenu: {
      type: String,
      required: true
    },
    selectedNum: {
      type: Number,
      required: true
    },
    isAnySelected: {
      type: Boolean,
      required: true
    },
    menuStack: {
      type: Array,
      required: true
    }
  },
  mounted() {
    this.prepareForMenu(this.bottomMenu)
  },
  unmounted() {
    this.clearBuffers()
  },
  watch: {
    bottomMenu(newVal) {
      this.prepareForMenu(newVal)
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      copiedFolders: 'getCopiedFolders',
      moveToFolderSelectInfo: 'getMoveToFolderSelectInfo',
      selectedDesigns: 'getSelectedDesigns',
      selectedFolders: 'getSelectedFolders',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders',
      sortByField: 'getSortByField',
      sortByDescending: 'getSortByDescending',
      isDesignsLoading: 'getIsDesignsLoading',
      isFoldersLoading: 'getIsFoldersLoading',
      itemCount: 'getItemCount',
      designBuffer: 'getMobileDesignBuffer',
      folderBuffer: 'getMobileFolderBuffer',
      pathBuffer: 'getMobilePathBuffer'
    }),
    ...mapGetters({
      userInfo: 'webView/getUserInfo'
    }),
    rootStyles(): {[key: string]: string} {
      return {
        paddingBottom: `${this.userInfo.homeIndicatorHeight}px`
      }
    },
    designMenuItems(): any[] {
      switch (this.currLocation) {
        case 'a':
          return designUtils.makeMobileNormalMenuItems(this.designBuffer.favorite, false)
        case 'h':
          return designUtils.makeMobileFavoriteMenuItems()
        case 't':
          return designUtils.makeMobileTrashMenuItems()
        default:
          return designUtils.makeMobileNormalMenuItems(this.designBuffer.favorite, true)
      }
    },
    folderMenuItems(): any[] {
      switch (this.currLocation) {
        case 'l':
          return designUtils.makeMobileNormalFolderMenuItems(false)
        case 't':
          return designUtils.makeMobileTrashFolderMenuItems()
        default:
          if (this.currLocation.startsWith('f')) {
            return designUtils.makeMobileNormalFolderMenuItems(true)
          } else {
            return []
          }
      }
    },
    multiMenuItems(): any[] {
      const res = []
      const isInFolder = this.currLocation.startsWith('f')
      if (['a', 'h'].includes(this.currLocation) || isInFolder) {
        res.push({
          icon: 'heart',
          action: () => {
            if (this.currLocation === 'h') {
              designUtils.removeAllFromFavorite(Object.values(this.selectedDesigns))
              this.$emit('menuAction', { event: 'unfavorDesign', payload: {} })
            } else {
              designUtils.addAllToFavorite(Object.values(this.selectedDesigns))
              this.$emit('menuAction', { event: 'favorDesign', payload: {} })
            }
          }
        })
      }
      if (['a'].includes(this.currLocation) || isInFolder) {
        res.push({
          icon: 'folder',
          action: () => {
            this.snapshotFolders()
            this.setBottomMenu('move-folder')
          }
        })
      }
      if (['t'].includes(this.currLocation)) {
        res.push({
          icon: 'undo',
          action: () => {
            const selectedDesigns = Object.values(this.selectedDesigns) as IDesign[]
            const selectedFolders = Object.values(this.selectedFolders) as IFolder[]
            const designCount = selectedDesigns.length
            const folderCount = selectedFolders.length
            designUtils.recoverAll(selectedDesigns, selectedFolders)
            this.$emit('menuAction', {
              event: 'recoverItem',
              payload: {
                type: (designCount + folderCount > 1) ? 'multi' : (designCount > 0 ? 'design' : 'folder')
              }
            })
          }
        })
      }
      if (['a', 'h', 't'].includes(this.currLocation) || isInFolder) {
        res.push({
          icon: 'trash',
          action: () => {
            if (this.currLocation === 't') {
              this.$emit('menuAction', { event: 'deleteAllForever' })
            } else {
              if (Object.values(this.selectedDesigns).length === 1) {
                designUtils.deleteAll(Object.values(this.selectedDesigns))
                this.$emit('menuAction', { event: 'deleteItem' })
              } else {
                this.$emit('menuAction', { event: 'deleteAll' })
              }
            }
          }
        })
      }
      return res
    },
    isPrevButtonNeeded(): boolean {
      return PREV_BUTTON_MENUS.includes(this.bottomMenu)
    },
    isDesignMenu(): boolean {
      return this.bottomMenu === 'design-menu'
    },
    realFolders(): IFolder[] {
      return designUtils.sortByCreateTime([...this.copiedFolders])
    },
    isMaxLevelReached(): boolean {
      if (this.moveToFolderSelectInfo === '') {
        return false
      } else {
        return designUtils.isMaxLevelReached(designUtils.makePath(this.moveToFolderSelectInfo).length - 1)
      }
    }
  },
  methods: {
    ...mapActions('design', {
      fetchItemCount: 'fetchItemCount'
    }),
    ...mapMutations('design', {
      setSortByField: 'SET_sortByField',
      setSortByDescending: 'SET_sortByDescending',
      clearBuffers: 'UPDATE_clearBuffers',
      setBottomMenu: 'SET_bottomMenu',
      setPathBuffer: 'SET_mobilePathBuffer',
      snapshotFolders: 'UPDATE_snapshotFolders',
      setMoveToFolderSelectInfo: 'SET_moveToFolderSelectInfo'
    }),
    checkSortSelected(payload: [string, boolean]): boolean {
      return this.sortByField === payload[0] && this.sortByDescending === payload[1]
    },
    prepareForMenu(bottomMenu: string) {
      if (bottomMenu === '') {
        this.clearBuffers()
      }
      if (bottomMenu === 'new-folder') {
        this.editableName = ''
        this.$nextTick(() => {
          const nameInput = this.$refs.name as HTMLInputElement
          nameInput.focus()
        })
      }
      if (bottomMenu === 'folder-menu') {
        this.fetchItemCount({
          path: designUtils.createPath(this.folderBuffer).slice(1).join(',')
        })
      }
    },
    handlePrevMenu() {
      this.$emit('back')
      this.handleClearNewFolderName()
    },
    handleCloseMenu() {
      if (this.isNameEditing) {
        this.handleNameEditEnd()
      } else {
        this.$emit('clear')
        this.$emit('close')
      }
    },
    handleSortByClick(payload: [string, boolean]) {
      this.setSortByField(payload[0])
      this.setSortByDescending(payload[1])
      designUtils.emit('refresh')
    },
    handleDesignMenuAction(icon: string) {
      if (this.currLocation === 't' && icon === 'trash') icon = 'delete'
      designUtils.dispatchDesignMenuAction(icon, this.designBuffer, (extraEvent) => {
        if (extraEvent) {
          this.$emit('menuAction', extraEvent)
        }
        if (icon === 'folder') return
        this.$emit('close')
      })
    },
    handleFolderMenuAction(icon: string) {
      if (this.currLocation === 't' && icon === 'trash') icon = 'delete'
      designUtils.dispatchMobileFolderMenuAction(icon, this.folderBuffer, (extraEvent) => {
        if (extraEvent) {
          this.$emit('menuAction', extraEvent)
        }
        if (icon === 'folder') return
        this.$emit('close')
      })
    },
    checkNameEnter(e: KeyboardEvent) {
      const originalName = this.isDesignMenu ? this.designBuffer.name : this.folderBuffer.folder.name
      if (e.key === 'Enter' && this.editableName === originalName) {
        this.handleNameEditEnd()
        return
      }
      this.checkNameLength()
    },
    handleNameClick() {
      if (this.isDesignMenu) {
        this.editableName = this.designBuffer.name
      } else {
        this.editableName = this.folderBuffer.folder.name
      }
      this.isNameEditing = true
      this.$nextTick(() => {
        const nameInput = this.$refs.name as HTMLInputElement
        nameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.isDesignMenu) {
        if (this.editableName === '' || this.editableName === this.designBuffer.name) return
        designUtils.setDesignName(this.designBuffer, this.editableName)
      } else {
        if (this.editableName === '' || this.editableName === this.folderBuffer.folder.name) return
        this.checkNameLength()
        designUtils.setFolderName(this.folderBuffer.folder, this.editableName, this.folderBuffer.parents as string[])
      }
      this.editableName = ''
    },
    checkNameLength() {
      if (this.editableName.length > 64) {
        this.editableName = this.editableName.substring(0, 64)
        if (this.messageTimer) {
          clearTimeout(this.messageTimer)
        }
        this.isShowHint = true
        this.messageTimer = window.setTimeout(() => {
          this.isShowHint = false
          this.messageTimer = -1
        }, 3000)
      }
    },
    handleCreateFolder() {
      if (this.isMaxLevelReached) return
      this.$emit('push', this.bottomMenu)
      if (this.moveToFolderSelectInfo === '') {
        this.setPathBuffer([designUtils.ROOT])
      } else {
        this.setPathBuffer([designUtils.ROOT, ...designUtils.makePath(this.moveToFolderSelectInfo)])
      }
      this.setBottomMenu('new-folder')
    },
    handleNewFolder() {
      setTimeout(() => {
        if (!this.editableName.length) return
        const folderName = this.editableName
        this.editableName = ''
        if (this.menuStack.length && this.menuStack[this.menuStack.length - 1] === 'move-folder') {
          const id = designUtils.addNewFolder(this.pathBuffer, false, folderName, true)
          const folder = designUtils.search(this.copiedFolders, [...this.pathBuffer, id].slice(1))
          if (folder) {
            designUtils.createFolder(this.pathBuffer, folder, folderName)
          }
        } else {
          const id = designUtils.addNewFolder(this.pathBuffer, true, folderName)
          const folder = designUtils.findFolder(this.allFolders, id)
          if (folder) {
            designUtils.createFolder(this.pathBuffer, folder, folderName)
          }
        }
        this.$emit('back')
      }, 500)
    },
    handleClearNewFolderName() {
      this.editableName = ''
    },
    handleMoveToFolder() {
      if (this.moveToFolderSelectInfo === '') return
      const destination = [designUtils.ROOT, ...(designUtils.makePath(this.moveToFolderSelectInfo))]
      if (this.designBuffer) {
        designUtils.move(this.designBuffer, destination)
        this.$emit('menuAction', {
          event: 'moveItem',
          payload: 'design'
        })
      } else if (this.folderBuffer) {
        designUtils.moveFolder(this.folderBuffer, destination)
        this.$emit('menuAction', {
          event: 'moveItem',
          payload: 'folder'
        })
      } else {
        const selectedDesigns = Object.values(this.selectedDesigns) as IDesign[]
        designUtils.moveAll(selectedDesigns, destination)
        this.$emit('menuAction', {
          event: 'moveItem',
          payload: selectedDesigns.length > 1 ? 'multi' : 'design'
        })
        this.$emit('clear')
      }
      this.$emit('close')
    },
    clearMoveToFolderSelectInfo() {
      this.setMoveToFolderSelectInfo('')
    }
  }
})
</script>

<style lang="scss" scoped>
.bottom-menu {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  background: #FFFFFF;
  box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
  border-radius: 10px 10px 0px 0px;
  z-index: 1001;
  &__wrapper {
    @include size(100%, 100%);
  }
  &__prev {
    position: absolute;
    top: 16px;
    left: 16px;
    @include size(20px, 20px);
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
      transform: translate(-1px);
    }
  }
  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    @include size(20px, 20px);
    border-radius: 50%;
    background: setColor(gray-4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  margin-top: 21px;
  margin-bottom: 58px;
}

.trash-info {
  width: 100%;
  height: 59px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu {
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  &__editable-name {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-left: 22.5px;
    > div + div {
      margin-left: 8px;
    }
    &__text {
      max-width: 65vw;
      @include text-H6;
      color: setColor(gray-2);
      white-space: nowrap;
      text-overflow: ellipsis;
      display: block;
      overflow: hidden;
      &-editor {
        > input {
          width: 65vw;
          padding: 0;
          @include text-H6;
          color: setColor(gray-2);
        }
      }
    }
    &__icon {
      @include size(18px);
    }
  }
  &__description {
    margin-top: 8px;
    margin-left: 24px;
    text-align: left;
    font-size: 12px;
    line-height: 20px;
    color: setColor(gray-3);
  }
  &__hr {
    margin: 16px auto;
    width: calc(100% - 32px);
    height: 1px;
    background: setColor(gray-4);
  }
  &__item {
    height: 40px;
    display: flex;
    align-items: center;
    > div + div {
      margin-left: 16px;
    }
    &.selected, &:active {
      background: setColor(blue-4);
    }
    &-icon {
      margin-left: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }
    &-text {
      height: 24px;
      display: flex;
      align-items: center;
      > span {
        font-weight: 400;
        font-size: 14px;
        line-height: 24px;
        color: setColor(gray-2);
        white-space: nowrap;
      }
    }
  }
  &__hint {
    text-align: left;
    font-weight: 400;
    font-size: 12px;
    line-height: 140%;
    color: setColor(red);
    &.in-folder-menu {
      margin-top: 10px;
      margin-left: 22.5px;
    }
    &.in-new-folder {
      padding: 0 8px;
    }
  }
}

.sort-menu {
  padding-top: 44px;
}

.design-menu, .folder-menu {
  padding-top: 24px;
}

.new-folder {
  padding: 16px;
  padding-top: 56px;
  display: flex;
  flex-direction: column;
  &__name-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6.5px 8px 6.5px 15px;
    height: 42px;
    border: 1px solid #D9DBE1;
    border-radius: 3px;
    box-sizing: border-box;
    margin-bottom: 8px;
  }
  &__input {
    padding: 0;
    font-weight: 500;
    font-size: 16px;
    line-height: 180%;
    color: setColor(gray-2);
    &::placeholder {
      color: setColor(gray-4);
    }
  }
  &__icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__confirm {
    display: flex;
    align-items: center;
    justify-content: center;
    background: setColor(blue-1);
    border-radius: 5px;
    height: 42px;
    font-weight: 500;
    font-size: 14px;
    line-height: 180%;
    color: white;
    margin-top: 8px;
    &.disabled {
      background: setColor(gray-5);
      color: setColor(gray-3);
    }
  }
}

.move-folder {
  padding-top: 52px;
  padding-bottom: 16px;
  &__folders {
    @include no-scrollbar;
    height: 174px;
    overflow-y: auto;
  }
  &__hr {
    margin: 10px auto 12px auto;
    width: calc(100% - 32px);
    height: 1px;
    background: setColor(gray-4);
  }
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 16px;
    padding-right: 15px;
  }
  &__new-folder {
    display: flex;
    align-items: center;
    height: 42px;
    border-radius: 4px;
    box-sizing: border-box;
    padding: 0 8px;
    > div + div {
      margin-left: 16px;
    }
    &__icon {
      @include size(24px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      font-weight: 400;
      font-size: 14px;
      line-height: 180%;
      color: setColor(gray-2);
      transition: color 0.2s;
      &.disabled {
        color: setColor(gray-4);
      }
    }
  }
  &__confirm {
    display: flex;
    align-items: center;
    justify-content: center;
    background: setColor(blue-1);
    border-radius: 5px;
    height: 42px;
    padding: 0 12px;
    font-weight: 500;
    font-size: 14px;
    line-height: 180%;
    color: white;
    box-sizing: border-box;
    &.disabled {
      background: setColor(gray-6);
      color: setColor(gray-3);
    }
  }
}

.multi-menu {
  padding-top: 24px;
  padding-bottom: 16px;
  &__title {
    font-weight: 600;
    font-size: 16px;
    line-height: 140%;
    color: setColor(gray-2);
  }
  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    > div + div {
      margin-left: 64px;
    }
  }
  &__action {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
