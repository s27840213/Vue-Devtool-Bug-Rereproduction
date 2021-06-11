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

  // div(class="temp__item"
  //     v-for="content in contents",
  //     :style="contextStyles(content.styles)"
  //     draggable="true"
  //     @dragstart="dragStart($event, content)") {{ content.text }}

<script lang="ts">
/**
 * This components is temporarily used for text section, and it will be remove in the future
 */
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'
import { IText } from '@/interfaces/layer'

export default Vue.extend({
  data() {
    return {
      contents: [
        {
          styles: {
            // writingMode: 'vertical-lr'
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
                  text: 'Happy  ',
                  styles: {
                    font: 'Lobster',
                    weight: 'bold',
                    color: '#000000',
                    writingMode: 'initial',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                },
                {
                  text: 'newYear',
                  styles: {
                    font: 'normal',
                    weight: 'bold',
                    color: '#000000',
                    writingMode: 'initial',
                    decoration: 'none',
                    style: 'normal',
                    opacity: 1,
                    size: 25
                  }
                }
              ]
            },
            {
              styles: {
                align: 'text-align',
                fontSpacing: 0,
                lineHeight: -1
              },
              spans: [
                {
                  text: '123',
                  styles: {
                    font: 'Lobster',
                    weight: 'bold',
                    color: '#000000',
                    writingMode: 'initial',
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
                    color: '#000000',
                    writingMode: 'initial',
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
                  text: 'Future',
                  styles: {
                    font: 'Lobster',
                    weight: 'normal',
                    color: '#F2C94C',
                    writingMode: 'initial',
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
      // {
      //   text: 'Happy',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'initial',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // },
      // {
      //   text: 'New Year',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'initial',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // },
      // {
      //   text: 'Mary',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'initial',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // },
      // {
      //   text: 'Christmas',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'initial',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // },
      // {
      //   text: '虎虎生風',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'vertical-lr',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // },
      // {
      //   text: '平安喜樂',
      //   styles: {
      //     font: 'Lobster',
      //     weight: 'bold',
      //     align: 'text-align',
      //     color: '#000000',
      //     writingMode: 'vertical-lr',
      //     decoration: 'none',
      //     style: 'normal',
      //     size: 25
      //   }
      // }
    }
  },
  methods: {
    // styles() {
    //   return {
    //     'font-family': 'Lobster',
    //     'font-weight': 'bold',
    //     'font-size': '25px',
    //     'text-align': 'center',
    //     'writing-mode': 'initial',
    //     'text-decoration': 'none',
    //     color: '#000000'
    //   }
    // },
    dragStart(e: DragEvent, content: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as Element).getBoundingClientRect()
      const styles = Object.assign({}, content.styles)
      Object.assign(styles, {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y
      })

      const textHW = this.getTextHW(content)
      const data = {
        type: 'text',
        widthLimit: '',
        styles: Object.assign(styles, textHW),
        paragraphs: content.paragraphs
      }

      dataTransfer.setData('data', JSON.stringify(data))
    },
    textStyles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    },
    getTextHW(content: IText) {
      const body = document.createElement('div')
      content.paragraphs.forEach(pData => {
        const p = document.createElement('p')
        pData.spans.forEach(spanData => {
          const span = document.createElement('span')
          span.textContent = spanData.text
          Object.assign(span.style, this.textStyles(spanData.styles))
          span.style.whiteSpace = 'pre'
          p.appendChild(span)
        })
        Object.assign(p.style, this.textStyles(pData.styles))
        p.style.display = 'table'
        p.style.margin = '0.5em'
        body.appendChild(p)
      })
      body.style.border = '1px solid blue'
      body.style.width = 'fit-content'
      document.body.appendChild(body)
      const textHW = {
        width: Math.ceil(body.getBoundingClientRect().width),
        height: Math.ceil(body.getBoundingClientRect().height)
      }
      document.body.removeChild(body)
      return textHW
    }
    // getTextHW(text: string, styles: any) {
    //   const el = document.createElement('span')
    //   el.textContent = text
    //   Object.assign(el.style, this.contextStyles(styles))
    //   document.body.appendChild(el)
    //   const textHW = {
    //     width: Math.ceil(el.getBoundingClientRect().width),
    //     height: Math.ceil(el.getBoundingClientRect().height)
    //   }
    //   document.body.removeChild(el)
    //   return textHW
    // }
  }
})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    height: auto;
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 20px;
    column-gap: 10px;
    padding-top: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__item {
    display:block;
    // justify-content:center;
    // align-items:center;
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
