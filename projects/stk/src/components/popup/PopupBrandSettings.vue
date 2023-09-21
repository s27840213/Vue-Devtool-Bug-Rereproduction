<template lang="pug">
div(class="popup-brand-settings")
  div(class="dim-background under")
  div(class="popup-brand-settings__window"
      v-click-outside="vcoConfig()")
    div(class="popup-brand-settings__wrapper relative")
      div(class="brand-kit relative"
        @dragover.prevent.stop="handleDragEnter"
        @dragenter.prevent.stop="handleDragEnter"
        @dragleave.prevent.stop="handleDragLeave"
        @drop.prevent.stop="handleDrop")
        div(v-if="isBrandsLoading" class="brand-kit__main")
          svg-icon(iconName="loading"
                  iconWidth="50px"
                  iconColor="gray-3")
        div(v-else class="brand-kit__main")
          div(class="brand-kit__header")
            div(class="brand-kit__selector")
              brand-selector(@deleteItem="handleDeleteItem")
            brand-kit-add-btn(:text="`${$t('NN0396')}`"
                          @click="addNewBrand")
          div(class="brand-kit__tab")
            brand-kit-tab(@deleteItem="handleDeleteItem")
        drag-hover(v-if="isDraggedOver" :text="dragHoverText")
        div(v-if="isMessageShowing" class="dim-background")
          div(class="delete-confirm" v-click-outside="handleClearDeletion")
            div(class="delete-confirm__title")
              span {{ $t('NN0433') }}
            div(class="delete-confirm__description")
              i18n-t(keypath="NN0434" tag="span")
                template(#itemName)
                  span(class="delete-confirm__item-name") {{ deleteBuffer ? getDisplayedName(deleteBuffer) : '' }}
            div(class="delete-confirm__description")
              span {{ $t('NN0435') }}
            div(v-if="deleteBuffer && deleteBuffer.type === 'palette'" class="delete-confirm__description")
              span {{ $t('NN0436') }}
            div(v-else class="delete-confirm__description")
              span {{ $t('NN0459') }}
            div(class="delete-confirm__buttons")
              nubtn(theme="secondary" @click="handleClearDeletion") {{$t('NN0203')}}
              nubtn(theme="danger" @click="handleConfirmDeletion")  {{$t('NN0200')}}
</template>

<script lang="ts">
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import DragHover from '@/components/image-gallery/DragHover.vue'
import i18n from '@/i18n'
import { IBrand, IBrandColorPalette, IBrandFont, IBrandLogo, IDeletingItem } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import uploadUtils from '@/utils/uploadUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'PopupBrandSettings',
  components: {
    BrandSelector,
    BrandKitTab,
    BrandKitAddBtn,
    DragHover,
  },
  mounted() {
    // brandkitUtils.fetchBrands(this.fetchBrands)
    brandkitUtils.fetchFonts(this.fetchFonts)
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      isDraggedOver: false,
      isMessageShowing: false,
      deleteBuffer: undefined as IDeletingItem | undefined,
      uploadHint: {
        logo: {
          hintText: i18n.global.t('NN0413'),
          elementType: i18n.global.t('NN0416'),
          fileTypes: ['jpg', 'png'].join('、'),
        },
        text: {
          hintText: i18n.global.t('NN0415'),
          elementType: i18n.global.t('NN0417'),
          fileTypes: ['otf', 'otc', 'ttf', 'ttc'].join('、'),
        }
      }
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrandId: 'getCurrentBrandId',
      isBrandsLoading: 'getIsBrandsLoading',
      selectedTab: 'getSelectedTab',
      brands: 'getBrands'
    }),
    dragHoverText() {
      return this.uploadHint[this.selectedTab as 'logo' | 'text'] ??
        { hintText: '', elementType: '', fileTypes: '' }
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchBrands: 'fetchBrands',
      fetchFonts: 'fetchFonts'
    }),
    ...mapMutations('brandkit', {
      setIsSettingsOpen: 'SET_isSettingsOpen'
    }),
    vcoConfig() {
      return {
        middleware: (e: MouseEvent) => {
          return (e.target as HTMLElement | null)?.id !== 'upload'
        },
        handler: this.handleCloseSettings
      }
    },
    addNewBrand() {
      brandkitUtils.addNewBrand()
    },
    isDragDropValid(): boolean {
      return Object.keys(this.uploadHint).includes(this.selectedTab)
    },
    getDisplayedName(item: IDeletingItem): string {
      return brandkitUtils.getDisplayedName(item.type, item.content)
    },
    handleDragEnter() {
      if (!this.isDragDropValid()) return
      this.isDraggedOver = true
    },
    handleDragLeave() {
      this.isDraggedOver = false
    },
    handleDrop(e: DragEvent) {
      this.isDraggedOver = false
      if (!this.isDragDropValid()) return
      const files = e.dataTransfer?.files
      if (this.selectedTab === 'text') {
        if (!files) return
        uploadUtils.uploadAsset('font', files)
      } else if (this.selectedTab === 'logo') {
        if (!files) return
        uploadUtils.uploadAsset('logo', files, { brandId: this.currentBrandId })
      } else {
        console.log(files)
      }
    },
    handleDeleteItem(item: IDeletingItem) {
      this.deleteBuffer = item
      this.isMessageShowing = true
    },
    handleClearDeletion() {
      this.deleteBuffer = undefined
      this.isMessageShowing = false
    },
    handleConfirmDeletion() {
      if (!this.deleteBuffer) return
      switch (this.deleteBuffer.type) {
        case 'logo':
          brandkitUtils.removeLogo(this.deleteBuffer.content as IBrandLogo)
          break
        case 'palette':
          brandkitUtils.removePalette(this.deleteBuffer.content as IBrandColorPalette)
          break
        case 'brand':
          brandkitUtils.removeBrand(this.deleteBuffer.content as IBrand)
          break
        case 'font':
          brandkitUtils.removeFont(this.deleteBuffer.content as IBrandFont)
          break
      }
      this.handleClearDeletion()
    },
    handleCloseSettings() {
      this.setIsSettingsOpen(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-brand-settings {
  &__window {
    // @include size(900px, 800px);
    width: 80vw;
    max-width: 900px;
    height: 90%;
    max-height: 800px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    background-color: white;
  }
  &__wrapper {
    @include size(100%, 100%);
  }
}
.brand-kit {
  @include size(100%, 100%);
  @include hover-scrollbar();
  &__main {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    box-sizing: border-box;
    height: 100%;
    padding: 30px 24px 0 24px;
  }
  &__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__tab {
    margin: 28px 0 0 0;
  }
}

.dim-background {
  @include size(100%, 100%);
  position: fixed;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.3);
  transform-style: preserve-3d;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 45px;
  &.under {
    z-index: 99;
  }
}

.delete-confirm {
  background: #ffffff;
  box-shadow: 0px 0px 12px rgba(151, 150, 150, 0.4);
  border-radius: 6px;
  padding: 20px;
  &__title {
    @include text-H6;
    color: setColor(gray-2);
    margin-bottom: 20px;
  }
  &__description {
    @include body-SM;
    color: setColor(gray-2);
    text-align: left;
  }
  &__item-name {
    @include overline-LG;
    color: setColor(gray-2);
  }
  &__buttons {
    margin-top: 20px;
    display: flex;
    gap: 40px;
    align-items: center;
    justify-content: center;
  }
}
</style>
