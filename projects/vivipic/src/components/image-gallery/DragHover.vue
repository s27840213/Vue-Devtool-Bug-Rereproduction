<template lang="pug">
div(class="dim-background" :style="{ pointerEvents: 'none' }")
  div(class="upload-large")
    svg-icon(iconName="cloud-upload" iconWidth="78px" iconColor="white")
    span {{ text.hintText }}
  div(class="upload-small")
    span {{ `・${$t('NN0414', { element: text.elementType })}： ${text.fileTypes}` }}
</template>

<script lang="ts">
import i18n from '@/i18n'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'DargHover',
  props: {
    text: {
      type: Object as PropType<Record<'hintText' | 'elementType' | 'fileTypes', string>>,
      default: () => ({
        hintText: i18n.global.t('NN0413'),
        elementType: i18n.global.t('NN0416'),
        fileTypes: ['jpg', 'png'].join('、'),
      })
    },
  },
})
</script>

<style lang="scss" scoped>
.dim-background {
  @include size(100%, 100%);
  position: fixed;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.3);
  transform-style: preserve-3d;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 45px;
  &.under {
    z-index: 99;
  }
}
.upload-large {
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  & > span {
    font-style: normal;
    font-weight: bold;
    font-size: 40px;
    line-height: 40px;
    color: white;
  }
}

.upload-small {
  & > span {
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    line-height: 28px;
    color: white;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  }
}
</style>
