<template lang="pug">
  div(class="brand-kit-tab-text")
    div(class="brand-kit-tab-text__font-column")
      div(class="brand-kit-tab-text__font-column__item add pointer")
        div(class="brand-kit-tab-text__font-column__upload-icon")
          svg-icon(iconName="cloud-upload" iconWidth="32px" iconColor="gray-1")
        div(class="brand-kit-tab-text__font-column__upload-hint" @click="handleUploadFont")
          span {{ $t('NN0402') }}
      div(v-for="font in fonts" class="brand-kit-tab-text__font-column__item pointer relative")
        template(v-if="checkUploading(font)")
          div(class="brand-kit-tab-text__font-column__font-img loading")
            svg-icon(iconName="loading" iconWidth="24px" iconColor="gray-3")
          div(class="brand-kit-tab-text__font-column__font-img loading")
            svg-icon(iconName="loading" iconWidth="24px" iconColor="gray-3")
        template(v-else)
          div(class="brand-kit-tab-text__font-column__font-img")
            img(:src="font.namePrevUrl" @error="onError(font)")
          div(class="brand-kit-tab-text__font-column__font-img")
            img(:src="font.textPrevUrl")
          svg-icon(class="brand-kit-tab-text__font-column__trash-icon"
                  iconName="trash" iconWidth="24px" iconColor="gray-2"
                  @click.native="handleDeleteFont(font)")
      div(v-if="isFontsLoading" class="brand-kit-tab-text__font-column__loading")
        svg-icon(iconName="loading"
                  iconWidth="50px"
                  iconColor="gray-3")
      observer-sentinel(v-if="!isFontsLoading && fontsPageIndex >= 0"
                      @callback="handleLoadMore")
    div(class="brand-kit-tab-text__style-column")
      brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                            type="heading" :textStyleSetting="textStyleSetting")
      brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                            type="subheading" :textStyleSetting="textStyleSetting")
      brand-kit-text-setting(class="brand-kit-tab-text__style-column__item"
                            type="body" :textStyleSetting="textStyleSetting")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
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

export default Vue.extend({
  data() {
    return {
      fonts: [] as IUrledFont[]
    }
  },
  created() {
    textUtils.loadDefaultFonts()
  },
  mounted() {
    this.refreshFontUrls()
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
      isAdmin: 'isAdmin',
      teamId: 'getTeamId'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    }
  },
  watch: {
    rawFonts() {
      this.refreshFontUrls()
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
      grid-template-columns: 150px auto;
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
</style>
