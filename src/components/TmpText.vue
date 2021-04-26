<template lang="pug">
div(class="temp__content")
  div(class="temp__item"
    v-for="text in contents",
    :style="styles()"
    draggable="true",
    @dragstart="dragStart($event, text)") {{ text }}
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
      contents: ['Happy', 'New Year', 'Mary', 'Christmas', 'Hello', 'World']
    }
  },
  methods: {
    styles() {
      return {
        'font-family': 'Lobster',
        'font-weight': 'bold',
        'font-size': '25px',
        'text-align': 'center',
        color: '#000000'
      }
    },
    dragStart(e: DragEvent, text: string) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as Element).getBoundingClientRect()
      const data = {
        type: 'text',
        text: text,
        styles: {
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
          width: 300,
          height: 150,
          font: 'Lobster',
          weight: 'bold',
          align: 'left',
          color: '#000000',
          size: 72
        }
      }

      dataTransfer.setData('data', JSON.stringify(data))
    }
  },
  fontStyles() {
    return CssConveter.convertFontStyle(this.config.styles)
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
    border: 1px solid blue;
    width: auto;
  }
}
</style>
