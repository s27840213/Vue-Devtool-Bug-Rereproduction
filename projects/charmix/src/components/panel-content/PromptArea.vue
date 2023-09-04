<template lang="pug">
div(class="flex flex-col justify-center items-center w-full px-24")
  div(class="flex justify-between items-center mb-20 w-full")
    back-btn
    span(class="text-app-tab-default typo-btn-lg") {{ $t('CM0022') }}
    nu-btn(
      theme="primary"
      size="md"
      @click="handleGenerate") {{ $t('CM0023') }}
  div(class="w-full relative")
    textarea(
      class="w-full p-10 rounded-[10px] bg-primary-light-active typo-body-sm h-112"
      :placeholder="$t('CM0024')"
      autofocus
      v-model="promptText")
    transition(name="fade-right-in-out")
      div(
        v-if="promptLen > 0"
        class="absolute bottom-10 right-10 text-app-text-primary typo-body-sm"
        @click="clearPromt")
        span {{ $t('CM0029') }}
</template>
<script setup lang="ts">
const promptText = ref('')
const promptLen = computed(() => promptText.value.length)
const handleGenerate = () => {
  console.log('generate')
}
const clearPromt = () => {
  promptText.value = ''
}
</script>
<style lang="scss"></style>
