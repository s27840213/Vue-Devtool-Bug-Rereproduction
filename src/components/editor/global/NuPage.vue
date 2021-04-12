<template lang="pug">
.page-container
  .page-title.text-left.text-gray-3
    span {{ config.name }}

  #page.page-content(
    :style="styles()",
    @drop="onDrop",
    @dragover.prevent,
    @dragenter.prevent
  )
    template(v-for="(layer, index) in testLayers")
      nu-layer(:key="`layer-${index}`" :config="layer")
      nu-controller(:key="`controller-${index}`"
      :config="layer")

</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      testLayers: []
    };
  },
  props: {
    config: Object,
    index: Number
  },
  mounted() {
    console.log(this.config);
  },
  methods: {
    test() {
      console.log('sync style');
    },
    styles() {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor
      };
    },
    onDrop(e: DragEvent) {
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'));
        /* TODO: use the 'getData' to append complete item data */
        /* how to Q: import an img, svg, etc.. Q: as a child-component to the layer */
        const img = document.createElement('img');
        img.src = require('@/assets/img/svg/img-tmp.svg');
        img.draggable = false;

        const page = e.target as HTMLElement;
        const pageLeft = page.getBoundingClientRect().left;
        const pageTop = page.getBoundingClientRect().top;

        const left = e.clientX - pageLeft - data.geometry.left;
        const top = e.clientY - pageTop - data.geometry.top;

        const testLayer = {
          active: false,
          shown: false,
          type: 'image',
          styles: {
            color: '0xC4C4C4',
            x: left,
            y: top,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 150,
            height: 150
          }
        };

        // Q: how to use the data array to dynamically appending the components.
        console.log(testLayer);
        this.testLayers.push(testLayer);
      }
    }
  }
});
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
