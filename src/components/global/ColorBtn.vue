<template lang="pug">
div(class="color-btn" :style="wrapperStyle")
  div(class="color-btn__wrapper" :class="{active: active || focus, mobile: $isTouchDevice()}")
    div(v-if="color === 'add'" class="color-btn__add-color")
    div(v-else-if="color === 'multi'" class="color-btn__multi-color")
    div(v-else :style="{backgroundColor: color}"
        :class="`color-btn__color color-${color.replace('#', '')}`")
    svg-icon(v-if="focus" iconName="item-check" iconWidth="40%")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ColorBtn',
  props: {
    color: {
      type: String,
      required: true
    },
    size: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean
    },
    focus: {
      type: Boolean
    }
  },
  computed: {
    wrapperStyle() {
      return this.size ? {
        width: this.size,
        height: this.size,
        paddingTop: 0
      } : {}
    },
  }
})
</script>

<style lang="scss" scoped>
.color-btn { // Keep aspect ratio, https://stackoverflow.com/a/6615994
  width: 100%;
  height: 0;
  padding-top: 100%;
  display: inline-block;
  position: relative;
  cursor: pointer;

  &__wrapper {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 4px;
  }
  &__add-color {
    height: 100%;
    background-image: url("~@/assets/img/svg/addColor.svg");
    background-size: cover;
  }
  &__multi-color {
    height: 100%;
    background-image: url("~@/assets/img/jpg/multi-color.jpg");
    background-size: cover;
    border-radius: 4px;
  }
  &__color {
    box-sizing: border-box;
    height: 100%;
    border-radius: 4px;
    border: 1px solid setColor(gray-0, 0.2);
  }
  &__wrapper {
    &.focus, &.active, &:not(.mobile):hover {
      padding: 1px;
      & > .color-btn__color, & > .color-btn__add-color {
        border-radius: 2px;
        border: none;
      }
    }
    &.focus, &.active {
      border: 2px solid setColor(blue-1);
    }
    &:not(.mobile):hover {
      border: 2px solid setColor(blue-hover);
    }
    > svg {
      position: absolute;
      right: -11%;
      bottom: -11%;
    }
    transition: border 0.2s ease-in-out;
  }
}
</style>
