<template lang="pug">
div(class="panel-brand relative")
  div(v-if="isBrandsLoading" class="panel-brand__main")
    svg-icon(iconName="loading"
            iconWidth="20px"
            iconColor="white")
  div(v-else class="panel-brand__main")
    div(class="panel-brand__header relative")
      brand-selector(theme="mobile-editor")
      div(class="panel-brand__settings pointer"
        @click.stop="handleToggleSettings")
        svg-icon(:iconName="isInSettingMode ? 'confirm-circle' : 'settings'"
                  iconColor="white"
                  iconWidth="24px")
    div(class="panel-brand__tab")
      brand-kit-tab(theme="mobile-editor" :maxheight="maxheight - 180" :settingmode="isInSettingMode")
  div(v-if="isMobileConfirmOpen" class="dim-background")
    div(class="panel-brand__confirm"
        v-click-outside="handleClearDeletion")
      div(class="panel-brand__confirm__close"
          @click.stop="handleClearDeletion")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="20px")
      div(class="panel-brand__confirm__title") 確認刪除圖片？
      div(class="panel-brand__confirm__descriptions")
        div 您已選擇刪除圖片
        div {{ `${ mobileDeleteBuffer.content.name }` }}
        div 刪除後將無法復原。
      div(class="panel-brand__confirm__buttons")
          div(class="panel-brand__confirm__cancel" @click.stop="handleClearDeletion")
            span {{$t('NN0203')}}
          div(class="panel-brand__confirm__confirm" @click.stop="confirmAction")
            span {{$tc('NN0164', 1)}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import vClickOutside from 'v-click-outside'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import { mapGetters, mapMutations } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrandLogo } from '@/interfaces/brandkit'

export default defineComponent({
  components: {
    BrandSelector,
    BrandKitTab
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      isInSettingMode: false
    }
  },
  props: {
    maxheight: {
      default: window.innerHeight * 0.9,
      type: Number
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      isBrandsLoading: 'getIsBrandsLoading',
      isMobileConfirmOpen: 'getIsMobileConfirmOpen',
      mobileDeleteBuffer: 'getMobileDeleteBuffer'
    })
  },
  methods: {
    ...mapMutations('brandkit', {
      setIsMobileConfirmOpen: 'SET_isMobileConfirmOpen',
      setMobileDeleteBuffer: 'SET_mobileDeleteBuffer'
    }),
    handleToggleSettings() {
      this.isInSettingMode = !this.isInSettingMode
    },
    handleClearDeletion() {
      this.setIsMobileConfirmOpen(false)
      this.setMobileDeleteBuffer(undefined)
    },
    confirmAction() {
      switch (this.mobileDeleteBuffer.type) {
        case 'logo':
          brandkitUtils.removeLogo(this.mobileDeleteBuffer.content as IBrandLogo)
          break
      }
      this.handleClearDeletion()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-brand {
  @include size(100%, 100%);
  overflow: hidden;
  &__header {
    margin-top: 12px;
    width: 100%;
  }
  &__main {
    @include size(100%, 100%);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
    gap: 15px;
  }
  &__settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 1px;
    transform: translateY(-50%);
  }
  &__tab {
    @include size(100%, 100%);
  }
  &__settings-popup {
    position: absolute;
    left: calc(100% + 20px);
    top: 0;
    width: 900px;
    height: 800px;
    background-color: white;
  }
  &__confirm {
    @include size(312px, 224px);
    background: white;
    position: fixed;
    top: 50%;
    left: 50%;
    padding: 16px;
    box-sizing: border-box;
    transform: translate(-50%, -50%);
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    &__close {
      position: absolute;
      top: 16px;
      right: 14px;
      background: setColor(gray-4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__title {
      @include text-H6;
      color: setColor(gray-2);
    }
    &__descriptions {
      @include body-SM;
      color: setColor(gray-2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      width: 204px;
    }
    &__buttons {
      width: calc(100% - 24px);
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      & > div {
        width: 100%;
        height: 32px;
        border-radius: 5px;
        font-weight: 700;
        font-size: 14px;
        line-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        & > span {
          display: block;
        }
      }
    }
    &__cancel {
      background: setColor(gray-5);
      color: setColor(gray-2);
    }
    &__confirm {
      background: setColor(blue-1);
      color: setColor(gray-7);
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
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}
</style>
