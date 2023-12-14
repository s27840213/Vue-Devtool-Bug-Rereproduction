<template lang="pug">
footer-bar(class="footer-options px-24 pt-8"
          :title="t('CM0053')"
          @cancel="handleCancel"
          @apply="handleApply")
</template>

<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue';
import { useEditorStore } from '@/stores/editor';
import useI18n from '@nu/vivi-lib/i18n/useI18n';

const { t } = useI18n()

const editorStore = useEditorStore()
const { setIsResizingCanvas } = editorStore

const handleCancel = () => {
  setIsResizingCanvas(false)
}

const handleApply = () => {
  setIsResizingCanvas(false)
}
</script>
