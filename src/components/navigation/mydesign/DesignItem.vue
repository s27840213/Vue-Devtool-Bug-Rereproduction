<template lang="pug">
  div(class="design-item")
    div(class="design-block"
      draggable="true"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd")
      div(class="design-img-container"
        :style="containerStyles()")
        img(class="design-thumbnail"
            :style="imageStyles()"
            draggable="false"
            :src="appliedUrl")
    div(class="design-name")
      span {{ name }}
    div(class="design-size")
      span {{ `${width}x${height}` }}
    div(class="dragged-thumbnail" :style="draggedImageStyles()")
      img(:src="appliedUrl")
</template>

<script lang="ts">
import imageUtils from '@/utils/imageUtils'
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
  created() {
    imageUtils.getImageSize(this.thumbnail, this.width, this.height).then((size) => {
      const { width, height } = size
      this.aspectRatio = width / height
    })
  },
  data() {
    return {
      isDragged: false,
      draggedImageCoordinate: { x: 0, y: 0 },
      aspectRatio: 1
    }
  },
  watch: {
    thumbnail(newVal) {
      imageUtils.getImageSize(newVal, this.width, this.height).then((size) => {
        const { width, height } = size
        this.aspectRatio = width / height
      })
    }
  },
  computed: {
    appliedUrl() {
      return this.thumbnail === '' ? require('@/assets/img/svg/image-preview.svg') : this.thumbnail
    }
  },
  methods: {
    ...mapMutations('design', {
      setDraggingDesign: 'SET_draggingDesign'
    }),
    containerStyles() {
      if (this.aspectRatio < 1.2 && this.aspectRatio > 0.83) {
        return {
          padding: '26px'
        }
      } else {
        return {
          padding: '17px'
        }
      }
    },
    imageStyles() {
      if (this.aspectRatio > 1) {
        return {
          width: '100%',
          height: 'auto'
        }
      } else {
        return {
          width: 'auto',
          height: '100%'
        }
      }
    },
    draggedImageStyles() {
      return this.isDragged ? {
        left: `${this.draggedImageCoordinate.x}px`,
        top: `${this.draggedImageCoordinate.y}px`,
        display: 'block'
      } : {}
    },
    handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '0'
      this.setDraggingDesign({
        path: this.path,
        id: this.designId
      })
      document.addEventListener('dragover', this.preventDefaultDragOver, false)
    },
    handleDragging(e: DragEvent) {
      this.isDragged = true
      const target = e.target as HTMLElement
      target.style.opacity = '1'
      this.draggedImageCoordinate = {
        x: e.pageX,
        y: e.pageY
      }
    },
    handleDragEnd() {
      this.isDragged = false
      document.removeEventListener('dragover', this.preventDefaultDragOver, false)
    },
    preventDefaultDragOver(e: DragEvent) {
      e.preventDefault()
    }
  }
})
</script>

<style lang="scss" scoped>
.design-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.design-block {
  border: 1px solid setColor(gray-4);
  box-sizing: border-box;
  border-radius: 4px;
  width: 100%;
  padding-top: 90%;
  position: relative;
}

.design-img-container {
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  box-sizing: border-box;
  position: absolute;
  width: 100%;
  height: 100%;
}

.design-name {
  width: 100%;
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
  width: 100%;
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
  display: none;
  position: fixed;
  transform: translate(-50%, -50%) scale(0.5);
  pointer-events: none;
  z-index: 1000;
}
</style>
