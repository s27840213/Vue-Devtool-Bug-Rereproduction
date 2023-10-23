<template lang="pug">
div(class="flex flex-col items-center justify-center gap-4 p-2")
  div(
    v-for="(tab, index) in defaultEditorTabs"
    :key="`${tab.icon}-${index}`"
    class="flex flex-col items-center justify-center gap-2 p-4")
    cm-svg-icon(
      :iconName="tab.icon"
      :iconColor="'app-btn-primary-text'"
      iconWidth="20px")
    span(
      class="typo-btn-sm whitespace-nowrap"
      :class="true ? 'text-app-tab-default' : 'text-app-tab-disable'") {{ tab.text }}
    div(
      v-if="tab.subTabs"
      class="flex flex-col items-center justify-center gap-2 p-4 bg-app-tab-disable bg-opa rounded-full")
      div(
        v-for="(subTab, index) in tab.subTabs"
        :key="`${subTab.icon}-${index}`"
        class="flex flex-col items-center justify-center gap-2 p-4")
        cm-svg-icon(
          :iconName="subTab.icon"
          :iconColor="'app-btn-primary-text'"
          iconWidth="20px")
        span(
          class="typo-btn-sm whitespace-nowrap"
          :class="true ? 'text-app-tab-default' : 'text-app-tab-disable'") {{ subTab.text }}
</template>
<script setup lang="ts">
interface ISidebarTab {
  icon: string
  text?: string
  panelType?: string
  hidden?: boolean
  disabled?: boolean
  forPro?: boolean
  subTabs?: Array<ISidebarTab>
}

const { t } = useI18n()

const addSubTabs = computed(() => {
  return [
    {
      icon: 'photo-rect',
      text: t('CM0050'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'objects',
      text: t('CM0049'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'text',
      text: t('NN0494'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
  ]
})
const defaultEditorTabs = computed((): Array<ISidebarTab> => {
  return [
    {
      icon: 'add',
      text: t('CM0048'),
      panelType: '',
      hidden: false,
      disabled: false,
      subTabs: addSubTabs.value,
    },
    {
      icon: 'selection',
      text: t('CM0051'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'brush',
      text: t('CM0051'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'brush',
      text: t('CM0017'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'auto-fill',
      text: t('CM0052'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'reverse',
      text: t('CM0019'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'ban',
      text: t('CM0029'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
    {
      icon: 'canvas',
      text: t('CM0053'),
      panelType: '',
      hidden: false,
      disabled: false,
    },
  ]
})
</script>
<style lang="scss"></style>
