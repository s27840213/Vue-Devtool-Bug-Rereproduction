<template lang="pug">
  div(class="brand-kit-text-setting relative")
    div(class="brand-kit-text-setting__inner pointer"
        :class="type"
        @click="handleToggleConfig")
      span(:style="getFontStyles()") {{ getDisplayedText() }}
    div(v-if="isConfigOpen" class="brand-kit-text-setting__config"
        v-click-outside="() => { isConfigOpen = false }")
</template>

<script lang="ts">
import Vue from 'vue'
import defaultHeading from '@/assets/json/heading.json'
import defaultSubheading from '@/assets/json/subheading.json'
import defaultBody from '@/assets/json/body.json'
import { IBrandTextStyle } from '@/interfaces/brandkit'
import vClickOutside from 'v-click-outside'
import brandkitUtils from '@/utils/brandkitUtils'

export default Vue.extend({
  props: {
    type: String,
    textStyleSetting: Object
  },
  directives: {
    clickOutside: vClickOutside.directive
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
      } as {[key: string]: { textType: string, default: any }},
      isConfigOpen: false
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
    },
    handleToggleConfig() {
      if (!this.isConfigOpen) this.isConfigOpen = true
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-text-setting {
  &__inner {
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
  &__config {
    position: absolute;
    top: 100%;
    left: 0;
    width: 300px;
    height: 186px;
    background-color: white;
    z-index: 2;
    box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
    border-radius: 5px;
  }
}
</style>
