<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
    search-bar(:placeholder="'Search font'")
    div(v-for="font in fontPreset"
        class="panel-fonts__font pointer"
        :style="{'font-family': font.face}"
        @click="setFont(font.face)")
      span {{font.name}}
    div
      svg-icon(class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
    btn(class="full-width" :type="'primary-mid'" @click.native="FileUtils.importFont(updateFontPreset)") Upload Font
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import LayerUtils from '@/utils/layerUtils'
import FileUtils from '@/utils/fileUtils'
import TextUtils from '@/utils/textUtils'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      FileUtils,
      fontPreset: [
        {
          name: 'sans-serif',
          face: 'sans-serif'
        },
        {
          name: 'Manrop',
          face: 'Manrop'
        },
        {
          name: 'Lobster',
          face: 'Lobster'
        },
        {
          name: '思源黑體',
          face: 'Noto Sans TC'
        },
        {
          name: '標楷體',
          face: 'cwTeXKai'
        },
        {
          name: '獅尾四季春',
          face: 'SweiSpringCJKtc-Regular'
        },
        {
          name: '裝甲明朝',
          face: 'SoukouMincho'
        },
        {
          name: '瀨戶字體',
          face: 'SetoFont'
        },
        {
          name: '思源柔體',
          face: 'GenJyuuGothicX-P-Regular'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    layerFont(): string {
      return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).styles.font
    }
  },
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    closeFontsPanel() {
      this.$emit('closeFontsPanel')
    },
    setFont(font: string) {
      TextUtils.onPropertyClick('fontFamily', font)
      this.$emit('closeFontsPanel')
      this.$nextTick(() => this.$root.$emit('updateTextPanel'))
    },
    updateFontPreset(e: any) {
      const target = e.target.files[0]
      const fontName: string = target.name.split('.')[0]
      const objectUrl = window.URL.createObjectURL(target)
      const style = document.createElement('style')
      style.innerHTML = `
      @font-face {
        font-family: ${fontName};
        src: url(${objectUrl});
      }
    `
      document.head.appendChild(style)
      // console.log(fontName)
      this.fontPreset.push({ name: fontName, face: fontName })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-fonts {
  text-align: left;
  position: relative;
  &__title {
    text-align: center;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__font {
    font-size: 18px;
  }
  &__close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
}
</style>
