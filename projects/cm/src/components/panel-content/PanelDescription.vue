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
      div(v-for="(item, idx) in hiddenMessageStep1Items" :key="idx" class="flex gap-8")
        div(class="w-full flex flex-col gap-11 items-end")
          img(
            class="w-100 h-100 rounded-full border-solid border-[3px] border-primary-white object-cover object-center"
            :src="item.imgA")
          svg-icon(
            iconName="tutorial-arrow-right-primary"
            iconWidth="55px")
        div(class="w-full flex flex-col gap-6 items-end")
          div(class="relative top-22 w-44 h-[66px] flex flex-col gap-4 items-center")
            svg-icon(
              :iconName="item.iconName"
              iconColor="app-icon-light"
              iconWidth="20px")
            span(class="typo-btn-xs") {{ item.iconText }}
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
            :src="item.imgB")
      div(class="w-full typo-body-md text-left") {{ 'Step 2. After adding elements, type in your ideal scene.' }}
      prompt-area(preview)
  //- img preprocess info
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
import useI18n from '@nu/vivi-lib/i18n/useI18n'

const editorStore = useEditorStore()
const { descriptionPanel } = storeToRefs(editorStore)
const { t } = useI18n()

const closePanel = () => {
  editorStore.setDescriptionPanel(null)
}

const hiddenMessageStep1Items = ref(
  Array.from(Array(3), (_, index) => ({
    imgA: require(`demo/hidden-message-demo-${index}a.jpeg`),
    imgB: require(`demo/hidden-message-demo-${index}b.png`),
    iconName: (() => {
      switch (index) {
        case 0:
          return 'photo-rect'
        case 1:
          return 'objects'
        case 2:
          return 'text'
      }
      return ''
    })(),
    iconText: (() => {
      switch (index) {
        case 0:
          return t('CM0050')
        case 1:
          return t('CM0049')
        case 2:
          return t('NN0494')
      }
      return ''
    })()
  }))
)

</script>
<style lang="scss">
</style>
