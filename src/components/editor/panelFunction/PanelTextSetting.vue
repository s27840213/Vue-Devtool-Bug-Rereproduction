<template lang="pug">
  div(class="text-setting" @mousedown="textRangeRecorder($event)" ref='body')
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{ props.font }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        input(class="body-2 text-gray-2" type="text" @keyup="setSize($event)" @blur="onBlur"
        v-model.lazy="props.fontSize")
        div(class="text-setting__font-stepper")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(2)"
            :iconName="'chevron-up'" :iconColor="'gray-2'" :iconWidth="'9px'")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-2)"
            :iconName="'chevron-down'" :iconColor="'gray-2'" :iconWidth="'14px'")
        //- svg-icon(class="pointer"
        //-   :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color")
        div(class="color-slip"
          :style="{'background-color': props.color}"
          @click="handleColorModal")
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2" v-model.lazy="props.color" @keyup="setColor($event)")
      color-picker(v-if="openColorPicker"
        class="text-setting__color-picker"
        v-click-outside="handleColorModal"
        :currentColor="props.color"
        @update="handleColorUpdate")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    div(class="text-setting__row5")
      property-bar
        input(class="body-2 text-gray-2" type="text" v-model.lazy="props.lineHeight" @keyup="setHeight($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" type="text" v-model.lazy="props.fontSpacing" @keyup="setSpacing($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'")
      //- property-bar
      //-   input(class="body-2 text-gray-2" type="number" v-model="props.opacity" @keyup="setOpacity($event)" @blur="onBlur")
      //-   svg-icon(class="pointer"
      //-     :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import { values } from 'lodash'
