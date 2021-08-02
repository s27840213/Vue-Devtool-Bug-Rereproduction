<template lang="pug">
  div(class="text-setting" @mousedown="textRangeRecorder($event)" ref='body')
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer record-selection" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{ props.font }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar(class="relative")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-2)"
          :iconName="'minus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        button(@click="handleValueModal")
          input(class="body-2 text-gray-2 center" type="text" @keyup="setSize($event)" @blur="onBlur"
            v-model.lazy="props.fontSize")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(2)"
          :iconName="'plus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        value-selector(v-if="openValueSelector"
                    class="text-setting__value-selector record-selection"
                    v-click-outside="handleValueModal"
                    :value="props.fontSize"
                    @update="handleValueUpdate")
        //- div(class="text-setting__font-stepper")
        //- svg-icon(class="pointer"
        //-   :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color")
        div(class="color-slip"
          :style="{'background-color': isValidHexColor(props.color) ? props.color : '#000000'}"
          @click="handleColorModal")
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2 record-selection" v-model.lazy="props.color" @keyup="setColor($event)")
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
        input(class="body-2 text-gray-2 record-selection" type="text" v-model.lazy="props.lineHeight" @keyup="setHeight($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'25px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2 record-selection" type="text" v-model.lazy="props.fontSpacing" @keyup="setSpacing($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'25px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2 record-selection" type="number" v-model="props.opacity" @keyup="setOpacity($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'25px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { ILayer, IText } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import GeneralUtils from '@/utils/generalUtils'
import { ISelection } from '@/interfaces/text'
import { values } from 'lodash'
import { Group } from 'konva/types/Group'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    ValueSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      openValueSelector: false
    }
  },
  mounted() {
    // if (!TextUtils.getCurrLayer.layers) {
    // this.$store.commit('text/SET_default')
    TextUtils.updateTextPropsState()
    // }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      pageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
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
      if (this.currSelectedInfo.layers.length === 1) {
        TextUtils.spanPropertyHandler('color', color, this.sel.start, this.sel.end)
      } else {
        const nan = {
          pIndex: NaN,
          sIndex: NaN,
          offset: NaN
        }
        for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
          const layer = this.currSelectedInfo.layers[i]
          if (layer.type === 'text') {
            TextUtils.spanPropertyHandler('color', color, nan, nan, i)
          }
        }
      }
      TextUtils.updateTextPropsState({ color })
    },
    handleValueModal() {
      this.openValueSelector = !this.openValueSelector
    },
    handleValueUpdate(value: number) {
      console.log(this.sel.start)
      console.log(this.sel.end)
      TextUtils.spanPropertyHandler('fontSize', value, this.sel.start, this.sel.end)
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
      if ((e.target as HTMLElement).classList.contains('record-selection') && sel) {
        TextUtils.updateSelection(sel.start, sel.end)
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
    setOpacity(e: KeyboardEvent) {
      console.log(this.currSelectedInfo)
      if (e.key === 'Enter' && (this.props.opacity >= 0 && this.props.opacity <= 100)) {
        if (!this.isGroup) {
          if (this.currSelectedInfo.layers.length === 1) {
            this.$store.commit('UPDATE_layerStyles', {
              pageIndex: this.pageIndex,
              layerIndex: this.currSelectedIndex,
              styles: {
                opacity: this.props.opacity
              }
            })
          } else {
            this.$store.commit('UPDATE_selectedLayersStyles', {
              styles: {
                opacity: this.props.opacity
              }
            })
          }
        } else {
          this.$store.commit('UPDATE_groupLayerStyles', {
            styles: {
              opacity: this.props.opacity
            }
          })
        }
      }
    },
    onBlur() {
      if (!this.openValueSelector) {
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
    grid-template-columns: repeat(3, 1fr);
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
  &__value-selector {
    position: absolute;
    transform: translate(45%);
    top: 75%;
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

.center {
  text-align: center;
  margin: auto;
}

.relative {
  position: relative;
}

</style>
