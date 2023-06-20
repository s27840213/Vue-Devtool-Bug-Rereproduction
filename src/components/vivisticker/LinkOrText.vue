<template lang="pug">
span(v-if="url !== ''" class="link-or-text__link-emoji" @click.stop="openUrl") {{ "🔗 " }}
span(:class="{'link-or-text__link-text': url !== ''}" @click.stop="openUrl") {{ title }}
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: () => '',
  }
})

const openUrl = () => {
  if (props.url === '') return
  window.open(props.url, '_blank')
}
</script>

<style lang="scss" scoped>
.link-or-text {
  &__link-emoji {
    font-family: -apple-system;
    font-size: small;
    vertical-align: top;
  }

  &__link-text {
    text-decoration: underline;
  }
}
</style>
