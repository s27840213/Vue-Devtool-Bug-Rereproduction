<template lang="pug">
  div(class="brand-kit-tab-text")
    div(class="brand-kit-tab-text__setting")
      span(class="brand-kit-tab-text__title heading" :style="getFontStyles('heading')") {{ MAPPING['heading'] }}
      br
      span(class="brand-kit-tab-text__description") {{ `${getFontFamilyName('heading')} / ${getFontSize('heading')}px` }}
    div(class="brand-kit-tab-text__setting")
      span(class="brand-kit-tab-text__title subheading" :style="getFontStyles('subheading')") {{ MAPPING['subheading'] }}
      br
      span(class="brand-kit-tab-text__description") {{ `${getFontFamilyName('subheading')} / ${getFontSize('subheading')}px` }}
    div(class="brand-kit-tab-text__setting")
      span(class="brand-kit-tab-text__title body" :style="getFontStyles('body')") {{ MAPPING['body'] }}
      br
      span(class="brand-kit-tab-text__description") {{ `${getFontFamilyName('body')} / ${getFontSize('body')}px` }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandTextStyle, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
  data() {
    return {
      MAPPING: {
        heading: `${this.$t('NN0408')}`,
        subheading: `${this.$t('NN0409')}`,
        body: `${this.$t('NN0410')}`
      } as {[key: string]: string}
    }
  },
  created() {
    textUtils.loadDefaultFonts(brandkitUtils.extractFonts(this.textStyleSetting))
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    }
  },
  watch: {
    currentBrand() {
      textUtils.loadDefaultFonts(brandkitUtils.extractFonts(this.textStyleSetting))
    }
  },
  methods: {
    getTextStyle(type: string): IBrandTextStyle {
      return (this.textStyleSetting as any)[`${type}Style`]
    },
    getFontStyles(type: string): { [key: string]: string } {
      const textStyle = this.getTextStyle(type)
      const res = tiptapUtils.textStylesRaw({
        weight: textStyle.bold ? 'bold' : 'normal',
        style: textStyle.italic ? 'italic' : 'normal',
        decoration: textStyle.underline ? 'underline' : 'none',
        size: textStyle.size
      })
      delete res['font-size']
      res.fontFamily = textStyle.isDefault ? brandkitUtils.getDefaultFontId(this.$i18n.locale) : textStyle.fontId
      return res
    },
    getFontFamilyName(type: string): string {
      const textStyle = this.getTextStyle(type)
      return textStyle.isDefault ? brandkitUtils.getDefaultFontName(this.$i18n.locale) : textStyle.fontName
    },
    getFontSize(type: string): number {
      const textStyle = this.getTextStyle(type)
      return textStyle.size
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
  &__setting {
    text-align: left;
    padding: 0px 16px;
    background: setColor(gray-2);
    border-radius: 3px;
  }
  &__title {
    font-style: normal;
    --base-stroke: 0px;
    &.heading {
      font-weight: 800;
      line-height: 40px;
      font-size: 28px;
    }
    &.subheading {
      font-weight: 700;
      line-height: 28px;
      font-size: 18px;
    }
    &.body {
      font-weight: 400;
      line-height: 24px;
      font-size: 14px;
    }
  }
  &__description {
    @include body-XS;
    color: white;
  }
}
</style>
