<template lang="pug">
svg-icon(:iconColor="iconColor"
	:iconName="iconName" 
	:iconWidth="iconWidth"
	:iconHeight="iconHeight")
</template>
<script setup lang="ts">
import type { ColorSlip } from '@/stores/color'

const props = defineProps<{
  iconName?: string
  iconWidth?: string
  iconColor?: ColorSlip
  iconHeight?: string
}>()

//
</script>
<style lang=""></style>
