<template lang="pug">
  div(class="design-item")
    div(class="design-block"
      draggable="true"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd")
      img(v-if="thumbnail === ''" class="design-thumbnail"
          draggable="false"
          :src="require('@/assets/img/svg/image-preview.svg')")
      img(v-else class="design-thumbnail"
          draggable="false"
          :src="thumbnail")
    div(class="design-name")
      span {{ name }}
    div(class="design-size")
      span {{ `${width}x${height}` }}
    div(v-if="isDragged" class="dragged-thumbnail" :style="draggedImageStyles()")
      img(v-if="thumbnail === ''"
          :src="require('@/assets/img/svg/image-preview.svg')")
      img(v-else
          :src="thumbnail")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    path: Array,
    name: String,
    width: Number,
    height: Number,
    designId: String,
    thumbnail: String
  },
  data() {
    return {
      isDragged: false,
      draggedImageCoordinate: { x: 0, y: 0 }
    }
  },
  computed: {
  },
  methods: {
    ...mapMutations('design', {
      setDraggingDesign: 'SET_draggingDesign'
    }),
    draggedImageStyles() {
      return {
        left: `${this.draggedImageCoordinate.x}px`,
        top: `${this.draggedImageCoordinate.y}px`
      }
    },
    handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '0'
      this.isDragged = true
      this.setDraggingDesign({
        path: this.path,
        id: this.designId
      })
    },
    handleDragging(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '1'
      this.draggedImageCoordinate = {
        x: e.pageX,
        y: e.pageY
      }
    },
    handleDragEnd() {
      this.isDragged = false
    }
  }
})
</script>

<style lang="scss" scoped>
.design-block {
  width: 205px;
  height: 182px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid setColor(gray-4);
  box-sizing: border-box;
  border-radius: 4px;
}

.design-name {
  width: 205px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  > span {
    font-family: Mulish;
    font-size: 16px;
    font-weight: 400;
    color: setColor(gray-1);
  }
}

.design-size {
  width: 205px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -5px;
  > span {
    font-family: Mulish;
    font-size: 12px;
    font-weight: 400;
    color: setColor(gray-3);
  }
}

.dragged-thumbnail {
  position: fixed;
  transform: translate(-50%, -50%) scale(0.5);
  pointer-events: none;
  z-index: 1000;
}
</style>
