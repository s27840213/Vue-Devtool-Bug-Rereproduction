<template lang="pug">
  div(class="bottom-menu")
    div(class="bottom-menu__wrapper relative")
      div(v-if="isPrevButtonNeeded" class="bottom-menu__prev pointer")
        svg-icon(iconName="chevron-left" iconColor="gray-3" iconWidth="20px")
      div(class="bottom-menu__close pointer"
          @click="handleCloseMenu")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
      div(v-if="bottomMenu === 'trash-info'" class="trash-info") {{$t('NN0241')}}
      div(v-if="bottomMenu === 'sort-menu'" class="sort-menu")
        div(v-for="sortMenuItem in sortMenuItems"
            class="sort-menu__item pointer"
            :class="{selected: checkSortSelected(sortMenuItem.payload)}"
            @click="handleSortByClick(sortMenuItem.payload)")
          div(class="sort-menu__item-icon")
            svg-icon(:iconName="sortMenuItem.icon"
                    iconWidth="24px"
                    iconColor="gray-2"
                    :style="sortMenuItem.style")
          div(class="sort-menu__item-text")
            span {{ sortMenuItem.text }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapActions, mapMutations } from 'vuex'

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
      ]
    }
  },
  props: {
    bottomMenu: String
  },
  watch: {
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders',
      sortByField: 'getSortByField',
      sortByDescending: 'getSortByDescending',
      isDesignsLoading: 'getIsDesignsLoading',
      isFoldersLoading: 'getIsFoldersLoading',
      itemCount: 'getItemCount'
    }),
    isPrevButtonNeeded(): boolean {
      return PREV_BUTTON_MENUS.includes(this.bottomMenu)
    }
  },
  methods: {
    ...mapMutations('design', {
      setSortByField: 'SET_sortByField',
      setSortByDescending: 'SET_sortByDescending'
    }),
    checkSortSelected(payload: [string, boolean]): boolean {
      return this.sortByField === payload[0] && this.sortByDescending === payload[1]
    },
    handleCloseMenu() {
      this.$emit('close')
    },
    handleSortByClick(payload: [string, boolean]) {
      this.setSortByField(payload[0])
      this.setSortByDescending(payload[1])
      this.$emit('refresh')
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

.sort-menu {
  padding-top: 44px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  &__item {
    height: 40px;
    display: flex;
    align-items: center;
    gap: 16px;
    &.selected {
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
</style>
