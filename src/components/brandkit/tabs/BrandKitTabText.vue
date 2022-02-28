<template lang="pug">
  div(class="brand-kit-tab-text")
    div(class="brand-kit-tab-text__font-column")
      div(class="brand-kit-tab-text__font-column__item add pointer")
        div(class="brand-kit-tab-text__font-column__upload-icon")
          svg-icon(iconName="cloud-upload" iconWidth="32px" iconColor="gray-1")
        div(class="brand-kit-tab-text__font-column__upload-hint" @click="handleUploadFont")
          span {{ $t('NN0402') }}
      div(v-for="font in fonts" class="brand-kit-tab-text__font-column__item pointer relative")
        div(class="brand-kit-tab-text__font-column__font-img")
          img(:src="font.namePrevUrl")
        div(class="brand-kit-tab-text__font-column__font-img")
          img(:src="font.textPrevUrl")
        svg-icon(class="brand-kit-tab-text__font-column__trash-icon"
                iconName="trash" iconWidth="24px" iconColor="gray-2"
                @click.native="handleDeleteFont(font)")
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
import { mapGetters } from 'vuex'
import BrandKitTextSetting from '@/components/brandkit/BrandKitTextSetting.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandFont, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import textUtils from '@/utils/textUtils'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  created() {
    textUtils.loadDefaultFonts()
  },
  components: {
    BrandKitTextSetting
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    },
    fonts(): IBrandFont[] {
      return (this.currentBrand as IBrand).fonts
    }
  },
  methods: {
    handleUploadFont() {
      uploadUtils.chooseAssets('font')
    },
    handleDeleteFont(font: IBrandFont) {
      this.$emit('deleteItem', {
        type: 'font',
        content: font
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-text {
  display: flex;
  justify-content: space-between;
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
      display: flex;
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
        padding: 11px 33px;
        gap: 19px;
      }
    }
    &__font-img {
      display: flex;
      align-items: center;
      justify-content: center;
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
    &__item {
      width: 680px;
    }
  }
}
</style>
