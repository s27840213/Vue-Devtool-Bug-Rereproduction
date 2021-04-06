<template lang="pug">
 div(class="canvas-view")
  div(class="test-nav")
    div(v-for="nav in testNav" @click="setPanelType(PanelType[nav])") {{nav}}

</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'
import { PanelType } from '@/store/types';

export default Vue.extend({
  data() {
    return {
      PanelType,
      config: {
        width: 400,
        height: 400
      },
      configText: {
        text: 'Draggable Text',
        x: 50,
        y: 50,
        draggable: true
      },
      rectangles: [
        {
          rotation: 0,
          x: 10,
          y: 10,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          fill: 'red',
          name: 'rect1',
          draggable: true
        },
        {
          rotation: 0,
          x: 150,
          y: 150,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          fill: 'green',
          name: 'rect2',
          draggable: true
        }
      ],
      selectedShapeName: '',
      isDragging: false,
      testNav: [
        'group',
        'textSetting',
        'colorPicker',
        'pageSetting',
        'photoSetting']
    }
  },
  methods: {
    ...mapMutations({
      SET_currPanelType: 'editor/SET_currPanelType'
    }),
    setPanelType(type: number) {
      this.SET_currPanelType(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.canvas-view {
  @include size(100%, 100%);
  @include flexCenter;
  position: relative;
}

.test-nav {
  display: flex;
  position: absolute;
  top: 10px;
  left: 10px;
  > div {
    margin: 0px 5px;
    border: 1px solid setColor(gray-3);
    padding: 5px 10px;
    border-radius: 25px;
    cursor: pointer;
  }
}
</style>
