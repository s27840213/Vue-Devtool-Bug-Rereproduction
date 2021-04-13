<template lang="pug">
  div(class="nu-page" ref="page-container")
    div(class="page-title text-left text-gray-3 mb-10" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      span {{config.name}}
    div(class='pages-wrapper' :style="styles()")
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
          nu-controller(v-for="(layer,index) in config.layers" :key="`controller-${index}`" :config="layer")
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
    test() {
      console.log('sync style')
    },
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor
      } : type === 'control' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      } : {
        width: `${this.config.width * (this.scaleRatio / 100)}px`,
        height: `${this.config.height * (this.scaleRatio / 100)}px`
      }
    },
    onDrop(e: DragEvent) {
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'))
        /* TODO: use the 'getData' to append complete item data */
        /* how to Q: import an img, svg, etc.. Q: as a child-component to the layer */
        const page = e.target as HTMLElement
        const pageLeft = page.getBoundingClientRect().left
        const pageTop = page.getBoundingClientRect().top

        const left = (e.clientX - pageLeft - data.geometry.left) * (this.scaleRatio / 100)
        const top = (e.clientY - pageTop - data.geometry.top) * (this.scaleRatio / 100)

        const layerInfo = {
          type: 'image',
          pageIndex: this.config.pageIndex,
          src: require('@/assets/img/svg/img-tmp.svg'),
          active: false,
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
  @include flexCenter;
  min-height: 100%;
  min-width: 100%;
  flex-direction: column;
  box-sizing: border-box;
  border: 1px solid red;
  flex: 1;
}

.page-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  top: 0px;
  left: 0;
}
.pages-wrapper {
  position: relative;
  border: 1px solid red;
}
.pages {
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  position: relative;
  border: 1px solid blue;
  transform-origin: top left;
}
.page-content {
  overflow: hidden;
  border: 1px solid green;
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
