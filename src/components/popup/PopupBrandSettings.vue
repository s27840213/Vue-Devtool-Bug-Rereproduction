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
        div(v-if="isOverlayed" class="dim-background"
          :style="isDraggedOver ? { pointerEvents: 'none' } : {}")
          template(v-if="isDraggedOver")
            div(class="upload-large")
              svg-icon(iconName="cloud-upload" iconWidth="78px" iconColor="white")
              span {{ $t(hintText) }}
            div(class="upload-small")
                span {{ `・${$t('NN0414', { element: $t(elementType) })}： ${fileTypesString}` }}
          div(v-if="isMessageShowing" class="delete-confirm"
              v-click-outside="handleClearDeletion")
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
              div(class="delete-confirm__buttons__cancel pointer"
                @click="handleClearDeletion")
                span {{ $t('NN0203') }}
              div(class="delete-confirm__buttons__confirm pointer"
                @click="handleConfirmDeletion")
                span {{ $t('NN0437') }}
</template>

<script lang="ts">
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
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
    BrandKitAddBtn
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
          text: 'NN0413',
          fileTypes: ['jpg', 'png'],
          elementTypeText: 'NN0416'
        },
        text: {
          text: 'NN0415',
          fileTypes: ['otf', 'otc', 'ttf', 'ttc'],
          elementTypeText: 'NN0417'
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
    hintText(): string {
      return this.uploadHint[this.selectedTab as 'logo' | 'text']?.text ?? ''
    },
    fileTypesString(): string {
      return (this.uploadHint[this.selectedTab as 'logo' | 'text']?.fileTypes ?? []).join('、')
    },
    elementType(): string {
      return this.uploadHint[this.selectedTab as 'logo' | 'text']?.elementTypeText ?? ''
    },
    isOverlayed(): boolean {
      return this.isDraggedOver || this.isMessageShowing
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
    padding-top: 30px;
    padding-left: 24px;
    padding-right: 24px;
  }
  &__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__tab {
    margin: 28px 0px;
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

.upload-large {
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  & > span {
    font-style: normal;
    font-weight: bold;
    font-size: 40px;
    line-height: 40px;
    color: white;
  }
}

.upload-small {
  & > span {
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    line-height: 28px;
    color: white;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
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
    &__cancel {
      background: setColor(gray-4);
      border-radius: 5px;
      padding: 4px 23px;
      & > span {
        @include btn-SM;
        color: setColor(gray-2);
      }
    }
    &__confirm {
      background: #ec5858;
      border-radius: 5px;
      padding: 4px 23px;
      & > span {
        @include btn-SM;
        color: setColor(gray-7);
      }
    }
  }
}
</style>
