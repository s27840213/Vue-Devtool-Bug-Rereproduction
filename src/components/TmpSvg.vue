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
        // {
        //   category: 'rect',
        //   color: '#2EB8E6',
        //   path: 'M0 0 L0 120 180 120 180 0z',
        //   viewBox: [0, 0, 180, 120],
        //   clipper: false
        // },
        // {
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
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <style type="text/css">
                  .st0{fill:#EDC5B1;}
                </style>
                <circle class="st0" cx="400" cy="400" r="265"/>
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
                  .st0{fill:#EDC5B1;}
                </style>
                <path class="st0" d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z"/>
                </svg>`,
          path: 'M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z',
          viewBox: [0, 0, 100, 100],
          clipper: true
        },
        {
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [
                  <!ENTITY st0 "fill:#F5E4DB;">
                  <!ENTITY st1 "fill:#AFB4C0;">
                  <!ENTITY st2 "fill:#EDC5B1;">
                  <!ENTITY st3 "fill:#E1C0C4;">
                  <!ENTITY st4 "fill:#E4CEB2;">
                ]>
                <svg version="1.1" id="_x31_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <polygon style="&st0;" points="207.6,186.5 107.6,186.5 57.5,273.1 107.6,359.8 207.6,359.8 257.7,273.1 "/>
                <polygon style="&st1;" points="403.1,167.1 437.5,236.9 514.6,248.1 458.8,302.4 472,379.2 403.1,342.9 334.1,379.2 347.3,302.4
                  291.5,248.1 368.6,236.9 "/>
                <rect x="564.3" y="196.4" style="&st2;" width="153.4" height="153.4"/>
                <path style="&st3;" d="M195.1,625.8h-94.5c-29.9,0-54.4-24.5-54.4-54.4v-49.8c0-29.9,24.5-54.4,54.4-54.4h94.5
                  c29.9,0,54.4,24.5,54.4,54.4v49.8C249.5,601.3,225,625.8,195.1,625.8z"/>
                <path style="&st4;" d="M318.4,578.3l88.6-88.6c6.9-6.9,18.1-6.9,25,0l88.6,88.6c11.1,11.1,3.2,30.2-12.5,30.2H330.9
                  C315.1,608.5,307.3,589.4,318.4,578.3z"/>
                <circle style="&st1;" cx="667.4" cy="546.5" r="86.4"/>
                </svg>
                `,
          path: '',
          viewBox: [0, 0, 800, 800],
          clipper: false
        },
        {
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [
                  <!ENTITY st0 "fill:#008BDB;">
                ]>
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <circle style="&st0;" cx="400" cy="400" r="265"/>
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
