<template lang="pug">
  div(class="brand-kit-text-setting relative")
    div(class="brand-kit-text-setting__inner pointer"
        :class="type"
        @click="handleToggleConfig")
      span(:style="getFontStyles()") {{ getDisplayedText() }}
    div(v-if="isConfigOpen" class="brand-kit-text-setting__config"
        v-click-outside="() => { isConfigOpen = false }")
      span(class="brand-kit-text-setting__config__title") {{ $t('NN0062') }}
      div(class="brand-kit-text-setting__config__family-size")
        div(class="property-bar pointer" @click="openFontsPanel")
          img(:src="fontPrevUrl" @error="onError")
          svg-icon(class="pointer"
            :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
        div(class="brand-kit-text-setting__config__size size-bar relative")
          div(class="pointer"
            @mousedown="fontSizeStepping(-1)")
            svg-icon(iconName="minus-small" iconWidth="24px" iconColor="gray-2")
          button(class="brand-kit-text-setting__config__range-input-button" @click="handleValueModal")
            input(class="body-2 text-gray-2 center" type="text" ref="input-fontSize"
                  @change="setSize" :value="fontSizeBuffer")
          div(class="pointer"
            @mousedown="fontSizeStepping(1)")
            svg-icon(iconName="plus-small" iconWidth="24px" iconColor="gray-2")
          value-selector(v-if="isValueSelectorOpen"
                      :valueArray="fontSelectValue"
                      class="brand-kit-text-setting__config__value-selector"
                      v-click-outside="handleValueModal"
                      @update="handleValueUpdate")
      div(class="action-bar flex-evenly brand-kit-text-setting__config__style")
        svg-icon(v-for="(icon, index) in fontIcons"
          class="feature-button pointer"
          :class="{active: styleHit(icon)}"
          :id="`icon-${icon}`"
          v-hint="hintMap[icon]"
          :iconName="icon" iconWidth="24px" iconColor="gray-2" @mousedown.native="onPropertyClick(icon)")
      div(v-if="isFontsPanelOpen"
        class="brand-kit-text-setting__panel-fonts"
        v-click-outside="() => { isFontsPanelOpen = false }")
        panel-fonts(:noTitle="true" :textStyleType="type")
</template>

<script lang="ts">
import Vue from 'vue'
import ValueSelector from '@/components/ValueSelector.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import { IBrandTextStyle } from '@/interfaces/brandkit'
import { fontSelectValue } from '@/utils/textPropUtils'
import vClickOutside from 'v-click-outside'
import brandkitUtils from '@/utils/brandkitUtils'
import { mapActions } from 'vuex'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
  props: {
    type: String,
    textStyleSetting: Object
  },
  components: {
    ValueSelector,
    PanelFonts
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      MAPPING: {
        heading: `${this.$t('NN0408')}`,
        subheading: `${this.$t('NN0409')}`,
        body: `${this.$t('NN0410')}`
      } as { [key: string]: string },
      isConfigOpen: false,
      isFontsPanelOpen: false,
      isValueSelectorOpen: false,
      fontSizeBuffer: 0,
      fontSelectValue,
      fontIcons: ['bold', 'underline', 'italic'],
      hintMap: {
        bold: `${this.$t('NN0101')}`,
        underline: `${this.$t('NN0102')}`,
        italic: `${this.$t('NN0103')}`
      },
      fontPrevUrl: ''
    }
  },
  mounted() {
    this.getFontPrev()
  },
  computed: {
    textStyle(): IBrandTextStyle {
      return this.textStyleSetting[this.type + 'Style']
    },
    fontSize(): number {
      return this.textStyle.size
    }
  },
  watch: {
    'textStyle.fontId': function () {
      this.getFontPrev()
    }
  },
  methods: {
    ...mapActions('brandkit', {
      refreshFontAsset: 'refreshFontAsset'
    }),
    styleHit(iconName: string) {
      switch (iconName) {
        case 'bold':
          return this.textStyle.bold
        case 'underline':
          return this.textStyle.underline
        case 'italic':
          return this.textStyle.italic
      }
    },
    getDisplayedText(): string {
      const textType = this.MAPPING[this.type] ?? ''
      return this.textStyle.isDefault ? `${this.$t('NN0403', { textType })}` : brandkitUtils.composeSettingText(this.textStyle, textType)
    },
    getFontStyles() {
      const { textStyle } = this
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
    getFontPrev() {
      let url = ''
      if (this.textStyle.isDefault) {
        url = brandkitUtils.getFontPrevUrlByFontFamily(brandkitUtils.getDefaultFontId(this.$i18n.locale), 'public', '', '', 'prev-name')
      } else {
        url = brandkitUtils.getFontPrevUrlByFontFamily(this.textStyle.fontId, this.textStyle.fontType, this.textStyle.fontUserId, this.textStyle.fontAssetId, 'prev-name')
      }
      if (this.textStyle.fontType === 'private' && url === '') {
        this.refreshFont(this.textStyle.fontAssetId)
      }
      this.fontPrevUrl = url
    },
    refreshFont(assetId: string) {
      const assetIndex = parseInt(assetId)
      this.refreshFontAsset({
        id: assetId,
        asset_index: assetIndex
      }).then((urlMap) => {
        if (!urlMap['prev-name']) return
        this.fontPrevUrl = urlMap['prev-name']
      })
    },
    onError() {
      if (this.textStyle.fontType === 'private') {
        this.refreshFont(this.textStyle.fontAssetId)
      }
    },
    handleToggleConfig() {
      if (!this.isConfigOpen) {
        this.isConfigOpen = true
        this.refreshFontSizeBuffer()
      }
    },
    openFontsPanel() {
      this.isFontsPanelOpen = true
    },
    handleValueModal() {
      this.isValueSelectorOpen = !this.isValueSelectorOpen
      if (this.isValueSelectorOpen) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleValueUpdate(value: number) {
      this.fontSizeBuffer = value
      brandkitUtils.updateTextStyle(this.type, { size: value }).then(() => {
        this.refreshFontSizeBuffer()
      })
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/)
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        value = this.boundValue(parseFloat(value), 6, 800)
        this.fontSizeBuffer = parseInt(value)
        brandkitUtils.updateTextStyle(this.type, { size: parseInt(value) }).then(() => {
          this.refreshFontSizeBuffer()
        })
      }
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = setInterval(() => {
        if (new Date().getTime() - startTime > 500) {
          try {
            this.fontSizeBuffer += step
          } catch (error) {
            console.error(error)
            window.removeEventListener('mouseup', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        window.removeEventListener('mouseup', onmouseup)
        if (new Date().getTime() - startTime < 500) {
          this.fontSizeBuffer += step
        }
        brandkitUtils.updateTextStyle(this.type, { size: this.fontSizeBuffer }).then(() => {
          this.refreshFontSizeBuffer()
        })
        clearInterval(interval)
      }

      window.addEventListener('mouseup', onmouseup)
    },
    onPropertyClick(iconName: string) {
      switch (iconName) {
        case 'bold':
          brandkitUtils.updateTextStyle(this.type, { bold: !this.textStyle.bold })
          break
        case 'underline':
          brandkitUtils.updateTextStyle(this.type, { underline: !this.textStyle.underline })
          break
        case 'italic':
          brandkitUtils.updateTextStyle(this.type, { italic: !this.textStyle.italic })
          break
      }
    },
    refreshFontSizeBuffer() {
      this.fontSizeBuffer = this.fontSize
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-text-setting {
  &__inner {
    background: #f3f6fa;
    border-radius: 4px;
    padding: 8px 0px;
    --base-stroke: 0px;
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
    display: flex;
    flex-direction: column;
    padding: 20px;
    padding-top: 10px;
    box-sizing: border-box;
    &__title {
      @include text-H6;
      line-height: 22px;
      height: 22px;
      color: setColor(blue-1);
    }
    &__family-size {
      margin-top: 30px;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: auto 1fr;
      column-gap: 16px;
      box-sizing: border-box;
      position: relative;
      > div:nth-child(1) {
        > img {
          width: 92px;
        }
        width: 124px;
        box-sizing: border-box;
      }
      > div:nth-child(2) {
        box-sizing: border-box;
      }
    }
    &__size {
      & > div {
        padding: 10px 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
    }
    &__value-selector {
      position: absolute;
      z-index: 9;
      top: 100%;
      left: 50%;
      transform: translate(-50%);
    }
    &__range-input-button {
      width: fit-content;
      & > input {
        text-align: center;
      }
    }
    &__style {
      margin-top: 16px;
      padding: 10px 20px;
      background-color: setColor(gray-7);
      & > svg {
        border-radius: 2.5px;
      }
    }
  }
  &__panel-fonts {
    position: absolute;
    left: 0;
    top: 120px;
    height: 45vh;
    width: 280px;
    background-color: white;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    z-index: 2;
    padding: 10px;
  }
}
</style>
