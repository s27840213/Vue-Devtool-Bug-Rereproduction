<template lang="pug">
  button(class="btn" :class="`btn-${buttonType}`" :disabled="disabled")
    svg-icon(v-if="hasIcon"
      class="btn__icon"
      :iconName="iconName"
      :iconColor="iconColor"
      :iconWidth="iconWidth")
    span(class="btn__text")
      slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
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
    hasIcon: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buttonType(): string {
      const size = this.type.split('-')[1]
      return this.disabled ? `inactive-${size}` : this.type
    }
  }
})
</script>

<style lang="scss" scoped>
.btn {
  transition: background-color 0.2s ease-out;
}
</style>
