<template lang="pug">
div(class="temp__content")
  div(class="temp__item" v-for="svg in contents",
      ref="body"
      draggable="true",
      @dragstart="dragStart($event, svg)")
    //- svg(class="temp__svg" :viewBox="svg.viewBox" preserveAspectRatio="xMidYMid"
    //-     :style="styles(svg)")
    //-   path(:d="svg.path" ref="path")
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
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <style type="text/css">
                  .st3{fill:#2EB8E6;}
                </style>
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 180 120" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <path class="st3" class="st0" d="M0 0 L0 120 180 120 180 0z"/>
                </svg>
                `,
          path: 'M0 0 L0 120 180 120 180 0z',
          viewBox: [0, 0, 180, 120],
          clipper: true
        },
        //   category: 'rect',
        //   color: 'pink',
        //   path: 'M0 0 L0 240 120 240 120 0z',
        //   viewBox: [0, 0, 120, 240],
        //   clipper: true
        // },
        {
          category: 'circle',
          color: 'gray',
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <style type="text/css">
                  .st0{fill:gray;}
                </style>
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <circle class="st0" class="st0" cx="400" cy="400" r="265"/>
                </svg>
                `,
          path: 'M125 0a125 125 0 1 0 0 250a125 125 0 1 0 0-250z',
          viewBox: [0, 0, 250, 250],
          clipper: true
        },
        {
          category: 'arbitrary',
          color: 'red',
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 100 100" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <style type="text/css">
                  .st1{fill:red;}
                </style>
                <path class="st1" d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z"/>
                </svg>`,
          path: 'M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z',
          viewBox: [0, 0, 100, 100],
          clipper: true

        },
        {
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <style type="text/css">
                  .st2{fill:#EDC5B1;}
                </style>
                <circle class="st2" cx="400" cy="400" r="265"/>
                </svg>
                `,
          path: '',
          viewBox: [0, 0, 800, 800],
          clipper: false
        }
      ]
    }
  },
  mounted() {
    const body = this.$refs.body as [HTMLElement]
    for (let i = 0; i < body.length; i++) {
      const div = document.createElement('div')
      div.innerHTML = this.contents[i].svg
      body[i].appendChild(div)
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
