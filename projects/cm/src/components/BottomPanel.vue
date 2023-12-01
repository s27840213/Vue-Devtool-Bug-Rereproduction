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
import vuex from '@/vuex';
import type { IUserInfo } from '@nu/vivi-lib/utils/cmWVUtils';
import { useElementBounding } from '@vueuse/core';

const bottomPanelRef = ref<HTMLElement | null>(null)
const slotRef = ref<HTMLElement | null>(null)

const { height } = useElementBounding(slotRef)
const setSlotRef = (ref: HTMLElement) => {
  slotRef.value = ref
}

const userInfo = computed(() => vuex.getters['cmWV/getUserInfo'] as IUserInfo)

watch(
  [height, () => userInfo.value.homeIndicatorHeight],
  ([newHeight, newHomeIndicatorHeight], [oldHeight, oldHomeIndicatorHeight]) => {
    // 32 is not important, modify it to make a good transition
    const tmpNewHeight = newHeight === 0 ? oldHeight * 0.6 : newHeight

    const finalHeight = tmpNewHeight + 32 + newHomeIndicatorHeight
    if (newHeight === finalHeight || !bottomPanelRef.value) return
    bottomPanelRef.value.style.height = `${finalHeight}px`
  },
)
</script>
<style lang="scss" scoped>
.bottom-panel {
  @apply bg-app-tab-bg w-full rounded-t-[24px] box-border pt-16;
  transition: all 0.3s;
}
</style>
