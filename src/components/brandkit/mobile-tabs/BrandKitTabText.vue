<template lang="pug">
div(class="brand-kit-tab-text")
  transition-group(class="brand-kit-tab-text__font-column" name="font-list" tag="div")
    template(v-for="font in renderedFonts")
      div(v-if="font === 'add'"
        class="brand-kit-tab-text__font-column__item add pointer"
        key="add")
        div(class="brand-kit-tab-text__font-column__upload-icon")
          svg-icon(iconName="cloud-upload" iconWidth="32px" iconColor="gray-1")
        div(class="brand-kit-tab-text__font-column__upload-hint" @click="handleUploadFont")
          span {{ $t('NN0402') }}
      div(v-else-if="font === 'loading'"
        class="brand-kit-tab-text__font-column__loading no-trans"
        key="loading")
        svg-icon(iconName="loading"
                  iconWidth="50px"
                  iconColor="gray-3")
      observer-sentinel(v-else-if="font === 'sentinel'"
                      class="no-trans"
                      key="sentinel"
                      @callback="handleLoadMore")
      template(v-else)
        div(v-if="checkUploading(font)"
          class="brand-kit-tab-text__font-column__item-uploading")
          div(class="brand-kit-tab-text__font-column__item-uploading-imgs")
            div(class="brand-kit-tab-text__font-column__font-img loading")
              svg-icon(iconName="loading" iconWidth="34px" iconColor="gray-3")
            div(class="brand-kit-tab-text__font-column__font-img loading")
              svg-icon(iconName="loading" iconWidth="34px" iconColor="gray-3")
          div(class="brand-kit-tab-text__font-column__item-uploading-text")
            span {{ $t('NN0503') }}
        div(v-else
          class="brand-kit-tab-text__font-column__item pointer relative")
          div(class="brand-kit-tab-text__font-column__font-img")
            img(:src="font.namePrevUrl" @error="onError(font)")
          div(class="brand-kit-tab-text__font-column__font-img")
            img(:src="font.textPrevUrl")
          svg-icon(class="brand-kit-tab-text__font-column__trash-icon"
                  iconName="trash" iconWidth="24px" iconColor="gray-2"
                  @click="handleDeleteFont(font)")
  div(class="brand-kit-tab-text__style-column")
    brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                          type="heading" :textStyleSetting="textStyleSetting")
    brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                          type="subheading" :textStyleSetting="textStyleSetting")
    brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                          type="body" :textStyleSetting="textStyleSetting")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import { notify } from '@kyvg/vue3-notification'
import BrandKitTextSetting from '@/components/brandkit/BrandKitTextSetting.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandFont, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import textUtils from '@/utils/textUtils'
import uploadUtils from '@/utils/uploadUtils'

interface IUrledFont extends IBrandFont {
  namePrevUrl?: string,
  textPrevUrl?: string
}

export default defineComponent({
  emits: ['deleteItem'],
  data() {
    return {
      fonts: [] as IUrledFont[]
    }
  },
  created() {
    textUtils.loadDefaultFonts(brandkitUtils.extractFonts(this.textStyleSetting))
  },
  mounted() {
    this.refreshFontUrls()
    uploadUtils.onFontUploadStatus((status) => {
      if (status === 'success') {
        notify({
          group: 'copy',
          text: `${this.$t('NN0135')}`
        })
      }
      if (status === 'fail') { // Fail will not goto here
        notify({
          group: 'error',
          text: `${this.$t('NN0137')}`
        })
      }
    })
  },
  unmounted() {
    uploadUtils.offFontUploadStatus()
  },
  components: {
    BrandKitTextSetting,
    ObserverSentinel
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      rawFonts: 'getFonts',
      isFontsLoading: 'getIsFontsLoading',
      fontsPageIndex: 'getFontsPageIndex'
    }),
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    },
    renderedFonts(): (IUrledFont | 'add' | 'loading' | 'sentinel')[] {
      const res = ['add', ...this.fonts] as (IUrledFont | 'add' | 'loading' | 'sentinel')[]
      if (this.isFontsLoading) {
        res.push('loading')
      } else if (this.fontsPageIndex >= 0) {
        res.push('sentinel')
      }
      return res
    }
  },
  watch: {
    rawFonts() {
      this.refreshFontUrls()
    },
    currentBrand() {
      textUtils.loadDefaultFonts(brandkitUtils.extractFonts(this.textStyleSetting))
    }
  },
  methods: {
    ...mapActions('brandkit', {
      fetchMoreFonts: 'fetchMoreFonts',
      refreshFontAsset: 'refreshFontAsset'
    }),
    handleUploadFont() {
      uploadUtils.chooseAssets('font')
    },
    handleDeleteFont(font: IBrandFont) {
      this.$emit('deleteItem', {
        type: 'font',
        content: font
      })
    },
    handleLoadMore() {
      brandkitUtils.fetchFonts(this.fetchMoreFonts, false)
    },
    checkUploading(font: IBrandFont) {
      return font.id.startsWith('new_')
    },
    refreshFontUrls() {
      this.fonts = this.rawFonts
      this.fonts = this.fonts.map(font => {
        if (this.isAdmin) {
          return {
            ...font,
            namePrevUrl: `https://template.vivipic.com/admin/${font.team_id}/asset/font/${font.id}/prev-name`,
            textPrevUrl: `https://template.vivipic.com/admin/${font.team_id}/asset/font/${font.id}/prev-sample`
          }
        } else {
          return {
            ...font,
            namePrevUrl: font.signed_url?.['prev-name'] ?? '',
            textPrevUrl: font.signed_url?.['prev-sample'] ?? ''
          }
        }
      })
    },
    onError(font: IBrandFont) {
      this.refreshFontAsset(font).then(this.refreshFontUrls)
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-text {
  display: flex;
  gap: 145px;
  min-width: 800px;
  &__font-column {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    &__upload-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__upload-hint {
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      color: setColor(gray-1);
    }
    &__item {
      width: 310px;
      height: 56px;
      border: 1px solid setColor(gray-3);
      box-sizing: border-box;
      border-radius: 4px;
      display: grid;
      grid-template-columns: 160px auto;
      align-items: center;
      padding: 10px;
      &:hover {
        background-color: setColor(blue-4);
        & > .brand-kit-tab-text__font-column__trash-icon {
          display: inline-block;
        }
      }
      &.add {
        height: fit-content;
        display: flex;
        padding: 11px 33px;
        gap: 19px;
      }
    }
    &__item-uploading {
      width: 310px;
      height: fit-content;
      display: flex;
      flex-direction: column;
      border: 1px solid setColor(gray-3);
      box-sizing: border-box;
      border-radius: 4px;
      align-items: center;
      justify-content: center;
      padding: 10px 0px;
      gap: 10px;
      &-imgs {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }
      &-text {
        @include body-XS;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 0px 10px;
        color: setColor(gray-2);
      }
    }
    &__loading {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 310px;
    }
    &__font-img {
      overflow: hidden;
      text-align: left;
      display: flex;
      align-items: center;
      & > img {
        height: 25px;
        object-fit: contain;
      }
      &.loading {
        justify-content: center;
      }
    }
    &__trash-icon {
      position: absolute;
      display: none;
      right: 10px;
    }
  }
  &__style-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-grow: 1;
    &__item {
      width: 100%;
    }
  }
}

.font-list {
  &-enter-active,
  &-leave-active,
  &-move {
    &:not(.no-trans) {
      transition: 0.3s ease;
    }
  }

  &-enter-from,
  &-leave-to {
    &:not(.no-trans) {
      transform: translateX(-30%);
      opacity: 0;
    }
  }
}
</style>
