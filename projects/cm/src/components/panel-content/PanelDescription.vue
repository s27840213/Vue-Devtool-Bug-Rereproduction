<template lang="pug">
div(class="panel-description w-full px-16 pt-24 box-border relative text-app-text-secondary")
  svg-icon(
    class="absolute -top-6 right-16"
    iconName="close"
    iconColor="app-icon-light"
    iconWidth="24px"
    @click="closePanel")
  //- hidden message help
  template(v-if="descriptionPanel === 'hidden-message'")
    div(class="typo-h5 mb-16") {{ 'How to Create a Hidden Message Image?' }}
    div(class="flex flex-col justify-start items-center gap-16 overflow-scroll max-h-[590px] pb-45")
      div(class="w-full typo-body-md text-left") {{ 'Step 1. You can add images, stickers or text as hidden messages in the photo.' }}
      div(v-for="idx in 3" :key="idx" class="flex gap-8")
        div(class="w-full flex flex-col gap-11 items-end")
          img(
            class="w-100 h-100 rounded-full border-solid border-[3px] border-primary-white object-cover object-center"
            :src="require(`demo/hidden-message-demo-${idx}a.jpeg`)")
          svg-icon(
            iconName="tutorial-arrow-right-primary"
            iconWidth="55px")
        div(class="w-full flex flex-col gap-6 items-end")
          div(class="relative top-22 w-44 h-[66px] flex flex-col gap-4 items-center")
            svg-icon(
              iconName="photo-rect"
              iconColor="app-icon-light"
              iconWidth="20px")
            span(class="typo-btn-xs") {{ $t('CM0050') }}
            svg-icon(
              class="absolute top-[17px] left-[-5px]"
              iconName="tutorial-highlight-bl"
              iconWidth="11px")
            svg-icon(
              class="absolute top-[-22px] left-[22px]"
              iconName="tutorial-highlight-tr"
              iconWidth="18px")
          img(
            class="w-100 h-100 rounded-full border-solid border-[3px] border-primary-white object-cover object-center"
            :src="require(`demo/hidden-message-demo-${idx}b.png`)")
      div(class="w-full typo-body-md text-left") {{ 'Step 2. After adding elements, type in your ideal scene.' }}
      prompt-area(preview)
  //- img preprocess info
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
const editorStore = useEditorStore()
const { descriptionPanel } = storeToRefs(editorStore)

const closePanel = () => {
  editorStore.setDescriptionPanel(null)
}

</script>
<style lang="scss">
</style>
