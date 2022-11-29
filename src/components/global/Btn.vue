<template lang="pug">
button(class="btn"
    :class="`btn-${squared ? 'squared-' : ''}${buttonType}`"
    :disabled="disabled" ref="btn")
  svg-icon(v-if="hasIcon"
    class="btn__icon"
    :style="`margin-right: ${iconMargin}px`"
    :iconName="iconName"
    :iconColor="iconColor"
    :iconWidth="iconWidth")
  span(class="btn__text")
    slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Btn',
  components: {
  },
  props: {
    type: {
      type: String,
      default: 'primary-mid'
    },
    iconName: {
      type: String,
      default: 'menu'
    },
    iconColor: {
      type: String,
      default: '#fff'
    },
    iconWidth: {
      type: String,
      default: '15px'
    },
    iconMargin: {
      type: Number,
      default: 0
    },
    hasIcon: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    squared: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    if (this.squared) {
      (this.$el as HTMLElement).style.padding = (this.$el as HTMLElement).style.paddingTop
    }
  },
  computed: {
    squaredPaddingClass(): string {
      return this.squared ? `btn-squared-${this.type.split('-')[1]}` : ''
    },
    buttonType(): string {
      const size = this.type.split('-')[1]
      return this.disabled ? `inactive-${size}` : this.type
    }
  }
})
</script>

<style lang="scss" scoped>
.btn {
  transition: background-color 0.2s ease-out, border-color 0.2s ease-out;
  &__text {
    white-space: nowrap;
  }
}
</style>
