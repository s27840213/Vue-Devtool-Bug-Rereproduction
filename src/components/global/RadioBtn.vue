<template lang="pug">
  div(class="radio-btn relative pointer"
    @click="select"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)")
    svg-icon(v-if="isSelected" class="radio-btn__svg" iconName="radio-checked" iconWidth="12px" iconColor="blue-1")
    svg-icon(v-else class="radio-btn__svg" iconName="radio" iconWidth="12px" iconColor="white")
    div(v-if="isHovered" class="radio-btn__hover-effect")
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    isSelected: Boolean,
    formatKey: String
  },
  data() {
    return {
      isHovered: false
    }
  },
  methods: {
    setHovered(hovered: boolean) {
      this.isHovered = hovered
    },
    select() {
      this.$emit('select', this.formatKey)
    }
  },
  computed: {
  }
})
</script>

<style lang="scss" scoped>
.radio-btn {
  &__hover-effect {
    position: absolute;
    top: 0;
    left: -6px;
    width: 24px;
    height: 24px;
    background: radial-gradient(50% 50% at 50% 50%, rgba(78, 171, 230, 0.5) 45.83%, rgba(78, 171, 230, 0) 90.1%);
  }
}
</style>
