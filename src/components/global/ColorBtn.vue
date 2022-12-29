<template lang="pug">
div(class="color-btn")
  div(class="color-btn__wrapper" :class="{active: active || focus}"
      @click="selectColor(color)")
    div(v-if="color === 'add'" class="color-btn__add-color"
        @click="add")
    div(v-else class="color-btn__color" :style="{backgroundColor: color}")
    svg-icon(v-if="focus" iconName="item-check" iconWidth="40%")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ColorBtn',
  props: {
    color: {
      type: String,
      required: true
    },
    active: {
      type: Boolean
    },
    focus: {
      type: Boolean
    }
  },
  methods: {
    add(event: Event) {
      this.$emit('click', event)
    },
    selectColor(color: string) {
      this.$emit('click', color)
    }
  }
})
</script>

<style lang="scss" scoped>
.color-btn { // Keep aspect ratio, https://stackoverflow.com/a/6615994
  width: 100%;
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
  &__color {
    box-sizing: border-box;
    height: 100%;
    border-radius: 4px;
    border: 1px solid setColor(gray-0, 0.2);
  }
  &__wrapper {
    &.focus, &.active, &:hover {
      padding: 1px;
      & > .color-btn__color, & > .color-btn__add-color {
        border-radius: 2px;
        border: none;
      }
    }
    &.focus, &.active {
      border: 2px solid setColor(blue-1);
    }
    &:hover {
      border: 2px solid setColor(blue-hover);
    }
    > svg {
      position: absolute;
      right: -11%;
      bottom: -11%;
    }
  }
}
</style>
