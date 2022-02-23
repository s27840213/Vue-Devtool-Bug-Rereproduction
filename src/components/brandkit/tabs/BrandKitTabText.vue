<template lang="pug">
  div(class="brand-kit-tab-text")
    div(class="brand-kit-tab-text__font-column")
      div(class="brand-kit-tab-text__font-column__item add")
        div(class="brand-kit-tab-text__font-column__upload-icon")
          svg-icon(iconName="cloud-upload" iconWidth="32px" iconColor="gray-1")
        div(class="brand-kit-tab-text__font-column__upload-hint pointer")
          span {{ $t('NN0402') }}
      //- div(class="brand-kit-tab-text__font-column__item")
    div(class="brand-kit-tab-text__style-column")
      div(class="brand-kit-tab-text__style-column__item heading")
        span(:style="getHeadingFont()") {{ getDisplayedHeadingText() }}
      div(class="brand-kit-tab-text__style-column__item subheading")
        span(:style="getSubheadingFont()") {{ getDisplayedSubheadingText() }}
      div(class="brand-kit-tab-text__style-column__item body")
        span(:style="getBodyFont()") {{ getDisplayedBodyText() }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import defaultHeading from '@/assets/json/heading.json'
import defaultSubheading from '@/assets/json/subheading.json'
import defaultBody from '@/assets/json/body.json'
import { IBrand, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import textUtils from '@/utils/textUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  created() {
    textUtils.loadDefaultFonts()
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    }
  },
  methods: {
    getDisplayedHeadingText(): string {
      const textType = `${this.$t('NN0408')}`
      return this.textStyleSetting.headingStyle.isDefault ? `${this.$t('NN0403', { textType })}` : brandkitUtils.composeSettingText(this.textStyleSetting.headingStyle, textType)
    },
    getDisplayedSubheadingText(): string {
      const textType = `${this.$t('NN0409')}`
      return this.textStyleSetting.subheadingStyle.isDefault ? `${this.$t('NN0403', { textType })}` : brandkitUtils.composeSettingText(this.textStyleSetting.subheadingStyle, textType)
    },
    getDisplayedBodyText(): string {
      const textType = `${this.$t('NN0410')}`
      return this.textStyleSetting.bodyStyle.isDefault ? `${this.$t('NN0403', { textType })}` : brandkitUtils.composeSettingText(this.textStyleSetting.bodyStyle, textType)
    },
    getHeadingFont() {
      if (this.textStyleSetting.headingStyle.isDefault) {
        return {
          fontFamily: defaultHeading.paragraphs[0].spans[0].styles.font
        }
      } else {
        return {
          fontFamily: this.textStyleSetting.headingStyle.font.id
        }
      }
    },
    getSubheadingFont() {
      if (this.textStyleSetting.subheadingStyle.isDefault) {
        return {
          fontFamily: defaultSubheading.paragraphs[0].spans[0].styles.font
        }
      } else {
        return {
          fontFamily: this.textStyleSetting.subheadingStyle.font.id
        }
      }
    },
    getBodyFont() {
      if (this.textStyleSetting.bodyStyle.isDefault) {
        return {
          fontFamily: defaultBody.paragraphs[0].spans[0].styles.font
        }
      } else {
        return {
          fontFamily: this.textStyleSetting.bodyStyle.font.id
        }
      }
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
      &.add {
        height: fit-content;
        padding: 11px 33px;
        display: flex;
        gap: 19px;
        align-items: center;
      }
    }
  }
  &__style-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    &__item {
      width: 680px;
      background: #F3F6FA;
      border-radius: 4px;
      padding: 8px 0px;
      & > span {
        font-style: normal;
        font-weight: normal;
      }
      &.heading > span {
        font-size: 28px;
      }
      &.subheading > span {
        font-size: 18px;
      }
      &.body > span {
        font-size: 14px;
      }
    }
  }
}
</style>