import { ISelection } from '@/interfaces/text'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      fontPreset: [
        'sans-serif',
        'Manrop',
        'Lobster'
      ],
      openColorPicker: false
    }
  },
  mounted() {
    TextUtils.updateTextPropsState()
    this.$forceUpdate()
  },
  destroyed() {
    this.$store.commit('text/SET_default')
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      pageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      layerIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    // textFont: {
    //   cache: false,
    //   get(): string {
    //     console.log('text font')
    //     const font = TextUtils.propReader('fontFamily')
    //     return typeof font === 'string' ? font : 'multi-fonts'
    //   }
    // },
    // textColor: {
    //   get(): string {
    //     return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.color
    //   },
    //   set(value) {
    //     this.$store.commit('UPDATE_layerStyles', {
    //       pageIndex: this.lastSelectedPageIndex,
    //       layerIndex: this.currSelectedIndex,
    //       styles: {
    //         color: value
    //       }
    //     })
    //   }
    // },
    // lineHeight: {
    //   get(): number {
    //     const value = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.lineHeight
    //     return value === -1 ? -1 : value * 1000
    //   },
    //   set(value) {
    //     this.$store.commit('UPDATE_layerStyles', {
    //       pageIndex: this.lastSelectedPageIndex,
    //       layerIndex: this.currSelectedIndex,
    //       styles: {
    //         lineHeight: typeof value === 'string' ? parseInt(value) / 1000 : value
    //       }
    //     })
    //     TextUtils.updateLayerSize()
    //   }
    // },
    // fontSpacing: {
    //   get(): number {
    //     return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.fontSpacing * 1000
    //   },
    //   set(value) {
    //     this.$store.commit('UPDATE_layerStyles', {
    //       pageIndex: this.lastSelectedPageIndex,
    //       layerIndex: this.currSelectedIndex,
    //       styles: {
    //         fontSpacing: typeof value === 'string' ? parseInt(value) / 1000 : value
    //       }
    //     })
    //     TextUtils.updateLayerSize()
    //   }
    // },
    opacity: {
      get(): number {
        return this.getLayer(this.pageIndex, this.layerIndex).styles.opacity
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.pageIndex,
          layerIndex: this.layerIndex,
          styles: {
            opacity: value
          }
        })
      }
    }
  },
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    openFontsPanel() {
      this.$emit('openFontsPanel')
    },
    handleColorModal() {
      console.log(this.sel)
      this.openColorPicker = !this.openColorPicker
      if (!this.openColorPicker) {
        const sel = {
          pIndex: NaN,
          sIndex: NaN,
          offset: NaN
        }
        TextUtils.updateSelection(sel, sel)
      }
    },
    handleColorUpdate (color: string) {
      console.log(this.sel)
      TextUtils.spanPropertyHandler('color', color, this.sel.start, this.sel.end)
      TextUtils.updateTextPropsState()
    },
    propsBtnStyles(iconName: string) {
      const origin = { 'background-color': '', 'border-radius': '' }
      const hitStyle = { 'background-color': '#c2d6ff', 'border-radius': '2.5px' }
      switch (iconName) {
        case 'bold':
          if (this.props.isBold) return hitStyle
          break
        case 'underline':
          if (this.props.isUnderline) return hitStyle
          break
        case 'italic':
          if (this.props.isItalic) return hitStyle
          break
        case 'font-vertical':
          if (this.props.isVertical) return hitStyle
          break
        case 'text-align-left':
          if (this.props.textAlign === 'left') return hitStyle
          break
        case 'text-align-center':
          if (this.props.textAlign === 'center') return hitStyle
          break
        case 'text-align-right':
          if (this.props.textAlign === 'right') return hitStyle
      }
      return origin
    },
    onPropertyClick(iconName: string) {
      TextUtils.onPropertyClick(iconName)
      TextUtils.updateTextPropsState()
    },
    fontSizeStepping(step: number) {
      const sel = TextUtils.getSelection()
      if (sel) {
        const start = {
          pIndex: sel.start.pIndex,
          sIndex: sel.start.sIndex
        }
        const config = this.getLayer(this.pageIndex, this.layerIndex) as IText
        const fontSize = config.paragraphs[start.pIndex].spans[start.sIndex].styles.size
        TextUtils.spanPropertyHandler('fontSize', fontSize + step)
        TextUtils.updateTextPropsState()
      }
    },
    isValidInt(value: string) {
      return value.match(/^-?\d+$/) && parseInt(value) >= 0
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/) && parseFloat(value) >= 0
    },
    isValidHexColor(value: string) {
      return value.match(/^#[0-9A-F]{6}$/)
    },
    textRangeRecorder(e: MouseEvent) {
      const sel = TextUtils.getSelection()
      if ((e.target as HTMLElement).nodeName === 'INPUT' && sel) {
        TextUtils.updateSelection(sel.start, sel.end)
      } else if ((e.target as HTMLElement) === this.$refs.body as HTMLElement) {
        const nan = {
          pIndex: NaN,
          sIndex: NaN,
          offset: NaN
        }
        TextUtils.updateSelection(nan, nan)
      }
    },
    setSize(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidInt(this.props.fontSize)) {
        TextUtils.spanPropertyHandler('fontSize', parseInt(this.props.fontSize), this.sel.start, this.sel.end)
      }
    },
    setSpacing(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidInt(this.props.fontSpacing)) {
        TextUtils.paragraphPropsHandler('fontSpacing', parseInt(this.props.fontSpacing) / 100, this.sel.start, this.sel.end)
      }
    },
    setHeight(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidFloat(this.props.lineHeight)) {
        TextUtils.paragraphPropsHandler('lineHeight', parseFloat(this.props.lineHeight), this.sel.start, this.sel.end)
      }
    },
    setColor(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidHexColor(this.props.color)) {
        TextUtils.spanPropertyHandler('color', this.props.color, this.sel.start, this.sel.end)
      }
    },
    onBlur() {
      const nan = {
        pIndex: NaN,
        sIndex: NaN,
        offset: NaN
      }
      this.$store.commit('text/UPDATE_selection', {
        start: nan,
        end: nan
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  text-align: left;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 2fr 3fr;
    column-gap: 20px;
    position: relative;
  }
  &__row5 {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__color {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
  }
  &__color-picker {
    position: absolute;
    right: 0px;
    top: 0px;
  }
  &__font-stepper {
    display: flex;
    flex-direction: column;
  }
}
.color-slip {
  height: 100%;
  width: 40%;
}
</style>
