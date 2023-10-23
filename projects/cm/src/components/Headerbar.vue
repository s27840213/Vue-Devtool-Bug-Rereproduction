<template lang="pug">
div(class="bg-app-bg py-12 grid grid-rows-1 grid-cols-3" :class="hide ? 'invisible pointer-events-none' : ''")
  div(class="flex justify-start items-center")
    slot(name="left")
  div(class="flex justify-center items-center")
    slot(name="middle")
  div(class="flex justify-end items-center")
    slot(name="right")
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    hide?: boolean
  }>(),
  {
    hide: false,
  },
)
</script>
<style lang="scss"></style>
