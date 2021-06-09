<template lang="pug">
  div(class="nu-shape")
    div(ref="svg")

</template>

<script lang="ts">
import Vue from 'vue'
import { config } from 'vue/types/umd'

export default Vue.extend({
  data() {
    return {
    }
  },
  mounted() {
    console.log(this.config)
    const svg = this.$refs.svg as HTMLElement
    svg.innerHTML = this.svgFormatter(this.config.svg, this.config.color)
    console.log(svg.innerHTML)
  },
  watch: {
    'config.color': {
      handler: function(newVal) {
        const svg = this.$refs.svg as HTMLElement
        svg.innerHTML = this.svgFormatter(this.config.svg, newVal)
        // console.log(svg.innerHTML)
      },
      deep: true
    },
    'config.path': function() {
      console.log('path change')
    }
  },
  computed: {
    // viewBox(): string {
    //   return this.config.viewBox.join(' ')
    // }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
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
.nu-shape {
  display: relative;
}
</style>
