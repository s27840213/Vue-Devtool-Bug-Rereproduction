<template lang="pug">
  div(class="panel-text")
    div(class="panel-text__title mb-15")
      span(class="text-blue-1 label-lg") Text
    div(class="panel-text__buttons")
      btn(class="full-width mb-10" :type="'text-heading'" @click.native="addText('heading')") Heading
      btn(class="full-width mb-10" :type="'text-subheading'" @click.native="addText('subheading')") Subheading
      btn(class="full-width" :type="'text-body'" @click.native="addText('body')") Body
    tmp-text
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import LayerFactary from '@/utils/layerFactary'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import TextUtils from '@/utils/textUtils'
import { mapGetters } from 'vuex'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      headingFormat: {
        styles: {
          writingMode: 'normal'
        },
        paragraphs: [
          {
            styles: {
              align: 'text-align',
              fontSpacing: 0,
              lineHeight: -1
            },
            spans: [
              {
                text: 'New Text',
                styles: {
                  font: 'Lobster',
                  weight: 'bold',
                  color: '#000000',
                  writingMode: 'initial',
                  decoration: 'none',
                  style: 'normal',
                  opacity: 1,
                  size: 50
                }
              }
            ]
          }
        ]
      },
      subheadingFormat: {
        styles: {
          writingMode: 'normal'
        },
        paragraphs: [
          {
            styles: {
              align: 'text-align',
              fontSpacing: 0,
              lineHeight: -1
            },
            spans: [
              {
                text: 'New Text',
                styles: {
                  font: 'Lobster',
                  weight: 'bold',
                  color: '#000000',
                  writingMode: 'initial',
                  decoration: 'none',
                  style: 'normal',
                  opacity: 1,
                  size: 18
                }
              }
            ]
          }
        ]
      },
      bodyFormat: {
        styles: {
          writingMode: 'normal'
        },
        paragraphs: [
          {
            styles: {
              align: 'text-align',
              fontSpacing: 0,
              lineHeight: -1
            },
            spans: [
              {
                text: 'New Text',
                styles: {
                  font: 'Lobster',
                  weight: 'bold',
                  color: '#000000',
                  writingMode: 'initial',
                  decoration: 'none',
                  style: 'normal',
                  opacity: 1,
                  size: 14
                }
              }
            ]
          }
        ]
      }
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
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
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, TextUtils.getTextHW(format))
          return format
        }
        case 'subheading': {
          const format = GeneralUtils.deepCopy(this.subheadingFormat)
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, TextUtils.getTextHW(format))
          return format
        }
        case 'body': {
          const format = GeneralUtils.deepCopy(this.bodyFormat)
          Object.assign(format.styles, { x: pageStyles.width / 2, y: pageStyles.height / 2 }, TextUtils.getTextHW(format))
          return format
        }
      }
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
