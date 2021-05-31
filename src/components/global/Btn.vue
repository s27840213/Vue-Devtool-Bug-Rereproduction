<template lang="pug">
  button(class="btn" :class="`btn-${type}`")
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
    }
  }
})
</script>

<style lang="scss" scoped>
.btn {
}
</style>
