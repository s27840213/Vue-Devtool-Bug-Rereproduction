<template lang="pug">
div(class="w-full box-border p-24 rounded-20 flex-between-center" :class="`bg__${theme}`")
  div(class="flex-between-start gap-10 flex-col")
    div(class="typo-h4") {{ title }}
    div(class="typo-body-md") {{ description }}
    nubtn(
      size="mid-full"
      :icon="btnIconName"
      @click="handleClick") {{ btnText }}
  img(:src="imgSrc" class="w-128")
</template>
<script setup lang="ts">
const props = defineProps<{
  btnIconName?: string
  btnText: string
  title: string
  description: string
  theme: 'powerful-fill' | 'ig' | 'tiktok'
  iconName: string
}>()

const emits = defineEmits(['clickBtn'])

const handleClick = () => {
  emits('clickBtn')
}

const imgSrc = computed(() => {
  return require(props.iconName + '.png')
})
</script>
<style lang="scss">
.bg__powerful-fill {
  background: linear-gradient(100.37deg, #ffd004 0.75%, #fff2a7 52.64%, #ffffff 105.53%);
}

.bg__ig {
  background: linear-gradient(
    100deg,
    #9620eb 3.99%,
    #e1002a 32.99%,
    #ffa000 58.11%,
    #f8f8ff 98.52%
  );
}

.bg__tiktok {
  background: var(--Gradation, linear-gradient(148deg, #ffd004 9.05%, #fff2a7 49.96%, #fff 91.65%));
}
</style>
