<template lang="pug">
div(class="temp__content")
  div(class="temp__item"
      v-for="content in contents",
      :style="contextStyles(content.styles)"
      draggable="true"
      @dragstart="dragStart($event, content)") {{ content.text }}
</template>

<script lang="ts">
/**
 * This components is temporarily used for text section, and it will be remove in the future
 */
import Vue from 'vue'
import CssConveter from '@/utils/cssConverter'

export default Vue.extend({
  data() {
    return {
      contents: [
        {
          text: 'Happy',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'initia',
            size: 25
          }
        },
        {
          text: 'New Year',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'initia',
            size: 25
          }
        },
        {
          text: 'Mary',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'initia',
            size: 25
          }
        },
        {
          text: 'Christmas',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'initia',
            size: 25
          }
        },
        {
          text: '虎虎生風',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'vertical-lr',
            size: 25
          }
        },
        {
          text: '平安喜樂',
          styles: {
            font: 'Lobster',
            weight: 'bold',
            align: 'text-align',
            color: '#000000',
            writingMode: 'vertical-lr',
            size: 25
          }
        }
      ]
    }
  },
  methods: {
    styles() {
      return {
        'font-family': 'Lobster',
        'font-weight': 'bold',
        'font-size': '25px',
        'text-align': 'center',
        'writing-mode': 'initial',
        color: '#000000'
      }
    },
    dragStart(e: DragEvent, content: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as Element).getBoundingClientRect()
      const styles = Object.assign({}, content.styles)
      Object.assign(styles, {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y,
        size: 72,
        initSize: 72
      })

      const textHW = this.getTextHW(content.text, styles)
      const data = {
        type: 'text',
        text: content.text,
        textEditable: false,
        styles: Object.assign(styles, textHW)
      }

      dataTransfer.setData('data', JSON.stringify(data))
    },
    contextStyles(styles: any) {
      return CssConveter.convertFontStyle(styles)
    },
    getTextHW(text: string, styles: any) {
      const el = document.createElement('span')
      el.textContent = text
      Object.assign(el.style, this.contextStyles(styles))
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
    display:flex;
    justify-content:center;
    align-items:center;
    border: 1px solid blue;
    width: auto;
  }
}
</style>
