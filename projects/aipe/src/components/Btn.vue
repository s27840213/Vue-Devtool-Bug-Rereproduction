<template lang="pug">
button(class="btn"
    :class="`btn-${squared ? 'squared-' : ''}${buttonType}`"
    :style="btnStyles"
    :disabled="disabled")
  svg-icon(v-if="hasIcon"
    class="btn__icon"
    :style="flexDir === 'row' ? `margin-right: ${iconMargin}px` : `margin-bottom: ${iconMargin}px`"
    :iconName="iconName"
    :iconColor="iconColor"
    :iconWidth="iconWidth")
  span(class="btn__text")
    slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const component = defineComponent({
  emits: [],
  name: 'Btn',
  components: {},
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
    },
    flexDir: {
      type: String as PropType<'row' | 'column'>,
      default: 'row'
    }
  },
  mounted() {
    if (this.squared) {
      ;(this.$el as HTMLElement).style.padding = (this.$el as HTMLElement).style.paddingTop
    }
  },
  computed: {
    buttonType(): string {
      const size = this.type.split('-')[1]
      return this.disabled ? `inactive-${size}` : this.type
    },
    btnStyles(): { [index: string]: string } {
      return {
        display: 'flex',
        'flex-direction': this.flexDir
      }
    }
  }
})
export default component
</script>

<style lang="scss" scoped>
.btn {
  box-sizing: border-box;
  transition:
    background-color 0.2s ease-out,
    border-color 0.2s ease-out;
  &__text {
    white-space: nowrap;
  }
}
</style>
