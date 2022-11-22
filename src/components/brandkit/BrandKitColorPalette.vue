<template lang="pug">
div(class="brand-kit-color-palette")
  div(class="brand-kit-color-palette__header")
    div(class="brand-kit-color-palette__name")
      input(v-if="isNameEditing"
        ref="paletteName"
        v-model="editableName"
        v-click-outside="handleNameEditEnd"
        @change="handleNameEditEnd"
        @keyup="checkNameEnter")
      span(v-else
        :title="paletteName"
        @click="handleNameClick") {{ paletteName }}
    div(class="brand-kit-color-palette__right")
      div(class="brand-kit-color-palette__trash pointer"
          @click="handleDeletePalette(colorPalette)")
        svg-icon(iconName="trash" iconWidth="16px" iconColor="gray-2")
  transition-group(class="brand-kit-color-palette__colors" name="color-list" tag="div")
    template(v-for="(color, index) in colors")
      div(v-if="color === 'add'"
        class="brand-kit-color-palette__colors__color-wrapper pointer"
        key="default"
        @click="handleAddColor(colorPalette.id)")
        div(class="brand-kit-color-palette__colors__color-add")
          svg-icon(iconName="plus-origin" iconWidth="16px" iconColor="gray-3")
      div(v-else
        class="brand-kit-color-palette__colors__color-wrapper"
        :class="{ selected: checkSelected(colorPalette.id, color) }"
        :key="color.id")
        div(class="brand-kit-color-palette__colors__color pointer"
          :style="backgroundColorStyles(color.color)"
          @click="handleSelectColor(colorPalette.id, color)")
        div(class="brand-kit-color-palette__colors__color-close pointer"
          :class="{ selected: checkSelected(colorPalette.id, color) }"
          @click.stop="handleDeleteColor(colorPalette.id, color)")
          svg-icon(iconName="close" iconWidth="16px" iconColor="gray-2")
        color-picker(v-if="checkSelected(colorPalette.id, color)"
                    class="color-picker"
                    v-click-outside="handleDeSelectColor"
                    :currentColor="color.color"
                    @update="handleDragUpdate"
                    @final="handleColorChangeEnd")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import vClickOutside from 'v-click-outside'
import { IBrandColor, IBrandColorPalette } from '@/interfaces/brandkit'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  data() {
    return {
      isNameEditing: false,
      editableName: '',
      colorBuffer: '#000000'
    }
  },
  props: {
    colorPalette: Object,
    selectedColor: Object
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    ColorPicker
  },
  computed: {
    paletteName(): string {
      return this.getDisplayedPaletteName(this.colorPalette)
    },
    colors(): (IBrandColor | string)[] {
      return [...this.colorPalette.colors, 'add']
    }
  },
  methods: {
    backgroundColorStyles(color: string) {
      return { backgroundColor: color }
    },
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return brandkitUtils.getDisplayedPaletteName(colorPalette)
    },
    checkSelected(paletteId: string, color: IBrandColor): boolean {
      return this.selectedColor.paletteId === paletteId && this.selectedColor.colorId === color.id
    },
    handleDeletePalette(palette: IBrandColorPalette) {
      this.colorBuffer = '#000000'
      this.$emit('deleteItem', {
        type: 'palette',
        content: palette
      })
    },
    handleSelectColor(paletteId: string, color: IBrandColor) {
      if (this.checkSelected(paletteId, color)) {
        this.handleDeSelectColor()
      } else {
        this.colorBuffer = color.color
        this.$emit('selectColor', {
          paletteId,
          colorId: color.id
        })
      }
    },
    handleDeSelectColor() {
      this.$emit('selectColor', {
        paletteId: '',
        colorId: ''
      })
    },
    handleDeleteColor(paletteId: string, color: IBrandColor) {
      this.handleDeSelectColor()
      brandkitUtils.removeColor(paletteId, color)
    },
    handleDragUpdate(color: string) {
      brandkitUtils.updateColorTemp(this.selectedColor.paletteId, this.selectedColor.colorId, color)
    },
    handleColorChangeEnd(color: string) {
      const currentSelectedColor = generalUtils.deepCopy(this.selectedColor)
      const backupColor = this.colorBuffer
      brandkitUtils.updateColor(this.selectedColor.colorId, color).then((success) => {
        if (success) {
          if (this.selectedColor.colorId === currentSelectedColor.colorId && this.selectedColor.paletteId === currentSelectedColor.paletteId) {
            this.colorBuffer = color
          }
        } else {
          if (this.selectedColor.colorId === currentSelectedColor.colorId && this.selectedColor.paletteId === currentSelectedColor.paletteId) {
            this.handleDeSelectColor()
          }
          brandkitUtils.updateColorTemp(currentSelectedColor.paletteId, currentSelectedColor.colorId, backupColor)
        }
      })
    },
    handleAddColor(id: string) {
      brandkitUtils.createColor(id)
      this.$nextTick(() => {
        this.$emit('selectColor', {
          paletteId: id,
          colorId: this.colorPalette.colors[this.colorPalette.colors.length - 1].id
        })
      })
    },
    handleNameClick() {
      this.editableName = this.paletteName
      this.isNameEditing = true
      this.$nextTick(() => {
        const brandNameInput = this.$refs.paletteName as HTMLInputElement
        brandNameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.editableName === '' || this.editableName === this.paletteName) return
      // this.checkNameLength()
      brandkitUtils.setPaletteName(this.colorPalette, this.editableName)
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.paletteName) {
        this.handleNameEditEnd()
      }
      // this.checkNameLength()
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-color-palette {
  border: 1px solid setColor(gray-3);
  box-sizing: border-box;
  border-radius: 4px;
  padding: 10px;
  &__header {
    display: flex;
    justify-content: space-between;
  }
  &__name {
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: start;
    color: setColor(gray-1);
    width: 300px;
    & > span {
      @include body-MD;
      cursor: text;
      line-height: 24px;
      height: 24px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    & > input {
      height: 24px;
      padding: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      font-family: inherit;
      color: inherit;
    }
  }
  &__right {
    margin-right: 4px;
    display: flex;
    gap: 10px;
  }
  &__colors {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 20px 10px;
    &__color-wrapper {
      position: relative;
      width: 100%;
      padding-top: 100%;
      box-sizing: border-box;
      border-radius: 10%;
      &:hover {
        border-color: white;
        & > .brand-kit-color-palette__colors__color-close {
          display: flex;
        }
      }
      &.selected {
        padding-top: calc(100% - 2px);
        border: 1px solid setColor(blue-1);
      }
    }
    &__color-add {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      box-sizing: border-box;
      border-radius: 10%;
      border: 1px solid setColor(gray-3);
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        background-color: setColor(blue-4);
      }
    }
    &__color {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border: 2px solid setColor(gray-7);
      box-sizing: border-box;
      border-radius: 10%;
      &-close {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: white;
        box-shadow: 0px 0px 4px rgba(60, 60, 60, 0.2);
        display: none;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        transform-origin: top right;
        &.selected {
          display: flex;
          transform: scale(0.75);
        }
      }
    }
  }
}

.color-picker {
  position: absolute;
  left: 0;
  top: calc(100% + 5px);
  z-index: 10;
}

.color-list {
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
    z-index: 10;
    padding-top: calc(100% - 2px);
  }

  &-enter,
  &-leave-to {
    transform: translateY(-20px);
    opacity: 0;
  }
}
</style>
