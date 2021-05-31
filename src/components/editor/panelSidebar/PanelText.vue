<template lang="pug">
  div(class="panel-text")
    div(class="panel-text__title mb-15")
      span(class="text-blue-1 label-lg") Text
    div(class="panel-text__buttons")
      btn(class="full-width mb-10" :type="'text-heading'" @click="addText('heading')") Heading
      btn(class="full-width mb-10" :type="'text-subheading'" @click="addText('subheading')") Subheading
      btn(class="full-width" :type="'text-body'" @click="addText('body')") Body
    tmp-text
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import LayerFactary from '@/utils/layerFactary'
import LayerUtils from '@/utils/layerUtils'
import CssConverter from '@/utils/cssConverter'
import GeneralUtils from '@/utils/generalUtils'
import { mapGetters } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      headingFormat: {
        text: 'New Text',
        styles: {
          font: 'Lobster',
          weight: 'bold',
          align: 'text-align',
          color: '#000000',
          writingMode: 'initial',
          decoration: 'none',
          style: 'normal',
          size: 50
        }
      },
      subheadingFormat: {
        text: 'New Text',
        styles: {
          font: 'Lobster',
          weight: 'bold',
          align: 'text-align',
          color: '#000000',
          writingMode: 'initial',
          decoration: 'none',
          style: 'normal',
          size: 18
        }
      },
      bodyFormat: {
        text: 'New Text',
        styles: {
          font: 'Lobster',
          weight: 'normal',
          align: 'text-align',
          color: '#000000',
          writingMode: 'initial',
          decoration: 'none',
          style: 'normal',
          size: 14
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getPage: 'getPage'
    })
  },
  methods: {
    addText(type: string) {
      const newTextLayer = LayerFactary.newText(this.generateFormat(type))
      LayerUtils.addLayers(this.lastSelectedPageIndex, newTextLayer)
    },
    generateFormat(type: string) {
      const pageStyles = this.getPage(this.lastSelectedPageIndex)
      switch (type) {
        case 'heading': {
          const format = GeneralUtils.deepCopy(this.headingFormat)
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, this.getTextHW(format.text, format.styles))
          return format
        }
        case 'subheading': {
          const format = GeneralUtils.deepCopy(this.subheadingFormat)
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, this.getTextHW(format.text, format.styles))
          return format
        }
        case 'body': {
          const format = GeneralUtils.deepCopy(this.bodyFormat)
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, this.getTextHW(format.text, format.styles))
          return format
        }
      }
    },
    getTextHW(text: string, styles: any) {
      const el = document.createElement('span')
      el.textContent = text
      Object.assign(el.style, CssConverter.convertFontStyle(styles))
      document.body.appendChild(el)
      const textHW = {
        width: el.offsetWidth,
        height: el.offsetHeight
      }
      document.body.removeChild(el)
      return textHW
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text {
  @include size(100%, 100%);
  &__title {
    text-align: center;
  }
  &__buttons {
    display: flex;
    flex-direction: column;
  }
}
</style>
