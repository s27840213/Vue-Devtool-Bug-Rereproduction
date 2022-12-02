<template lang="pug">
div(class="fps")
  div(v-if="pause" class="fps-graph")
    svg(v-bind="graph.attrs" class="fps-graph__svg" ref="svg")
      component(v-for="(elm, idx) in graph.content"
                :key="`graph-${idx}`"
                :is="elm.tag"
                v-bind="elm.attrs") {{elm.text}}
  div(class="fps__value")
    span(@click="showGraph") FPS: {{fps}}
    span(@click="showGraph") JS-Heap: {{jsHeapSize}}MB
</template>

<script lang="ts">
import { Path, Point } from '@/utils/textBgUtils'
import { filter, floor, groupBy, map, range } from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  name: 'Fps',
  data() {
    return {
      historySize: 30000,
      history1s: [] as number[],
      historyLong: [] as number[],
      fps: '0',
      pause: false,
      graph: {},
      jsHeapSize: 0
    }
  },
  mounted() {
    this.showFps()
  },
  methods: {
    showFps() {
      window.requestAnimationFrame(() => {
        const now = performance.now()
        while (this.history1s.length > 0 && this.history1s[0] <= now - 1000) {
          this.history1s.shift()
        }
        this.history1s.push(now)
        this.fps = (this.history1s.length / (now - this.history1s[0]) * 1000).toPrecision(2)

        if (!this.pause) {
          while (this.historyLong.length > 0 && this.historyLong[0] <= now - this.historySize) {
            this.historyLong.shift()
          }
          this.historyLong.push(now)
        }
        this.jsHeapSize = parseInt(`${(performance as any)?.memory.usedJSHeapSize / 1000000}`) ?? -1
        this.showFps()
      })
    },
    showGraph() {
      this.pause = !this.pause
      if (!this.pause) return
      const { historyLong } = this
      const now = performance.now()
      const fpsArray = range(291).reverse().map((index) => {
        return filter(historyLong, (time) => {
          return now - index * 100 - 1000 < time && time < now - index * 100
        }).length
      })
      const baseline = Math.max(...fpsArray)

      const path = new Path(new Point(0, baseline))
      fpsArray.forEach((fps, index) => path.L(new Point(index, baseline - fps)))
      path.L(new Point(291, baseline))
      const valleys = []
      let i = 1
      while (i < fpsArray.length) {
        const valley = {
          min: baseline,
          duration: 0,
          start: -1
        }
        while (i < fpsArray.length && fpsArray[i] < baseline - 5) {
          if (valley.start) valley.start = i
          valley.min = Math.min(valley.min, fpsArray[i])
          valley.duration++
          i++
        }
        if (valley.duration > 10)valleys.push(valley)
        i++
      }
      console.log('val', valleys)

      this.graph = {
        attrs: {
          viewBox: `0 0 291 ${baseline}`,
          width: '100%'
          // height: boxHeight + textBg.bStroke,
          // style: ``
        },
        content: [{
          tag: 'path',
          attrs: {
            style: 'fill: #4EABE6;',
            d: path.result()
          }
        }, ...valleys.map((valley) => ({
          tag: 'text',
          attrs: {
            x: valley.start,
            y: baseline / 2,
            style: 'font-size: 5px'
          },
          text: `d:${valley.duration}`
        })), ...valleys.map((valley) => ({
          tag: 'text',
          attrs: {
            x: valley.start,
            y: baseline / 2 + 5,
            style: 'font-size: 5px'
          },
          text: `min: ${valley.min}`
        }))]
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.fps__value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: white;
  padding: 2px;
  position: absolute;
  bottom: 60px;
  right: 20px;
  z-index: 1000;
}
.fps-graph {
  position: absolute;
  width: 100%;
  height: 100%;
  bottom: 0;
  right: 0;
  background: white;
  z-index: 999;
  &__svg{

  }
}
</style>
