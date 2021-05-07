<template lang="pug">
div(class="temp__content")
  div(class="temp__item" v-for="svg in contents",
      draggable="true",
      @dragstart="dragStart($event, svg)")
    svg(class="temp__svg" :viewBox="svg.viewBox" preserveAspectRatio="xMidYMid")
      path(:d="svg.path" ref="path")
</template>

<script lang="ts">
/**
 * This components is temporarily used for text section, and it will be remove in the future
 */
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      contents: [
        {
          category: 'rect',
          fill: 'default',
          color: '#000000',
          path: 'M0 0 L0 40 60 40 60 0z',
          viewBox: [0, 0, 60, 40]
        },
        {
          category: 'rect',
          fill: 'default',
          color: '#000000',
          path: 'M0 0 L0 80 40 80 40 0z',
          viewBox: [0, 0, 40, 80]
        }
        // ,
        // {
        //   category: 'rect',
        //   radius: 10,
        //   color: 'green',
        // },
        // {
        //   category: 'line',
        //   radius: 10,
        //   color: 'black',
        // },
        // {
        //   category: 'ellipse',
        //   radiusX: 10,
        //   radiusY: 5,
        //   color: 'red',
        // }
      ]
    }
  },
  mounted() {
    console.log('mounted!')
  },
  methods: {
    styles() {
      return {}
    },
    dragStart(e: DragEvent, data: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const svgData = {
        type: 'shape',
        styles: {
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
          width: data.viewBox[2] * 3,
          height: data.viewBox[3] * 3,
          color: '#000000'
        }
      }

      Object.assign(data, svgData)
      dataTransfer.setData('data', JSON.stringify(data))
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
    width: auto;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__item {
    // border: 1px solid blue;
    width: auto;
  }
  &__svg {
    // width: auto;
    margin: auto;
  }
}
</style>
