<template lang="pug">
  div(class="brand-kit scrollbar-gray relative"
    @dragover.prevent.stop="handleDragEnter"
    @dragenter.prevent.stop="handleDragEnter"
    @dragleave.prevent.stop="handleDragLeave"
    @drop.prevent.stop="handleDrop")
    nu-header
    div(v-if="isBrandsLoading" class="brand-kit__main")
      svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
    div(v-else class="brand-kit__main")
      div(class="brand-kit__header")
        div(class="brand-kit__selector")
          brand-selector
        brand-kit-add-btn(:text="`${$t('NN0396')}`"
                          @click.native="addNewBrand")
      div(class="brand-kit__tab")
        brand-kit-tab
    nu-footer
    div(v-if="isDraggedOver" class="dim-background")
      div(class="upload-large")
        svg-icon(iconName="cloud-upload" iconWidth="78px" iconColor="white")
        span {{ $t(hintText) }}
      div(class="upload-small")
          span {{ `・${$t('NN0415', { element: $t(elementType) })}： ${fileTypesString}` }}
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { mapActions, mapGetters } from 'vuex'

export default Vue.extend({
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
  },
  data() {
    return {
      isDraggedOver: false,
      uploadHint: {
        logo: {
          text: 'NN0413',
          fileTypes: ['jpg', 'png'],
          elementTypeText: 'NN0416'
        },
        text: {
          text: 'NN0414',
          fileTypes: ['otf', 'otc', 'ttf', 'ttc'],
          elementTypeText: 'NN0417'
        }
      }
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      isBrandsLoading: 'getIsBrandsLoading',
      selectedTab: 'getSelectedTab'
    }),
    hintText(): string {
      return this.uploadHint[this.selectedTab as 'logo' | 'text']?.text ?? ''
    },
    fileTypesString(): string {
      return (this.uploadHint[this.selectedTab as 'logo' | 'text']?.fileTypes ?? []).join('、')
    },
    elementType(): string {
      return this.uploadHint[this.selectedTab as 'logo' | 'text']?.elementTypeText ?? ''
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchBrands: 'fetchBrands'
    }),
    addNewBrand() {
      brandkitUtils.addNewBrand()
    },
    isDragDropValid(): boolean {
      return Object.keys(this.uploadHint).includes(this.selectedTab)
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
      console.log(e.dataTransfer?.files)
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit {
  @include size(100%, 100%);
  overflow-y: auto;
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
    margin: 28px 0px;
  }
}

.dim-background {
  @include size(100%, 100%);
  position: absolute;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
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
</style>
