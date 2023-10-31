<!-- <template lang="pug">
slot(ref="tapTransitionRef")
</template>
<script setup lang="ts">
import useTapTransition from '@/composable/useTapTransition'
const props = defineProps<{
  modelValue: boolean
}>()

const emits = defineEmits(['update:modelValue'])

const tapTransitionRef = ref<HTMLElement | null>(null)
useTapTransition(tapTransitionRef, props.modelValue)
</script>
<style lang="scss"></style> -->
