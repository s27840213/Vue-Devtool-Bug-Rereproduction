<template lang="pug">
div(class="temp__content")
  div(v-for="content in contents",
      class="text__content"
      :style="textStyles(content.styles)"
      draggable="true"
      @dragstart="dragStart($event, content)")
      p(v-for="(p, pIndex) in content.paragraphs"
        :key="pIndex")
        span(v-for="(span, sIndex) in p.spans"
        class="text__span"
        :key="sIndex"
        :style="textStyles(span.styles)") {{ span.text }}
</template>

<script lang="ts">
/**
 * This components is temporarily used for text section, and it will be remove in the future
 */
import { defineComponent } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import CssConveter from '@/utils/cssConverter'
import { IText } from '@/interfaces/layer'
import textUtils from '@/utils/textUtils'

export default defineComponent({
  emits: [],
  data() {
    return {
      contents: [
        {
          styles: {
            writingMode: 'horizontal-tb',
            align: 'center',
            textEffect: {},
            textShape: {}
          },
          paragraphs: [
            {
              styles: {
                fontSpacing: 0,
                lineHeight: 1.6
              },
              spans: [
                {
                  text: 'Happy  ',
                  styles: {
                    font: 'Manrop',
                    weight: 'normal',
                    color: '#2EB8E6',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                },
                {
                  text: 'newYear ',
                  styles: {
                    font: 'Manrop',
                    weight: 'normal',
                    color: '#000000',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                },
                {
                  text: 'Mmnnhm',
                  styles: {
                    font: 'Manrop',
                    weight: 'normal',
                    color: '#2EB344',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 22
                  }
                }
              ]
            },
            {
              styles: {
                fontSpacing: 0,
                lineHeight: 1.6
              },
              spans: [
                {
                  text: '123',
                  styles: {
                    font: 'Lobster',
                    weight: 'bold',
                    color: '#008BDB',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                },
                {
                  text: 'text',
                  styles: {
                    font: 'Lobster',
                    weight: 'normal',
                    color: '#EB5757',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 13
                  }
                }
              ]
            }
          ]
        },
        {
          styles: {
            writingMode: 'horizontal-tb',
            align: 'center',
            textEffect: {},
            textShape: {}
          },
          paragraphs: [
            {
              styles: {
                fontSpaceing: 0,
                lineHeight: 1.6
              },
              spans: [
                {
                  text: '中文',
                  styles: {
                    font: 'Noto Sans TC',
                    weight: 'normal',
                    color: '#2EB344',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 28
                  }
                },
                {
                  text: '測試用',
                  styles: {
                    font: 'SetoFont',
                    weight: 'normal',
                    color: '#2EB8E6',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 20
                  }
                }
              ]
            }
          ]
        },
        {
          styles: {
            writingMode: 'horizontal-tb',
            align: 'center',
            textEffect: {},
            textShape: {}
          },
          paragraphs: [
            {
              styles: {
                fontSpacing: 0,
                lineHeight: 1.6
              },
              spans: [
                {
                  text: 'Future',
                  styles: {
                    font: 'Lobster',
                    weight: 'normal',
                    color: '#F2C94C',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  methods: {
    dragStart(e: DragEvent, text: IText) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as Element).getBoundingClientRect()
      const styles = Object.assign({}, text.styles)
      Object.assign(styles, {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y
      })
      const data = {
        type: 'text',
        id: uuidv4(),
        widthLimit: -1,
        styles: Object.assign(styles, textUtils.getTextHW(text)),
        paragraphs: text.paragraphs
      }

      dataTransfer.setData('data', JSON.stringify(data))
    },
    textStyles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    }
  }
})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    height: auto;
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(1, 1fr);
    row-gap: 20px;
    column-gap: 10px;
    padding-top: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
    @include no-scrollbar;
  }
  &__item {
    display:block;
    border: 1px solid blue;
  }
}

.text {
  &__content {
    display:block;
    border: 1px solid blue;
  }
  &__span {
    white-space: pre;
  }
}
</style>
