<template lang="pug">
div(v-if="descriptionPanel" class="panel-description w-full px-16 pt-24 box-border relative text-white")
  svg-icon(
    class="absolute -top-6 right-16"
    iconName="close"
    iconColor="yellow-0"
    iconWidth="24px"
    @click="closePanel")
  div(class="typo-h5 mb-16") {{ title }}
  div(class="flex flex-col justify-start items-center gap-16 overflow-scroll max-h-[590px] pb-45")
    //- hidden message help
    template(v-if="descriptionPanel === 'hidden-message'")
      div(class="w-full typo-body-md text-left") {{ t('CM0094') }}
      div(v-for="(item, idx) in hiddenMessageStep1Items" :key="idx" class="flex gap-8")
        div(class="w-full flex flex-col gap-11 items-end")
          img(
            class="w-100 h-100 rounded-full border-solid border-[3px] border-white object-cover object-center"
            :src="item.imgA")
          svg-icon(
            iconName="tutorial-arrow-right-primary"
            iconWidth="55px")
        div(class="w-full flex flex-col gap-6 items-end")
          div(class="relative top-22 w-44 h-66 flex flex-col gap-4 items-center")
            svg-icon(
              :iconName="item.iconName"
              iconColor="yellow-0"
              iconWidth="20px")
            span(class="typo-btn-xs") {{ item.iconText }}
            svg-icon(
              class="absolute top-17 -left-5"
              iconName="tutorial-highlight-bl"
              iconWidth="11px")
            svg-icon(
              class="absolute -top-22 left-22"
              iconName="tutorial-highlight-tr"
              iconWidth="18px")
          img(
            class="w-100 h-100 rounded-full border-solid border-[3px] border-white object-cover object-center"
            :src="item.imgB")
      div(class="w-full typo-body-md text-left") {{ t('CM0095') }}
      prompt-area(preview)
    //- img preprocess info
    template(v-if="['hidden-message-invert', 'hidden-message-bgrm'].includes(descriptionPanel)")
      div(class="w-full typo-body-md text-left") {{ hiddenMessageImgPreprocessDescription }}
      div(
        v-for="(item, idx) in hiddenMessageImgPreprocessItems"
        :key="idx"
        class="w-full flex flex-col gap-8")
        div(class="flex justify-between items-center")
          img(
            class="w-100 h-100 object-cover object-center"
            :src="item.imgA" )
          svg-icon(
            iconName="right-arrow-long"
            iconWidth="88px")
          img(
            class="w-100 h-100 object-cover object-center"
            :src="item.imgB" )
        span(class="typo-body-sm text-left") {{ item.text }}
</template>
<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
import useI18n from '@nu/vivi-lib/i18n/useI18n'

const editorStore = useEditorStore()
const descriptionPanel = editorStore.descriptionPanel
const { t } = useI18n()

const closePanel = () => {
  editorStore.setDescriptionPanel(null)
}

const title = computed(() => {
  switch (descriptionPanel) {
    case 'hidden-message':
      return t('CM0093')
    case 'hidden-message-invert':
      return t('CM0096')
    case 'hidden-message-bgrm':
      return t('CM0100')
  }
  return ''
})

// #region hidden-message help
const hiddenMessageStep1Items = computed(() => Array.from(Array(3), (_, index) => ({
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
})))
// #endregion

// #region hidden-message img preprocess
const hiddenMessageImgPreprocessDescription = computed(() => {
  switch (descriptionPanel) { 
    case 'hidden-message-invert':
      return t('CM0097')
    case 'hidden-message-bgrm':
      return t('CM0101')
  }
  return ''
})

const hiddenMessageImgPreprocessItems = computed(() => Array.from(Array(2), (_, index) => ({
  imgA: require(`demo/${descriptionPanel}-demo-${index}a.jpeg`),
  imgB: require(`demo/${descriptionPanel}-demo-${index}b.png`),
  text: (() => {
    switch (descriptionPanel) {
      case 'hidden-message-invert':
        switch (index) {
          case 0:
            return t('CM0098')
          case 1:
            return t('CM0099')
        }
        break
      case 'hidden-message-bgrm':
        switch (index) {
          case 0:
            return t('CM0102')
          case 1:
            return t('CM0103')
        }
        break
    }
    return ''
  })()
})))
// #endregion
</script>
<style lang="scss">
</style>
