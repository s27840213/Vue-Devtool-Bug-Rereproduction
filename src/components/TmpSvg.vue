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
          shape: 'rect',
          fill: 'default',
          color: '#000000',
          path: 'M0 0 L0 40 60 40 60 0z',
          viewBox: '0 0 60 40'
        },
        {
          shape: 'rect',
          fill: 'default',
          color: '#000000',
          path: 'M0 0 L0 40 60 40 60 0z',
          viewBox: '0 0 60 40'
        }
        // ,
        // {
        //   shape: 'rect',
        //   radius: 10,
        //   color: 'green',
        // },
        // {
        //   shape: 'line',
        //   radius: 10,
        //   color: 'black',
        // },
        // {
        //   shape: 'ellipse',
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
      const svgSize = this.getSVGSize()
      const svgData = {
        type: 'shape',
        styles: {
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
          width: svgSize.width,
          height: svgSize.height,
          color: '#000000'
        }
      }

      Object.assign(data, svgData)
      dataTransfer.setData('data', JSON.stringify(data))
    },
    getSVGSize() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const path = this.$refs.path as HTMLElement
      svg.append(path)
      document.body.appendChild(svg)
      const size = {
        width: svg.getBoundingClientRect().width,
        height: svg.getBoundingClientRect().height
      }
      document.body.removeChild(svg)
      return size
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
