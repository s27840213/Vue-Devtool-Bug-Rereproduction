<template lang="pug">
div(class="brand-kit-tab-text" :style="minHeightStyles()")
  div(class="brand-kit-tab-text__styles")
    div(v-for="type in Object.keys(MAPPING)"
      class="brand-kit-tab-text__setting pointer"
      @click="handleAddText(type)")
      span(class="brand-kit-tab-text__title" :class="type" :style="getFontStyles(type)") {{ MAPPING[type] }}
      br
      span(class="brand-kit-tab-text__description") {{ `${getFontFamilyName(type)} / ${getFontSize(type)}px` }}
      span(style="display: none") {{ MAPPING[type] }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandTextStyle, IBrandTextStyleSetting } from '@/interfaces/brandkit'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import assetUtils from '@/utils/assetUtils'

export default defineComponent({
  emits: [],
  data() {
    return {
      MAPPING: {
        heading: `${this.$t('NN0408')}`,
        subheading: `${this.$t('NN0409')}`,
        body: `${this.$t('NN0410')}`
      } as { [key: string]: string }
    }
  },
  props: {
    maxheight: {
      default: window.outerHeight * 0.9,
      type: Number
    },
    settingmode: {
      default: false,
      type: Boolean
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
    minHeightStyles() {
      return { minHeight: `${this.maxheight}px` }
    },
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
    },
    getSpanStyles(type: string): { [key: string]: string | number } {
      let styles = {} as { [key: string]: string | number }
      const textStyle = this.getTextStyle(type)
      styles = {
        weight: textStyle.bold ? 'bold' : 'normal',
        style: textStyle.italic ? 'italic' : 'normal',
        decoration: textStyle.underline ? 'underline' : 'none',
        size: textStyle.size
      }
      if (!textStyle.isDefault) {
        Object.assign(styles, {
          font: textStyle.fontId,
          type: textStyle.fontType ?? 'public',
          userId: textStyle.fontUserId ?? '',
          assetId: textStyle.fontAssetId ?? ''
        })
      }
      return styles
    },
    handleAddText(type: string) {
      assetUtils.addStandardText(type, this.MAPPING[type], this.$i18n.locale, undefined, undefined, this.getSpanStyles(type))
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-text {
  &__styles {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  &__setting {
    text-align: left;
    padding: 0px 16px;
    background: setColor(nav);
    border-radius: 3px;
  }
  &__title {
    font-style: normal;
    --base-stroke: 0px;
    color: white;
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
