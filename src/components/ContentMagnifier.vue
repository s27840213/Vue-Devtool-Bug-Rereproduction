<template lang="pug">
</template>
<!-- <template lang="pug">
div(class="content-modifier" :style="modifierStyles" ref="modifier")
  div(class="magnifier-content")
</template>

<script lang="ts" setup>
import mouseUtils from '@/utils/mouseUtils'
import { computed, onMounted, reactive, Ref, ref } from 'vue'

const modifier:Ref<HTMLElement|null> = ref(null)
const props = defineProps({
  editorView: {
    type: HTMLElement,
    required: true
  }
})

const modifierData = reactive({
  x: 0,
  y: 0,
  width: 80,
  height: 80,
})

const modifierStyles = computed(() => {
  return {
    width: `${modifierData.width}px`,
    height: `${modifierData.height}px`,
    transform: `translate(${modifierData.x}px, ${modifierData.y}px)`
  }
})
onMounted(() => {
  window.addEventListener('pointermove', (event: PointerEvent) => {
    const pos = mouseUtils.getMouseRelPoint(event, props.editorView)
    modifierData.x = pos.x - modifierData.width - 30
    modifierData.y = pos.y + 30
  })
})
</script>

<style lang="scss" scoped>
.content-modifier {
  position: absolute;
  overflow: hidden;
  top: 0px;
  left: 0px;
  border: 1px solid gray;
  width: 80px;
  height: 80px;

  &__content {
    top: 0px;
    left: 0px;
    margin-left: 0px;
    margin-top: 0px;
    overflow: visible;
    position: absolute;
    display: block;
    transform-origin: left top;
    user-select: none;
  }
}
</style> -->
