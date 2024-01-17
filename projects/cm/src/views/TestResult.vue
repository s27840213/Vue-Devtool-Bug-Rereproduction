<template lang="pug">
div(class="w-full h-full grid-cols-1 grid-rows-[auto,1fr] gap-16]")
  headerbar(class="box-border px-24")
    template(#left)
      back-btn
    template(#middle)
      div
    template(#right)
      div
  div(class="flex-center w-full h-full")
    img(:src="currGeneratedResult?.url" class="w-240")
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()
const { currGeneratedResult } = storeToRefs(editorStore)
</script>
<style scoped lang="scss"></style>
