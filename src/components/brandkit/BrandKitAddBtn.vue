<template lang="pug">
div(class="brand-kit-add-btn pointer")
  svg-icon(iconName="plus-origin"
          iconWidth="16px"
          iconColor="gray-1")
  span(class="brand-kit-add-btn__text") {{ text }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-add-btn {
  border: 1px solid setColor(gray-3);
  box-sizing: border-box;
  border-radius: 4px;
  display: flex;
  align-items: center;
  width: fit-content;
  height: 43px;
  padding: 20px;
  gap: 12px;
  &:hover {
    background-color: setColor(blue-4);
  }
  &__text {
    @include body-MD;
    line-height: 16px;
  }
}
</style>
