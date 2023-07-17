<template lang="pug">
span(class="collapse-title" :class="{selected}")
  slot
  svg-icon(iconName="chevron-down" iconColor="gray-2" iconWidth="24px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CollapseTitle',
  props: {
    selected: {
      type: Boolean,
      required: true,
    }
  },
})
</script>

<style lang="scss" scoped>
.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  .svg-chevron-down {
    transition: all 0.5s ease-in-out;
  }
  &.selected .svg-chevron-down {
    transform: scaleY(-1);
  }
}
</style>
