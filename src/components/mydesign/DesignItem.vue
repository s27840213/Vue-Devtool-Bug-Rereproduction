<template lang="pug">
  div(class="design-item")
    div(class="design-item__block pointer"
      :style="blockStyles()"
      :draggable="!undraggable"
      @dragstart="handleDragStart"
      @drag="handleDragging"
      @dragend="handleDragEnd"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave")
      div(class="design-item__img-container"
        :style="containerStyles()")
        img(v-if="previewCheckReady"
            class="design-item__thumbnail"
            :style="imageStyles()"
            draggable="false"
            :src="appliedUrl")
      div(class="design-item__controller")
        div(class="design-item__controller-content")
          div(v-if="isSelected"
            class="design-item__checkbox-checked"
            @click="emitDeselect")
            svg-icon(iconName="check-large"
                    iconWidth="10px"
                    iconHeight="8px"
                    iconColor="white")
          div(v-if="!isSelected && (isMouseOver || isAnySelected)"
            class="design-item__checkbox"
            @click="emitSelect")
          div(v-if="isMouseOver"
            class="design-item__more"
            @click="toggleMenu()")
            svg-icon(iconName="more_horizontal"
                    iconWidth="24px"
                    iconColor="gray-2")
          div(v-if="menuItems.length > 0 && isMenuOpen && isMouseOver"
              class="design-item__menu"
              v-click-outside="closeMenu")
            slot(v-for="(dummy, index) in menuItems" :name="`i${index}`") {{ index }}
          div(v-if="favorable" class="design-item__favorite" @click="emitLike")
            svg-icon(v-if="isMouseOver && !isInFavorites"
                    iconName="favorites"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="isMouseOver && isInFavorites"
                    iconName="favorites-fill"
                    iconWidth="20px"
                    iconColor="white")
            svg-icon(v-if="!isMouseOver && isInFavorites"
                    iconName="favorites-fill"
                    iconWidth="20px"
                    iconColor="gray-4")
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
        span {{ config.name }}
        svg-icon(v-if="isNameMouseOver"
                iconName="pen"
                iconWidth="13px"
                iconColor="gray-3")
    div(class="design-item__size")
      span {{ `${config.width}x${config.height}` }}
    div(class="dragged-thumbnail" :style="draggedImageStyles()")
      div(class="relative")
        img(:src="appliedUrl")
        div(v-if="isMultiSelected && isSelected" class="dragged-thumbnail__stack" :style="draggedImageStackStyles()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import imageUtils from '@/utils/imageUtils'
import vClickOutside from 'v-click-outside'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  props: {
    path: Array,
    config: Object,
    menuItemNum: Number,
    favorable: Boolean,
    undraggable: Boolean,
    nameIneditable: Boolean,
    isInFavorites: Boolean,
    isAnySelected: Boolean,
    isSelected: Boolean,
    isMultiSelected: Boolean
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
      imgWidth: 10,
      imgHeight: 10,
      previewCheckReady: false,
      previewPlaceholder: require('@/assets/img/svg/image-preview.svg')
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  created() {
    this.checkImageSize()
  },
  watch: {
    config: {
      handler: function() {
        this.$nextTick(() => {
          this.isDragged = false
          this.checkImageSize()
        })
      },
      deep: true
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders'
    }),
    menuItems(): any[] {
      return Array(this.menuItemNum ?? 0)
    },
    aspectRatio(): number {
      return this.config.width / this.config.height
    },
    configPreview(): string {
      return designUtils.getDesignPreview(this.config.id, 1, this.config.ver)
    },
    appliedUrl(): string {
      return this.config.thumbnail !== '' ? this.config.thumbnail : this.previewPlaceholder
    }
  },
  methods: {
    ...mapMutations('design', {
      setDraggingDesign: 'SET_draggingDesign',
      setDesignName: 'UPDATE_designName'
    }),
    blockStyles() {
      return (this.isMouseOver || this.isSelected) ? { 'background-color': '#474a5780' } : {}
    },
    containerStyles() {
      return (this.aspectRatio < 1.2 && this.aspectRatio > 0.83) ? { padding: '26px' } : { padding: '17px' }
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
    draggedImageStyles(): { [key: string]: string } {
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
      this.setDraggingDesign({
        path: this.path,
        design: this.config
      })

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
      this.isMouseOver = true
    },
    handleMouseLeave() {
      this.isMouseOver = false
      this.isMenuOpen = false
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
      this.setDesignName({
        path: this.path,
        id: this.config.id,
        newDesignName: this.editableName
      })
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter') {
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
    emitSelect() {
      this.$emit('select')
    },
    emitDeselect() {
      this.$emit('deselect')
    },
    checkImageSize() {
      if (this.config.thumbnail !== '') {
        this.previewCheckReady = true
        return
      }
      this.previewCheckReady = false
      imageUtils.getImageSize(this.configPreview, 80, 80).then((size) => {
        const { width, height, exists } = size
        this.imgWidth = width
        this.imgHeight = height
        this.previewCheckReady = true
        this.config.thumbnail = exists ? this.configPreview : this.previewPlaceholder
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
    width: 108px;
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
        > span {
          font-family: NotoSansTC;
          font-weight: 400;
          font-size: 12px;
          line-height: 12px;
          color: setColor(gray-2);
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
        height: 20px;
        font-family: Mulish;
        font-size: 16px;
        font-weight: 400;
        color: setColor(gray-1);
      }
      &-editor {
        border-top: 1px dashed transparent;
        border-bottom: 1px dashed setColor(gray-4);
        > input {
          padding: 0;
          height: 20px;
          font-family: Mulish;
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
      font-family: Mulish;
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
  transform: translate(-50%, -50%) scale(0.5);
  pointer-events: none;
  z-index: 1000;
  > div {
    background-color: white;
    > img {
      display: block;
    }
  }
  &__stack {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: setColor(gray-3);
    z-index: -1;
  }
}
</style>
