
<template lang="pug">
div(class="temp__content")
  div(class="temp__item" v-for="svg in contents",
      ref="body"
      draggable="true",
      @dragstart="dragStart($event, svg)")
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
          category: 1,
          color: ['#2EB8E6'],
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 180 120" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <path fill="\${color[0]}" d="M0 0 L0 120 180 120 180 0z"/>
                </svg>
                `,
          path: 'M0 0 L0 120 180 120 180 0z',
          size: [180, 120]
        },
        {
          category: 1,
          color: ['#808080'],
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 250 250" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <path fill="\${color[0]}" d="M125 0a125 125 0 1 0 0 250a125 125 0 1 0 0-250z"/>
                </svg>
                `,
          path: 'M125 0a125 125 0 1 0 0 250a125 125 0 1 0 0-250z',
          size: [250, 250]
        },
        {
          category: 2,
          color: ['#EB5757'],
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 100 100" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <path fill="\${color[0]}" d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z"/>
                </svg>`,
          path: 'M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z',
          size: [100, 100]
        },
        {
          category: 1,
          color: ['#EDC5B1'],
          svg: `<?xml version="1.0" encoding="utf-8"?>
                <!-- Generator: Adobe Illustrator 25.2.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  viewBox="0 0 347.76 599.51" style="enable-background:new 0 0 347.76 599.51;" xml:space="preserve">
                <style type="text/css">
                  .st0{fill:\${color[0]}}
                </style>
                <rect class="st0" width="347.76" height="87.51"/>
                <rect y="87.51" class="st0" width="347.76" height="325"/>
                <path class="st0" d="M0,481.34c0,65.26,77.85,118.17,173.88,118.17s173.88-52.91,173.88-118.17v-68.83H0V481.34z"/>
                </svg>
                `,
          path: '',
          size: [100, 100 * 599.51 / 347.76]
        },
        {
          category: 0,
          color: ['#008BDB'],
          svg: `<svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                <circle fill="\${color[0]}" cx="400" cy="400" r="265"/>
                </svg>
                `,
          path: '',
          size: [100, 120]
        },
        {
          category: 0,
          color: ['#EB5757', '#FFFF00'],
          svg: `<?xml version="1.0" encoding="utf-8"?>
                 <!-- Generator: Adobe Illustrator 25.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
                 <svg version="1.1" id="圖層_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                 viewBox="0 0 180 120" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                 <path fill="\${color[0]}" d="M0 0 L0 60 120 60 120 0z"/>
                 <path fill="\${color[1]}" d="M0 65 L0 90 150 90 150 65z"/>
                 <path fill="\${color[0]}" d="M0 95 L0 120 180 120 180 95z"/>
                 </svg>`,
          path: '',
          size: [180, 120]
        },
        {
          category: 2,
          color: ['#fe0000', '#000095', '#fff'],
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><g fill-rule="evenodd">
                <path d="M0 0h900v600H0z" fill="\${color[0]}"/>
                <path d="M0 0h450v300H0z" fill="\${color[1]}"/>
                </g>
                <path d="M225 37.5l-56.25 209.928L322.428 93.75 112.5 150l209.928 56.25L168.75 52.572 225 262.5l56.25-209.928L127.572 206.25 337.5 150 127.572 93.75 281.25 247.428 225 37.5" fill="\${color[2]}" paint-order="markers fill stroke"/>
                <circle cy="150" cx="225" r="60" fill="\${color[2]}" stroke="#000095" stroke-width="7.5"/>
                </svg>`,
          path: '',
          size: [180, 120]
        }
      ]
    }
  },
  mounted() {
    const body = this.$refs.body as [HTMLElement]
    for (let i = 0; i < body.length; i++) {
      const div = document.createElement('div')
      div.style.width = '100px'
      div.innerHTML = this.svgFormatter(this.contents[i].svg, this.contents[i].color as [string])
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
          width: data.size[0],
          height: data.size[1],
          color: data.color
        }
      }

      Object.assign(data, svgData)
      dataTransfer.setData('data', JSON.stringify(data))
    },
    svgFormatter(svg: string, color: [string]): string {
      for (let i = 0; i < color.length; i++) {
        const reg = new RegExp('\\${color\\[' + i + '\\]}', 'g')
        svg = svg.replace(reg, color[i])
      }
      return svg
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
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__svg {
    // width: auto;
    margin: auto;
  }
}
</style>
