<template lang="pug">
  div(class="bottom-menu")
    div(class="bottom-menu__wrapper relative")
      div(v-if="isPrevButtonNeeded" class="bottom-menu__prev pointer")
        svg-icon(iconName="chevron-left" iconColor="gray-3" iconWidth="20px")
      div(class="bottom-menu__close pointer"
          @pointerdown="handleCloseMenu")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
      template(v-if="isAnySelected")
        div(class="multi-menu")
          div(class="multi-menu__title")
            i18n(path="NN0254" tag="span")
              template(#selectedNum) {{selectedNum}}
          div(class="menu__hr")
          div(class="multi-menu__actions")
            div(v-for="multiMenuItem in multiMenuItems"
                class="multi-menu__action"
                @pointerdown="multiMenuItem.action")
              svg-icon(:iconName="multiMenuItem.icon" iconWidth="24px" iconColor="gray-2")
      template(v-else)
        div(v-if="bottomMenu === 'trash-info'" class="trash-info") {{$t('NN0241')}}
        div(v-if="bottomMenu === 'sort-menu'" class="sort-menu menu")
          div(v-for="sortMenuItem in sortMenuItems"
              class="menu__item pointer"
              :class="{selected: checkSortSelected(sortMenuItem.payload)}"
              @pointerdown="handleSortByClick(sortMenuItem.payload)")
            div(class="menu__item-icon")
              svg-icon(:iconName="sortMenuItem.icon"
                      iconWidth="24px"
                      iconColor="gray-2"
                      :style="sortMenuItem.style")
            div(class="menu__item-text")
              span {{ sortMenuItem.text }}
        div(v-if="bottomMenu === 'design-menu'" class="design-menu menu")
          div(class="menu__editable-name")
            div(v-if="isNameEditing"
                class="menu__editable-name__text menu__editable-name__text-editor")
              input(ref="name"
                    v-model="editableName"
                    @change="handleNameEditEnd"
                    @keyup="checkNameEnter")
            div(v-else class="menu__editable-name__text")
              span(:title="designBuffer.name") {{ designBuffer.name }}
            div(class="menu__editable-name__icon"
                @pointerdown="handleNameClick")
              svg-icon(iconName="pen" iconWidth="18px" :iconColor="isNameEditing ? 'blue-1' : 'gray-2'")
          div(class="menu__description" @pointerdown.prevent) {{ `${designBuffer.width} x ${designBuffer.height}` }}
          div(v-if="isNameEditing" style="width: 100%; height: 16px;")
          div(v-else class="menu__hr")
          template(v-if="!isNameEditing")
            div(v-for="designMenuItem in designMenuItems"
                class="menu__item"
                @pointerdown="handleDesignMenuAction(designMenuItem.icon)")
              div(class="menu__item-icon")
                svg-icon(:iconName="designMenuItem.icon"
                        :iconWidth="designMenuItem.icon === 'confirm-circle' ? '22px' : '24px'"
                        iconColor="gray-2")
              div(class="menu__item-text")
                span {{ designMenuItem.text }}
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'

const PREV_BUTTON_MENUS = ['new-folder', 'move-folder']

export default Vue.extend({
  components: {
  },
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
      ],
      isNameEditing: false,
      editableName: ''
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    bottomMenu: String,
    selectedNum: Number,
    isAnySelected: Boolean
  },
  destroyed() {
    this.clearBuffers()
  },
  watch: {
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders',
      sortByField: 'getSortByField',
      sortByDescending: 'getSortByDescending',
      isDesignsLoading: 'getIsDesignsLoading',
      isFoldersLoading: 'getIsFoldersLoading',
      itemCount: 'getItemCount',
      designBuffer: 'getMobileDesignBuffer'
    }),
    designMenuItems(): any[] {
      switch (this.currLocation) {
        case 'a':
          return designUtils.makeMobileNormalMenuItems()
        default:
          return []
      }
    },
    multiMenuItems(): any[] {
      const res = []
      if (['a'].includes(this.currLocation)) {
        res.push({
          icon: 'heart',
          action: () => { console.log('toggleAllFavorite') }
        })
      }
      if (['a'].includes(this.currLocation)) {
        res.push({
          icon: 'folder',
          action: () => { console.log('moveAllToFolder') }
        })
      }
      if (['a'].includes(this.currLocation)) {
        res.push({
          icon: 'trash',
          action: () => { console.log('moveAllToTrash') }
        })
      }
      return res
    },
    isPrevButtonNeeded(): boolean {
      return PREV_BUTTON_MENUS.includes(this.bottomMenu)
    }
  },
  methods: {
    ...mapMutations('design', {
      setSortByField: 'SET_sortByField',
      setSortByDescending: 'SET_sortByDescending',
      clearBuffers: 'UPDATE_clearBuffers'
    }),
    checkSortSelected(payload: [string, boolean]): boolean {
      return this.sortByField === payload[0] && this.sortByDescending === payload[1]
    },
    handleCloseMenu() {
      if (this.isAnySelected) {
        this.$emit('clear')
      } else if (this.isNameEditing) {
        this.handleNameEditEnd()
      } else {
        this.$emit('close')
      }
    },
    handleSortByClick(payload: [string, boolean]) {
      this.setSortByField(payload[0])
      this.setSortByDescending(payload[1])
      this.$emit('refresh')
    },
    handleDesignMenuAction(icon: string) {
      // if (this.useDelete && icon === 'trash') icon = 'delete'
      designUtils.dispatchDesignMenuAction(icon, this.designBuffer, (extraEvent) => {
        if (extraEvent) {
          this.$emit('menuAction', extraEvent)
        }
        this.$emit('close')
      })
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        this.handleNameEditEnd()
      }
    },
    handleNameClick() {
      this.editableName = this.designBuffer.name
      this.isNameEditing = true
      setTimeout(() => {
        const nameInput = this.$refs.name as HTMLInputElement
        nameInput.focus()
      }, 500)
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.editableName === '' || this.editableName === this.designBuffer.name) return
      designUtils.setDesignName(this.designBuffer, this.editableName)
      this.editableName = ''
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
    justify-content: start;
    gap: 8px;
    margin-left: 22.5px;
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
    gap: 16px;
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
}

.sort-menu {
  padding-top: 44px;
}

.design-menu {
  padding-top: 24px;
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
    gap: 64px;
  }
  &__action {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
