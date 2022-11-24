<template lang="pug">
div(class="design-item")
  div(class="design-item__block pointer"
    :style="blockStyles()"
    :draggable="!undraggable && !isTempDesign"
    @dragstart="handleDragStart"
    @drag="handleDragging"
    @dragend="handleDragEnd"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave")
    div(class="design-item__img-container")
      image-carousel(v-if="showCarousel"
        :imgs="pageImages"
        @change="handleCarouselIdx")
        template(v-slot="{ url }")
          img(class="design-item__thumbnail"
              draggable="false"
              :style="imageStyles()"
              :src="url")
      img(ref="thumbnail"
          v-if="!showCarousel && previewCheckReady"
          class="design-item__thumbnail"
          draggable="false"
          :src="appliedUrl")
    div(class="design-item__controller")
      div(class="design-item__controller-content"
        @click.self="handleClick")
        div(v-if="isSelected"
          class="design-item__checkbox-checked"
          @click.stop="emitDeselect")
          svg-icon(iconName="done"
                  iconWidth="10px"
                  iconHeight="8px"
                  iconColor="white")
        div(v-if="!isSelected && (isMouseOver || isAnySelected)"
          class="design-item__checkbox"
          @click.stop="emitSelect")
        div(v-if="isMouseOver && !isMultiSelected"
          class="design-item__more"
          @click.stop="toggleMenu()")
          svg-icon(iconName="more_vertical"
                  iconWidth="24px"
                  iconColor="gray-2")
        div(v-if="menuItems.length > 0 && isMenuOpen && isMouseOver"
            class="design-item__menu"
            v-click-outside="closeMenu")
          slot(v-for="(dummy, index) in menuItems" :name="`i${index}`") {{ index }}
        div(v-if="favorable && !isMultiSelected" class="design-item__favorite" @click.stop="emitLike")
          svg-icon(v-if="isMouseOver && !config.favorite"
                  iconName="favorites"
                  iconWidth="20px"
                  iconColor="white")
          svg-icon(v-if="isMouseOver && config.favorite"
                  iconName="favorites-fill"
                  iconWidth="20px"
                  iconColor="white")
          svg-icon(v-if="!isMouseOver && config.favorite"
                  iconName="favorites-fill"
                  iconWidth="20px"
                  iconColor="gray-4")
        span(v-if="isMouseOver" class="design-item__index") {{ carouselIdx + 1 }}/{{ config.pageNum }}
  div(class="design-item__name"
      v-click-outside="handleNameEditEnd"
      @mouseenter="handleNameMouseEnter"
      @mouseleave="handleNameMouseLeave"
      @click="handleNameClick")
    div(v-if="isNameEditing" class="design-item__name__container design-item__name__container-editor")
      input(ref="name"
            v-model="editableName"
            @change="handleNameEditEnd"
            @keyup="checkNameEnter")
      div(class="pen-container")
        svg-icon(iconName="pen"
                iconWidth="13px"
                iconColor="gray-3")
    div(v-else class="design-item__name__container")
      svg-icon(v-if="isNameMouseOver"
              iconName="pen"
              iconWidth="13px"
              iconColor="gray-3"
              style="color: transparent")
      span(:title="config.name") {{ config.name }}
      svg-icon(v-if="isNameMouseOver"
              iconName="pen"
              iconWidth="13px"
              iconColor="gray-3")
  div(class="design-item__size")
    span {{ `${config.width}x${config.height}` }}
  div(class="dragged-thumbnail" :style="draggedImageContainerStyles()")
    div(class="relative")
      img(:src="appliedUrl" :style="draggedImageStyles()")
      div(v-if="isMultiSelected && isSelected" class="dragged-thumbnail__stack" :style="draggedImageStackStyles()")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import vClickOutside from 'v-click-outside'
import imageUtils from '@/utils/imageUtils'
import designUtils from '@/utils/designUtils'
import { IDesign } from '@/interfaces/design'

export default defineComponent({
  components: {
    ImageCarousel
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    menuItemNum: {
      type: Number,
      required: true
    },
    favorable: {
      type: Boolean,
      required: true
    },
    undraggable: {
      type: Boolean,
      required: true
    },
    nameIneditable: {
      type: Boolean,
      required: true
    },
    unenterable: {
      type: Boolean,
      required: true
    },
    isAnySelected: {
      type: Boolean,
      required: true
    },
    isSelected: {
      type: Boolean,
      required: true
    },
    isMultiSelected: {
      type: Boolean,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      isDragged: false,
      isMouseOver: false,
      isNameMouseOver: false,
      isNameEditing: false,
      isMenuOpen: false,
      editableName: '',
      draggedImageCoordinate: { x: 0, y: 0 },
      imgWidth: 150,
      imgHeight: 150,
      previewCheckReady: false,
      previewPlaceholder: require('@/assets/img/svg/loading-large.svg'),
      showCarousel: false,
      carouselIdx: 0,
      waitTimer: 0,
      renderedWidth: 150,
      renderedHeight: 150,
      pageImages: [] as string[]
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  created() {
    this.checkImageSize()
  },
  watch: {
    'config.asset_index': {
      handler: function () {
        this.$nextTick(() => {
          this.isDragged = false
          this.checkImageSize()
        })
      }
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders'
    }),
    menuItems(): any[] {
      return Array(this.menuItemNum ?? 0)
    },
    configPreview(): string {
      return designUtils.getDesignPreview(this.config.id, 2, this.config.ver, this.config.signedUrl)
    },
    appliedUrl(): string {
      return this.config.thumbnail !== '' ? this.config.thumbnail : this.previewPlaceholder
    },
    isTempDesign(): boolean {
      return (this.config.id ?? '').endsWith('_new')
    },
    isThumbnailFound(): boolean {
      return this.config.thumbnail !== this.previewPlaceholder
    }
  },
  methods: {
    ...mapMutations('design', {
      setDraggingDesign: 'SET_draggingDesign'
    }),
    blockStyles() {
      return (this.isMouseOver || this.isSelected) ? { 'background-color': '#474a5780' } : {}
    },
    imageStyles() {
      return { width: `${this.renderedWidth}px`, height: `${this.renderedHeight}px` }
    },
    draggedImageContainerStyles(): { [key: string]: string } {
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
    draggedImageStyles(): { [key: string]: string } {
      if (this.isDragged && this.config.thumbnail === this.previewPlaceholder) {
        return {
          width: '300px',
          height: '300px'
        }
      } else {
        return {}
      }
    },
    draggedImageStackStyles(): { [key: string]: string } {
      if (this.isDragged) {
        return {
          width: `${this.imgWidth}px`,
          height: `${this.imgHeight}px`
        }
      } else {
        return {}
      }
    },
    handleDragStart(e: DragEvent) {
      const target = e.target as HTMLElement
      target.style.opacity = '0'
      this.setDraggingDesign(this.config)

      if (!e.dataTransfer) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'

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
      this.setDraggingDesign(undefined)
      document.removeEventListener('dragover', this.preventDefaultDragOver, false)
    },
    preventDefaultDragOver(e: DragEvent) {
      e.preventDefault()
    },
    handleMouseEnter() {
      if (this.isTempDesign) return
      const thumbnailElement = this.$refs.thumbnail as HTMLImageElement
      if (!thumbnailElement) return
      this.isMouseOver = true
      if (this.config.pageNum === 1) return
      this.waitTimer = setTimeout(() => {
        if (this.isMouseOver) {
          this.showCarousel = true
          this.renderedWidth = thumbnailElement.width
          this.renderedHeight = thumbnailElement.height
          if (this.config.polling) {
            this.multiPollingStep()
          }
        }
      }, 100)
    },
    handleMouseLeave() {
      this.isMouseOver = false
      this.isMenuOpen = false
      this.showCarousel = false
      window.clearInterval(this.waitTimer)
    },
    handleNameMouseEnter() {
      if (this.nameIneditable) return
      this.isNameMouseOver = true
    },
    handleNameMouseLeave() {
      if (this.nameIneditable) return
      this.isNameMouseOver = false
    },
    handleNameClick() {
      if (this.nameIneditable) return
      this.editableName = this.config.name
      this.isNameEditing = true
      this.$nextTick(() => {
        const nameInput = this.$refs.name as HTMLInputElement
        nameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      this.isNameMouseOver = false
      if (this.editableName === '' || this.editableName === this.config.name) return
      designUtils.setDesignName(this.config as IDesign, this.editableName)
    },
    handleClick(e: MouseEvent) {
      if (this.isAnySelected) {
        if (e.shiftKey) {
          this.$emit('metaSelect')
          return
        }
        this.$emit(this.isSelected ? 'deselect' : 'select')
        return
      }
      if (this.unenterable && this.isTempDesign) return
      designUtils.setDesign(this.config as IDesign)
    },
    handleCarouselIdx(idx: number) {
      this.carouselIdx = idx
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.config.name) {
        this.handleNameEditEnd()
      }
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      this.isMenuOpen = false
    },
    emitLike() {
      this.$emit('like')
    },
    emitSelect(e: MouseEvent) {
      if (e.shiftKey) {
        this.$emit('metaSelect')
        return
      }
      this.$emit('select')
    },
    emitDeselect(e: MouseEvent) {
      if (e.shiftKey) {
        this.$emit('metaSelect')
        return
      }
      this.$emit('deselect')
    },
    checkImageSize() {
      this.previewCheckReady = false
      if (this.config.polling) {
        this.pageImages = Array(this.config.pageNum).fill(this.previewPlaceholder)
        this.previewCheckReady = true
        this.config.thumbnail = this.previewPlaceholder
        this.pollingStep()
      } else {
        if (this.isTempDesign) return
        this.pageImages = designUtils.getDesignPreviews(this.config.pageNum, this.config.id, 2, this.config.ver, this.config.signedUrl)
        imageUtils.getImageSize(this.configPreview, this.imgWidth, this.imgHeight, false).then((size) => {
          const { width, height, exists } = size
          this.imgWidth = width
          this.imgHeight = height
          this.previewCheckReady = true
          this.config.thumbnail = exists ? this.configPreview : this.previewPlaceholder
        })
      }
    },
    pollingStep(step = 0) {
      const timeout = step > 14 ? 2000 : 1000
      imageUtils.getImageSize(
        designUtils.getDesignPreview(
          this.config.id, 2,
          undefined,
          this.config.signedUrl
        ),
        this.imgWidth, this.imgHeight, false
      ).then((size) => {
        const { width, height, exists } = size
        this.imgWidth = width
        this.imgHeight = height
        if (exists) {
          this.config.thumbnail = this.configPreview
        } else if (step < 35) {
          setTimeout(() => {
            this.pollingStep(step + 1)
          }, timeout)
        }
      })
    },
    multiPollingStep() {
      for (let i = 0; i < this.config.pageNum; i++) {
        this.pagePollingStep(i)
      }
    },
    pagePollingStep(index: number, step = 0) {
      if (this.pageImages[index] !== this.previewPlaceholder) return
      const timeout = step > 14 ? 2000 : 1000
      imageUtils.getImageSize(designUtils.getDesignPreview(this.config.id, 2, undefined, this.config.signedUrl, index), 0, 0, false).then((size) => {
        if (size.exists) {
          this.pageImages[index] = designUtils.getDesignPreview(this.config.id, 2, this.config.ver, this.config.signedUrl, index)
        } else if (step < 35) {
          setTimeout(() => {
            this.pagePollingStep(index, step + 1)
          }, timeout)
        }
      })
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
    padding: 26px;
  }
  &__thumbnail {
    object-fit: contain;
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
  &__index {
    background-color: white;
    border-radius: 100px;
    position: absolute;
    padding: 0px 10px;
    bottom: 6px;
    right: 8px;
    text-align: center;
    min-width: 50px;
    box-sizing: border-box;
    @include body-XS;
    line-height: unset;
  }
  &__checkbox {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    left: 10px;
    top: 12px;
    border: 1px solid #969bab;
    box-sizing: border-box;
    cursor: pointer;
  }
  &__checkbox-checked {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: setColor(blue-1);
    left: 10px;
    top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  &__more {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    right: 8px;
    top: 8px;
    cursor: pointer;
  }
  &__menu {
    position: absolute;
    min-width: 108px;
    box-sizing: border-box;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: white;
    box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
    right: 8px;
    top: 35px;
    & .design-menu-item {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: start;
      gap: 5px;
      padding: 8px 0;
      cursor: pointer;
      &:hover {
        background-color: setColor(gray-5);
      }
      &__icon {
        margin-left: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 10px;
        height: 10px;
      }
      &__text {
        display: flex;
        align-items: center;
        justify-content: start;
        height: 12px;
        margin-right: 20px;
        > span {
          font-weight: 400;
          font-size: 12px;
          line-height: 12px;
          color: setColor(gray-2);
          white-space: nowrap;
        }
      }
      &__right {
        position: absolute;
        right: 3px;
        top: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-50%);
      }
    }
  }
  &__favorite {
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
    &__container {
      width: 100%;
      height: 28px;
      padding: 4px 0px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      gap: 5px;
      border: none;
      &:hover {
        border-top: 1px dashed transparent;
        border-bottom: 1px dashed setColor(gray-4);
      }
      > span {
        font-size: 16px;
        font-weight: 400;
        color: setColor(gray-1);
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
        overflow: hidden;
      }
      &-editor {
        border-top: 1px dashed transparent;
        border-bottom: 1px dashed setColor(gray-4);
        > input {
          padding: 0;
          height: 20px;
          font-size: 16px;
          font-weight: 400;
          color: setColor(gray-1);
        }
      }
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
      font-size: 12px;
      font-weight: 400;
      color: setColor(gray-3);
    }
  }
}

.pen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
}

.dragged-thumbnail {
  display: none;
  position: fixed;
  transform: translate(-50%, -50%) scale(0.25);
  pointer-events: none;
  z-index: 1000;
  > div {
    background-color: white;
    > img {
      border-radius: 10px;
      display: block;
    }
  }
  &__stack {
    position: absolute;
    top: 20px;
    left: 20px;
    background-color: setColor(gray-3);
    border-radius: 10px;
    z-index: -1;
  }
}
</style>
