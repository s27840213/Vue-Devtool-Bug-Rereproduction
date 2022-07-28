<template lang="pug">
  div(class="brand-kit-tab" :class="`${theme}-theme`")
    div(class="brand-kit-tab__header"
      :class="`${theme}-theme`")
      div(v-for="tab in tabs" class="brand-kit-tab__tab-block pointer"
        :class="[{selected: checkSelected(tab)}, `${theme}-theme`]"
        @click="handleSelectTab(tab)")
        div(class="brand-kit-tab__tab-name"
          :class="`${theme}-theme`")
          span(class="brand-kit-tab__tab-name-text"
            :class="`${theme}-theme`") {{ $t(tabNames[tab]) }}
    div(v-if="notNullBrand" class="brand-kit-tab__content" :class="`${theme}-theme`")
      component(:is="`brand-kit-tab-${selectedTab}${isThemeEditorLike ? '-sidebar' : ''}${isThemeMobile ? '-mobile' : ''}`"
                :maxheight="maxheight"
                @deleteItem="handleDeleteItem")
    div(v-else class="brand-kit-tab__content brand-kit-tab__disconnect")
      template(v-if="isThemeEditorLike")
        div
          img(class="brand-kit-tab__disconnect__sidebar-image" :src="require('@/assets/img/png/brandkit/disconnect.png')")
        span(class="brand-kit-tab__disconnect__sidebar-title") {{$t('NN0456')}}
        span(class="brand-kit-tab__disconnect__sidebar-description1") {{$t('NN0457')}}
        span(class="brand-kit-tab__disconnect__sidebar-description2") {{$t('NN0458')}}
      template(v-else)
        div
          img(:src="require('@/assets/img/png/brandkit/disconnect.png')")
        span(class="brand-kit-tab__disconnect__title") {{$t('NN0456')}}
        span(class="brand-kit-tab__disconnect__description1") {{$t('NN0457')}}
        span(class="brand-kit-tab__disconnect__description2") {{$t('NN0458')}}
</template>

<script lang="ts">
import Vue from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitTabLogo from '@/components/brandkit/tabs/BrandKitTabLogo.vue'
import BrandKitTabText from '@/components/brandkit/tabs/BrandKitTabText.vue'
import BrandKitTabColor from '@/components/brandkit/tabs/BrandKitTabColor.vue'
import BrandKitTabLogoSidebar from '@/components/brandkit/tabs/BrandKitTabLogoSidebar.vue'
import BrandKitTabTextSidebar from '@/components/brandkit/tabs/BrandKitTabTextSidebar.vue'
import BrandKitTabColorSidebar from '@/components/brandkit/tabs/BrandKitTabColorSidebar.vue'
import BrandKitTabLogoMobile from '@/components/brandkit/mobile-tabs/BrandKitTabLogo.vue'
import BrandKitTabTextMobile from '@/components/brandkit/mobile-tabs/BrandKitTabText.vue'
import BrandKitTabColorMobile from '@/components/brandkit/mobile-tabs/BrandKitTabColor.vue'
import BrandKitTabLogoSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabLogoSidebar.vue'
import BrandKitTabTextSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabTextSidebar.vue'
import BrandKitTabColorSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabColorSidebar.vue'
import { mapGetters, mapMutations } from 'vuex'
import { IDeletingItem } from '@/interfaces/brandkit'

export default Vue.extend({
  props: {
    theme: {
      type: String,
      default: 'brandkit'
    },
    maxheight: {
      default: window.innerHeight * 0.9,
      type: Number
    }
  },
  components: {
    BrandKitTabLogo,
    BrandKitTabText,
    BrandKitTabColor,
    BrandKitTabLogoSidebar,
    BrandKitTabTextSidebar,
    BrandKitTabColorSidebar,
    BrandKitTabLogoMobile,
    BrandKitTabTextMobile,
    BrandKitTabColorMobile,
    BrandKitTabLogoSidebarMobile,
    BrandKitTabTextSidebarMobile,
    BrandKitTabColorSidebarMobile
  },
  data() {
    const tabs = brandkitUtils.getTabKeys()
    return {
      tabs,
      tabNames: brandkitUtils.getTabNames(this.theme)
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      selectedTab: 'getSelectedTab'
    }),
    notNullBrand(): boolean {
      return !brandkitUtils.checkIsNullBrand(this.currentBrand)
    },
    isThemeEditorLike(): boolean {
      return this.theme.includes('editor')
    },
    isThemeMobile(): boolean {
      return this.theme.includes('mobile')
    }
  },
  methods: {
    ...mapMutations('brandkit', {
      setSelectedTab: 'SET_selectedTab'
    }),
    checkSelected(tabKey: string) {
      return this.selectedTab === tabKey
    },
    handleSelectTab(tabKey: string) {
      this.setSelectedTab(tabKey)
    },
    handleDeleteItem(item: IDeletingItem) {
      this.$emit('deleteItem', item)
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab {
  &.editor-theme {
    height: 100%;
  }
  &.mobile-editor-theme {
    @include size(100%, 100%);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }
  &__header {
    display: flex;
    gap: 20px;
    height: 54px;
    &.editor-theme {
      justify-content: center;
    }
    &.mobile-editor-theme {
      height: 40px;
      justify-content: space-evenly;
    }
  }
  &__tab-block {
    border-radius: 4px;
    height: fit-content;
    &:not(.mobile-editor-theme):hover {
      background-color: setColor(blue-4);
    }
    &.mobile-editor-theme {
      width: 80px;
    }
    &.brandkit-theme:not(:hover).selected {
      .brand-kit-tab__tab-name {
        border-bottom: 6px solid setColor(bu);
        & > span {
          color: setColor(bu);
        }
      }
    }
    &.editor-theme:not(:hover).selected {
      .brand-kit-tab__tab-name {
        color: white;
        border-bottom: 6px solid setColor(blue-1);
      }
    }
    &.mobile-editor-theme.selected {
      .brand-kit-tab__tab-name {
        color: white;
        border-bottom: 2px solid white;
      }
    }
  }
  &__tab-name {
    margin: 10px;
    margin-bottom: 0px;
    padding-bottom: 10px;
    color: setColor(gray-3);
    &.mobile-editor-theme {
      margin: 0;
      margin-top: 7px;
      padding: 7px;
      padding-top: 0px;
    }
    &-text {
      @include text-H5;
      transition: 0.3s ease;
      &.mobile-editor-theme {
        @include text-H6;
      }
    }
  }
  &__content {
    margin-top: 30px;
    &.editor-theme {
      height: calc(100% - 150px);
    }
    &.mobile-editor-theme {
      margin-top: 24px;
      overflow-y: auto;
      @include no-scrollbar;
    }
  }
  &__disconnect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    &__title {
      margin-top: 69px;
      @include text-H1;
      color: setColor(blue-1);
    }
    &__description1 {
      margin-top: 13px;
      @include body-XL;
      color: setColor(gray-1);
    }
    &__description2 {
      margin-top: 14px;
      @include text-H5;
      color: setColor(gray-2);
    }
    &__sidebar-image {
      transform: scale(0.7);
    }
    &__sidebar-title {
      margin-top: 69px;
      @include text-H2;
      color: setColor(blue-1);
    }
    &__sidebar-description1 {
      margin-top: 23px;
      @include body-XL;
      color: setColor(gray-4);
    }
    &__sidebar-description2 {
      margin-top: 24px;
      @include text-H5;
      color: setColor(gray-5);
    }
  }
}
</style>
