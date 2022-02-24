<template lang="pug">
  div(class="brand-kit-text-setting"
      :class="type")
    span(:style="getFontStyles()") {{ getDisplayedText() }}
</template>

<script lang="ts">
import Vue from 'vue'
import defaultHeading from '@/assets/json/heading.json'
import defaultSubheading from '@/assets/json/subheading.json'
import defaultBody from '@/assets/json/body.json'
import { IBrandTextStyle } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'

export default Vue.extend({
  props: {
    type: String,
    textStyleSetting: Object
  },
  data() {
    return {
      MAPPING: {
        heading: {
          textType: `${this.$t('NN0408')}`,
          default: defaultHeading
        },
        subheading: {
          textType: `${this.$t('NN0409')}`,
          default: defaultSubheading
        },
        body: {
          textType: `${this.$t('NN0410')}`,
          default: defaultBody
        }
      } as {[key: string]: { textType: string, default: any }}
    }
  },
  computed: {
    textStyle(): IBrandTextStyle {
      return this.textStyleSetting[this.type + 'Style']
    }
  },
  methods: {
    getDisplayedText(): string {
      const textType = this.MAPPING[this.type]?.textType ?? ''
      return this.textStyle.isDefault ? `${this.$t('NN0403', { textType })}` : brandkitUtils.composeSettingText(this.textStyle, textType)
    },
    getFontStyles() {
      if (this.textStyle.isDefault) {
        return {
          fontFamily: this.MAPPING[this.type].default.paragraphs[0].spans[0].styles.font
        }
      } else {
        return {
          fontFamily: this.textStyle.font.id
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-text-setting {
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
</style>
