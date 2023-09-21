<template lang="pug">
div(class="brand-kit relative"
  @dragover.prevent.stop="handleDragEnter"
  @dragenter.prevent.stop="handleDragEnter"
  @dragleave.prevent.stop="handleDragLeave"
  @drop.prevent.stop="handleDrop")
  nu-header(v-header-border)
  section(class="brand-kit__scroll")
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
    nu-footer
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
        i18n-t(keypath="NN0459" tag="span")
          template(#itemName)
            span(class="delete-confirm__item-name") {{ deleteBuffer ? getDisplayedName(deleteBuffer) : '' }}
      div(class="delete-confirm__buttons")
        nubtn(theme="secondary" @click="handleClearDeletion") {{$t('NN0203')}}
        nubtn(theme="danger" @click="handleConfirmDeletion")  {{$t('NN0437')}}
</template>

<script lang="ts">
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import NuFooter from '@/components/NuFooter.vue'
import NuHeader from '@/components/NuHeader.vue'
import { IBrand, IBrandColorPalette, IBrandFont, IBrandLogo, IDeletingItem } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import uploadUtils from '@/utils/uploadUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'BrandKit',
  components: {
    NuHeader,
    NuFooter,
    BrandSelector,
    BrandKitTab,
    BrandKitAddBtn
  },
  mounted() {
    brandkitUtils.fetchBrands(this.fetchBrands)
    brandkitUtils.fetchFonts(this.fetchFonts)
  },
  metaInfo() {
    return {
      title: `${this.$t('SE0001')}`,
      meta: [{
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'og:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'og:title'
      }, {
        property: 'og:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'og:image'
      }, {
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'twitter:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'twitter:title'
      }, {
        property: 'twitter:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'twitter:image'
      }, {
        property: 'twitter:description',
        content: `${this.$t('OG0002')}`,
        vmid: 'twitter:description'
      }, {
        property: 'og:url',
        content: `${this.$t('OG0005')}`,
        vmid: 'og:url'
      }]
    }
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
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit {
  @include size(100%, 100%);
  &__scroll {
    @include hover-scrollbar();
    box-sizing: border-box;
    width: 100%;
    height: calc(100vh - #{$header-height});
  }
  &__main {
    min-height: calc(100vh - #{$header-height});
    padding-top: 100px;
    padding-left: 148px;
    padding-right: 148px;
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
  position: absolute;
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
  }
}
</style>
