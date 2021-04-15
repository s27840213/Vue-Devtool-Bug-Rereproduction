<template lang="pug">
  div(class="nu-page" ref="page-container")
    div(class="page-title text-left text-gray-3 mb-10" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      span {{config.name}}
    div(class="pages" :style="`transform: scale(${scaleRatio/100})`")
      div(class="page-content"
          :style="styles('content')"
          @drop="onDrop"
          @dragover.prevent,
          @dragenter.prevent)
        nu-layer(v-for="(layer,index) in config.layers"
          :key="`layer-${index}`"
          :config="layer")
      div(class="page-control" :style="styles('control')")
        nu-controller(v-for="(layer,index) in config.layers"
          :key="`controller-${index}`"
          :config="layer")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    pageScaleRatio: Number
  },
  mounted() {
    console.log(this.scaleRatio)
    console.log('page' + this.pageIndex);
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    })
  },
  watch: {
    scaleRatio() {
      // const pageContainer = this.$refs['page-container'] as HTMLElement
      const pageContainer = document.querySelector('.nu-page') as HTMLElement
      if (pageContainer !== null) {
        console.log(pageContainer.offsetWidth)
        console.log(pageContainer.offsetHeight)
      }
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayer: 'ADD_newLayer'
    }),
    styles(type: string) {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: type === 'content' ? this.config.backgroundColor : 'none'
      }
    },
    onDrop(e: DragEvent) {
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'))

        const page = e.target as HTMLElement
        const pageLeft = page.getBoundingClientRect().x
        const pageTop = page.getBoundingClientRect().y

        const left = (e.clientX - pageLeft - data.geometry.left) * (this.scaleRatio / 100)
        const top = (e.clientY - pageTop - data.geometry.top) * (this.scaleRatio / 100)

        const layerInfo = {
          type: 'image',
          pageIndex: this.config.pageIndex,
          src: require('@/assets/img/svg/img-tmp.svg'),
          active: true,
          shown: false,
          styles: {
            x: left,
            y: top,
            scale: 0,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 150,
            height: 150
          }
        }
        this.addNewLayer(this.pageIndex, layerInfo)
      }
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup) {
      this.ADD_newLayer({
        pageIndex,
        layer
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-page {
  display: inline-block;
  position: relative;
  padding: 30px;
}
.pages {
  display: flex;
  flex-direction: column;
  position: relative;
}
.page-content {
  position: relative;
  overflow: hidden;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;

  .nu-controller::v-deep {
    // We want to prevent the page-control div from blocking all the event of page-content,
    // but still allow event on nu-controller, so set this property on controller to initial
    pointer-events: initial;
  }
}
</style>
