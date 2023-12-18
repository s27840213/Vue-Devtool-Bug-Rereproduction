<template lang="pug">
div(class="footer-bar flex-between-center" name='main')
  nubtn(
    class="layer-action"
    theme="secondary"
    @click="handleCancel") {{ $t('NN0203') }}
  div(class="typo-h6 text-white") {{ title }}
  nubtn(class="layer-action" @click="handleApply") {{ $t('CM0061') }}
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true
  },
})

const emit = defineEmits(['cancel', 'apply'])

const handleCancel = () => {
  emit('cancel')
}

const handleApply = () => {
  emit('apply')
}
</script>
