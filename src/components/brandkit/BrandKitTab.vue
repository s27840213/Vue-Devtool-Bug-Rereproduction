<template lang="pug">
  div(class="brand-kit-tab" :class="{sidebar: theme === 'editor'}")
    div(class="brand-kit-tab__header"
      :class="theme === 'editor' ? 'editor-theme' : 'brandkit-theme'")
      div(v-for="tab in tabs" class="brand-kit-tab__tab-block pointer"
        :class="[{selected: checkSelected(tab)}, theme === 'editor' ? 'editor-theme' : 'brandkit-theme']"
        @click="handleSelectTab(tab)")
        div(class="brand-kit-tab__tab-name"
          :class="theme === 'editor' ? 'editor-theme' : 'brandkit-theme'")
          span(class="brand-kit-tab__tab-name-text") {{ $t(tabNames[tab]) }}
    div(v-if="notNullBrand" class="brand-kit-tab__content" :class="{sidebar: theme === 'editor'}")
      component(:is="`brand-kit-tab-${selectedTab}${theme === 'editor' ? '-sidebar' : ''}`" @deleteItem="handleDeleteItem")
    div(v-else class="brand-kit-tab__content brand-kit-tab__disconnect")
      template(v-if="theme === 'editor'")
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
import { mapGetters, mapMutations } from 'vuex'
import { IDeletingItem } from '@/interfaces/brandkit'

export default Vue.extend({
  props: {
    theme: {
      type: String,
      default: 'brandkit'
    }
  },
  components: {
    BrandKitTabLogo,
    BrandKitTabText,
    BrandKitTabColor,
    BrandKitTabLogoSidebar,
    BrandKitTabTextSidebar,
    BrandKitTabColorSidebar
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

<style lang="scss" scoped src="@/assets/scss/base/formatStyle.scss">
.brand-kit-tab {
  &.sidebar {
    height: 100%;
  }
  &__header {
    display: flex;
    gap: 20px;
    height: 54px;
    &.editor-theme {
      justify-content: center;
    }
  }
  &__tab-block {
    border-radius: 4px;
    height: fit-content;
    &:hover {
      background-color: setColor(blue-4);
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
  }
  &__tab-name {
    margin: 10px;
    margin-bottom: 0px;
    padding-bottom: 10px;
    color: setColor(gray-3);
    &-text {
      @include text-H5;
      transition: 0.3s ease;
    }
  }
  &__content {
    margin-top: 30px;
    &.sidebar {
      height: calc(100% - 150px);
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
