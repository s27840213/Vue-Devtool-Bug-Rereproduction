<template lang="pug">
div(class="download-type-option__name")
  span {{ name }}
  span(v-if="tag"
    class="download-type-option__tag")
    span(class="download-type-option__label") {{ tag }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    name: {
      type: String,
      required: true
    },
    tag: {
      type: String,
      required: true
    }
  }
})
</script>

<style lang="scss" scoped>
.download-type-option {
  &__name {
    font-size: 12px;
    color: setColor(gray-2);
    display: flex;
    align-items: center;
  }
  &__tag {
    padding: 1px;
    background: setColor(blue-1);
    color: setColor(white);
    border-radius: 5px;
    height: 12px;
    display: inline-flex;
    margin-left: 5px;
    justify-content: center;
    align-items: center;
  }
  &__label {
    font-size: 15px;
    transform: scale(0.625);
  }
}
</style>
