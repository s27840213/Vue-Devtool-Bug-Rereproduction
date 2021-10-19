<template lang="pug">
  div(class="design-item")
    div(class="design-item__block"
      draggable="true"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave")
      div(class="design-item__img-container"
        :style="containerStyles()")
        img(class="design-item__thumbnail"
            :style="imageStyles()"
            draggable="false"
            :src="appliedUrl")
      div(class="design-item__controller")
        div(class="design-item__controller-content")
          div(v-if="isMouseOver || isOtherSelected"
            class="design-item__checkbox")
          div(v-if="isMouseOver"
            class="design-item__more")
            svg-icon(iconName="more_horizontal"
                    iconWidth="24px"
                    iconColor="gray-2")
          div(class="design-item__menu")
            slot
          div(v-if="favorable" class="design-item__favoriate" @click="emitLike")
            svg-icon(v-if="isMouseOver && !isInFavoriates"
                    iconName="favoriates"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="isMouseOver && isInFavoriates"
                    iconName="favoriates-fill"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="!isMouseOver && isInFavoriates"
                    iconName="favoriates-fill"
                    iconWidth="20px"
                    iconColor="gray-4")
    div(class="design-item__name")
      span {{ config.name }}
    div(class="design-item__size")
      span {{ `${config.width}x${config.height}` }}
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
    config: Object,
    favorable: Boolean,
    isInFavoriates: Boolean,
    isOtherSelected: Boolean
  },
  created() {
    imageUtils.getImageSize(this.config.thumbnail, this.config.width, this.config.height).then((size) => {
      const { width, height } = size
      this.aspectRatio = width / height
    })
  },
  data() {
    return {
      isDragged: false,
      isMouseOver: false,
      draggedImageCoordinate: { x: 0, y: 0 },
      aspectRatio: 1
    }
  },
  watch: {
    thumbnail(newVal) {
      this.isDragged = false
      imageUtils.getImageSize(newVal, this.config.width, this.config.height).then((size) => {
        const { width, height } = size
        this.aspectRatio = width / height
      })
    }
  },
  computed: {
    appliedUrl() {
      return this.config.thumbnail === '' ? require('@/assets/img/svg/image-preview.svg') : this.config.thumbnail
    }
  },
  methods: {
    ...mapMutations('design', {
      setDraggingDesign: 'SET_draggingDesign'
    }),
    containerStyles() {
      let res = {}
      if (this.isMouseOver) {
        res = { 'background-color': '#474a5780' }
      }
      if (this.aspectRatio < 1.2 && this.aspectRatio > 0.83) {
        return Object.assign(res, {
          padding: '26px'
        })
      } else {
        return Object.assign(res, {
          padding: '17px'
        })
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
    draggedImageStyles(): {[key: string]: string} {
      if (this.isDragged) {
        return {
          left: `${this.draggedImageCoordinate.x}px`,
          top: `${this.draggedImageCoordinate.y}px`,
          display: 'block'
        }
      } else {
        return {}
      }
    },
    handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '0'
      this.setDraggingDesign({
        path: this.path,
        id: this.config.id
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
    },
    handleMouseEnter() {
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
    },
    emitLike() {
      this.$emit('like')
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
  &__block {
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    border-radius: 4px;
    width: 100%;
    padding-top: 90%;
    position: relative;
  }
  &__img-container {
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
  &__controller {
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    height: 100%;
    &-content {
      position: relative;
      width: 100%;
      height: 100%;
    }
  }
  &__checkbox {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    left: 10px;
    top: 12px;
  }
  &__more {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    right: 8px;
    top: 8px;
  }
  &__favoriate {
    position: absolute;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 10px;
    bottom: 5px;
    cursor: pointer;
  }
  &__name {
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
  &__size {
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
}

.dragged-thumbnail {
  display: none;
  position: fixed;
  transform: translate(-50%, -50%) scale(0.5);
  pointer-events: none;
  z-index: 1000;
}
</style>
