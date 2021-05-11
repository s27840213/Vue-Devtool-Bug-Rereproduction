<template lang="pug">
div(class="temp__content")
  div(class="temp__item" v-for="svg in contents",
      draggable="true",
      @dragstart="dragStart($event, svg)")
    svg(class="temp__svg" :viewBox="svg.viewBox" preserveAspectRatio="xMidYMid"
        :style="styles(svg)")
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
          color: '#2EB8E6',
          path: 'M0 0 L0 120 180 120 180 0z',
          viewBox: [0, 0, 180, 120],
          clipper: false
        },
        {
          category: 'rect',
          color: 'pink',
          path: 'M0 0 L0 240 120 240 120 0z',
          viewBox: [0, 0, 120, 240],
          clipper: true
        },
        {
          category: 'circle',
          color: 'gray',
          path: 'M125 0a125 125 0 1 0 0 250a125 125 0 1 0 0-250z',
          viewBox: [0, 0, 250, 250],
          clipper: true
        },
        {
          category: 'arbitrary',
          color: 'red',
          path: 'M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z',
          viewBox: [0, 0, 100, 100],
          clipper: true
          // svg: `<script>alert('xxx')<\/script><style type='text/css'>.st0{fill:#008BDB;}<\/style><circle class='st0' cx='400' cy='400' r='265'/>`
        }
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
  methods: {
    styles(svg: any) {
      return {
        fill: svg.color
      }
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
          width: data.viewBox[2],
          height: data.viewBox[3],
          color: data.color
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
