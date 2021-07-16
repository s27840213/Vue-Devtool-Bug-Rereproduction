<template lang="pug">
  div(class="text-setting" @mousedown="textRangeRecorder($event)")
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{ textFont }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar
        input(class="body-2 text-gray-2" type="text" @keyup="setSize($event)" @blur="onBlur"
        v-model="fontSize")
        div(class="text-setting__font-stepper")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(2)"
            :iconName="'chevron-up'" :iconColor="'gray-2'" :iconWidth="'9px'")
          svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-2)"
            :iconName="'chevron-down'" :iconColor="'gray-2'" :iconWidth="'14px'")
        //- svg-icon(class="pointer"
        //-   :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color-picker")
        div(class="color-slip"
          :style="{'background-color': textColor}")
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2" v-model="textColor" @keyup="setColor($event)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
        //- :style="propsBtnStyles(icon)"
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    div(class="text-setting__row5")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="lineHeight" @keyup="setHeight($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="fontSpacing" @keyup="setSpacing($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'")
      property-bar
        input(class="body-2 text-gray-2" type="number" v-model="opacity" @keyup="setOpacity($event)" @blur="onBlur")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'
import { values } from 'lodash'
import color from '@/store/module/color'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      fontPreset: [
        'sans-serif',
        'Manrop',
        'Lobster'
      ],
      selection: {
        start: {
          sIndex: NaN,
          pIndex: NaN,
          offset: NaN
        },
        end: {
          sIndex: NaN,
          pIndex: NaN,
          offset: NaN
        }
      },
      fontSize: '',
      textFont: '',
      lineHeight: '',
      fontSpacing: '',
      textColor: '#000000'
    }
  },
  mounted() {
    this.$root.$on('updateTextPanel', () => {
      // console.log('update text panel')
      const sel = TextUtils.getSelection()
      if (sel) {
        const size = TextUtils.propReader('fontSize')
        this.fontSize = typeof size === 'number' ? size.toString() : '--'

        const space = TextUtils.propReader('fontSpacing')
        this.fontSpacing = typeof space === 'number' ? ((space as number) * 100).toString() : '--'

        const height = TextUtils.propReader('lineHeight')
        this.lineHeight = typeof height === 'number' ? height.toString() : '--'

        const font = TextUtils.propReader('fontFamily')
        this.textFont = typeof font === 'string' ? font : 'multi-fonts'

        const btns = ['bold', 'italic', 'underline']
        for (const icon of btns) {
          this.propsBtnStyles(icon)
        }

        this.textColor = typeof TextUtils.propReader('color') === 'string' ? TextUtils.propReader('color') as string : '--'
      }
    })
  },
  beforeDestroy () {
    this.$root.$off('updateTextPanel')
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
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
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.opacity
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.lastSelectedPageIndex,
          layerIndex: this.currSelectedIndex,
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
    propsBtnStyles(iconName: string) {
      this.$nextTick(() => {
        const res = TextUtils.propReader(iconName)
        const origin = { 'background-color': '', 'border-radius': '' }
        const hitStyle = { 'background-color': '#c2d6ff', 'border-radius': '2.5px' }
        switch (iconName) {
          case 'bold':
            if (res === 'bold') Object.assign(origin, hitStyle)
            break
          case 'underline':
            if (res === 'underline') Object.assign(origin, hitStyle)
            break
          case 'italic':
            if (res === 'italic') Object.assign(origin, hitStyle)
            break
          case 'font-vertical':
            if (typeof res === 'string' && res.includes('verticl')) Object.assign(origin, hitStyle)
        }
        const icon = document.getElementById(`icon-${iconName}`) as HTMLElement
        Object.assign(icon.style, origin)
      })
    },
    onPropertyClick(iconName: string) {
      TextUtils.onPropertyClick(iconName)
      this.propsBtnStyles(iconName)
    },
    fontSizeStepping(step: number) {
      const sel = TextUtils.getSelection()
      if (sel) {
        const start = {
          pIndex: sel.start.pIndex,
          sIndex: sel.start.sIndex
        }
        const config = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex) as IText
        const fontSize = config.paragraphs[start.pIndex].spans[start.sIndex].styles.size
        TextUtils.spanPropertyHandler('fontSize', fontSize + step)
        this.fontSize = `${fontSize + step}`
      }
    },
    isValidInt(value: string) {
      return value.match(/^-?\d+$/) && parseInt(value) > 0
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/) && parseFloat(value) > 0
    },
    isValidHexColor(value: string) {
      return value.match(/^#[0-9A-F]{6}$/)
    },
    textRangeRecorder(e: MouseEvent) {
      if (e && (e.target as HTMLElement).nodeName === 'INPUT') {
        const sel = TextUtils.getSelection()
        if (sel) {
          Object.assign(this.selection.start, sel.start)
          Object.assign(this.selection.end, sel.end)
        }
      }
    },
    setSize(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidInt(this.fontSize)) {
        TextUtils.spanPropertyHandler('fontSize', parseInt(this.fontSize), this.selection.start, this.selection.end)
      }
    },
    setSpacing(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidInt(this.fontSpacing)) {
        TextUtils.paragraphPropsHandler('fontSpacing', parseInt(this.fontSpacing) / 100, this.selection.start, this.selection.end)
      }
    },
    setHeight(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidFloat(this.lineHeight)) {
        TextUtils.paragraphPropsHandler('lineHeight', parseFloat(this.lineHeight), this.selection.start, this.selection.end)
      }
    },
    setColor(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.isValidHexColor(this.textColor)) {
        TextUtils.spanPropertyHandler('color', this.textColor, this.selection.start, this.selection.end)
      }
    },
    onBlur() {
      const nan = {
        pIndex: NaN,
        sIndex: NaN,
        offset: NaN
      }
      Object.assign(this.selection.start, nan)
      Object.assign(this.selection.end, nan)
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
  }
  &__row5 {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
  &__color-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
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
