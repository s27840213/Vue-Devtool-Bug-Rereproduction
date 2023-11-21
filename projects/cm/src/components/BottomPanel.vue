<template lang="pug">
div(class="bottom-panel tutorial-powerful-fill-4--highlight" ref="bottomPanelRef")
  slot(
    name="content"
    :setSlotRef="setSlotRef")
</template>
<script setup lang="ts">
/**
 * @Note bcz we cannot get the slot ref directly
 * So we need to pass get the ref from the parent
 * Here pass setSlotRef to the parent
 * and parent use setSlotRef to pass the ref here
 */
import { useUserStore } from '@/stores/user'
import { useElementBounding } from '@vueuse/core'

const bottomPanelRef = ref<HTMLElement | null>(null)
const slotRef = ref<HTMLElement | null>(null)

const { height } = useElementBounding(slotRef)
const setSlotRef = (ref: HTMLElement) => {
  slotRef.value = ref
}

watch(
  () => height.value,
  (newVal, oldVal) => {
    // 20 is not important, modify it to make a good transition
    const newHeight = newVal === 0 ? oldVal * 0.6 : newVal
    if (newVal === oldVal || !bottomPanelRef.value) return
    bottomPanelRef.value.style.height = `${newHeight + 32 + homeIndicatorHeight.value}px`
  },
)

const userStore = useUserStore()
const { homeIndicatorHeight } = storeToRefs(userStore)
</script>
<style lang="scss" scoped>
.bottom-panel {
  @apply bg-app-tab-bg w-full rounded-t-[24px] box-border pt-16;
  transition: all 0.3s;
}
</style>
