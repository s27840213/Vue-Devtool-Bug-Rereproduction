<template lang="pug">
  div(class="page-container")
    div(class="page-title text-left text-gray-3")
      span {{config.name}}
    div(class="page-content" id='page'
    :style="styles()"
    @drop='onDrop'
    @dragover.prevent
    @dragenter.prevent)
      Layer(v-for='(layer, index) in layers' :key='index'
      :item='layer' :style="{ left: layer.left, top: layer.top}")

</template>

<script lang="ts">
import Vue from 'vue';
import Layer from '@/components/editor/components/Layer.vue';

export default Vue.extend({
  components: { Layer },
  data() {
    return {
      layers: []
    }
  },
  props: {
    config: Object,
    index: Number
  },
  methods: {
    styles() {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor
      }
    },
    onDrop(e: DragEvent) {
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'));
        /* TODO: use the 'getData' to append complete item data */
        /* how to ^import an img, svg, etc.. ^as a child-component to the layer */
        const img = document.createElement('img');
        img.src = require('@/assets/img/svg/img-tmp.svg');
        img.draggable = false;

        const page = e.target as HTMLElement;
        const pageLeft = page.getBoundingClientRect().left;
        const pageTop = page.getBoundingClientRect().top;

        img.style.position = 'absolute';
        img.style.left = `${e.clientX - pageLeft - data.geometry.left}px`;
        img.style.top = `${e.clientY - pageTop - data.geometry.top}px`;
        console.log(`x: ${e.clientX} y: ${e.clientY}`);
        console.log(`pagex: ${pageLeft} pagey: ${pageTop}`);

        const imgdata = {
          left: img.style.left,
          top: img.style.top
        };

        const p = document.getElementById('page');
        p!.appendChild(img);

        // ^how to use the data array to dynamically appending the components.
        console.log(imgdata);
        this.layers.push(imgdata);
      }
    }
  }
})

</script>

<style lang="scss" scoped>
.page-container {
}
.page-content {
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
}
</style>
