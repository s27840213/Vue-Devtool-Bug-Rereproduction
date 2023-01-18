<template lang="pug">
div(class="download-type-option__name")
  span {{ name }}
  span(v-if="tag"
    class="download-type-option__tag")
    svg-icon(v-if="tag==='pro'" class="download-type-option__tag__pro" iconName="pro" iconWidth="20px" iconColor="alarm")
    span(v-else class="download-type-option__label") {{ tag }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  props: {
    name: {
      type: String,
      required: true
    },
    tag: {
      type: String,
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
    &__pro {
      padding: 0px 2px;
    }
  }
  &__label {
    font-size: 15px;
    transform: scale(0.625);
  }
}
</style>
