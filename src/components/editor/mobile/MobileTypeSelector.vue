<template lang="pug">
div(class="mobile-type-selector flex flex-between items-center py-5")
  div(class="full-width flex flex-between items-center")
    span(:class="`${textColor} ${textSize}`") {{ title }}
    span(class="text-gray-3 mr-10" :class="textSize") {{ description }}
  svg-icon(:iconName="iconName"
    iconWidth="18px"
    iconColor="gray-2")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    iconName: {
      type: String,
      default: 'chevron-right'
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    textColor: {
      type: String,
      default: 'text-gray-1'
    },
    textSize: {
      type: String,
      default: 'body-MD'
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
