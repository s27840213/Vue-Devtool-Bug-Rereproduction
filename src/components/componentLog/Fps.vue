<template lang="pug">
div(class="fps")
  div(v-if="pause" class="fps-graph")
    svg(v-bind="graph.attrs" class="fps-graph__svg" ref="svg")
      component(v-for="(elm, idx) in graph.content"
                :key="`graph-${idx}`"
                :is="elm.tag"
                v-bind="elm.attrs") {{elm.text}}
    div(class="fps-graph__valleys")
      div(v-for="valley in valleys" :style="{color: valley.color}") {{valley.text}}
  div(class="fps__value" @click="showGraph")
    span FPS: {{fps}}
    span JS-Heap: {{jsHeapSize}}MB
</template>

<script lang="ts">
import { Path, Point } from '@/utils/textBgUtils'
import { filter, range } from 'lodash'
import Vue from 'vue'

class Valley {
  min: number
  duration = 0
  start = -1
  text = ''
  color = ''
  path = null as Path | null

  constructor(baseline: number) {
    this.min = baseline
  }

  process(baseline: number, colorIndex: number, fpsArray: number[]) {
    const end = this.start + this.duration
    this.text = `min: ${this.min}, duration: ${this.duration / 10}s`
    this.color = ['red', 'orange', 'green', 'purple'][colorIndex]
    this.path = new Path(new Point(this.start, baseline))
    range(this.start, end).forEach((index) => {
      (this.path as Path).L(new Point(index, baseline - fpsArray[index]))
    });
    (this.path as Path).L(new Point(end, baseline))
  }
}

export default Vue.extend({
  name: 'Fps',
  data() {
    return {
      historySize: 30000,
      history1s: [] as number[],
      historyLong: [] as number[],
      fps: 0,
      pause: false,
      graph: {},
      valleys: [] as Valley[],
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
        this.fps = this.history1s.length

        while (this.historyLong.length > 0 && this.historyLong[0] <= now - this.historySize) {
          this.historyLong.shift()
        }
        this.historyLong.push(now)
        this.jsHeapSize = parseInt(`${performance.memory?.usedJSHeapSize ?? -1000000 / 1000000}`)
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
      this.valleys = []
      let i = 0
      while (i < fpsArray.length) {
        const valley = new Valley(baseline)
        // If fps lower than baseline, record a valley.
        while (i < fpsArray.length && fpsArray[i] < baseline - 10) {
          if (valley.start === -1) valley.start = i
          valley.min = Math.min(valley.min, fpsArray[i])
          valley.duration++
          i++
        }
        // If valley duration longer than 0.3s, save it.
        if (valley.duration > 3) {
          valley.process(baseline, this.valleys.length % 4, fpsArray)
          this.valleys.push(valley)
        }
        i++
      }

      const valleyCover = this.valleys.map((valley) => ({
        tag: 'path',
        attrs: {
          style: `fill: ${valley.color};`,
          d: valley.path?.result()
        }
      }))
      const scaleLine = range(0, baseline, 10).map(scale => ({
        tag: 'line',
        attrs: {
          style: 'stroke: black; stroke-width: 0.3',
          x1: 0,
          y1: baseline - scale,
          x2: 291,
          y2: baseline - scale
        }
      }))

      this.graph = {
        attrs: {
          viewBox: `0 0 291 ${baseline}`,
          width: '100%'
        },
        content: [{
          tag: 'path',
          attrs: {
            style: 'fill: #4EABE6;',
            d: path.result()
          }
        }, ...valleyCover, ...scaleLine]
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
  overflow-y: auto;
}
</style>
