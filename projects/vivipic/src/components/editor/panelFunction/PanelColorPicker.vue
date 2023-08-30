<template lang="pug">
div(class="color-picker")
  span(class="color-picker__title text-blue-1 label-lg") Color Picker
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: []
})
</script>

<style lang="scss" scoped>
.page-setting {
  @include size(100%, 100%);
  text-align: center;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
}
</style>
