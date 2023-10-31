<template lang="pug">
div(class="sidebar-tabs flex flex-col items-center gap-4 h-[350px] overflow-scroll scrollbar-hide mr-4")
  div(
    v-for="(tab, index) in defaultEditorTabs"
    :key="`${tab.icon}-${index}`"
    class="w-44"
    :class="{'tutorial-powerful-fill-1--highlight': [t('CM0052'), t('CM0017'), t('CM0051')].includes(tab.text ?? ''), 'tutorial-powerful-fill-2--highlight tutorial-powerful-fill-2--clickable': tab.text === t('CM0052')}")
    div(
      class="sidebar__tab flex flex-col items-center justify-center gap-2 p-4"
      @click.stop="handleTabAction(tab)")
      cm-svg-icon(
        class="pointer-events-none"
        :style="tab.styles"
        :iconName="tab.icon"
        :iconColor="tab.disabled ? 'app-icon-dark' : currActiveFeature === tab.icon ? 'app-tab-active' : 'app-btn-primary-text'"
        iconWidth="20px")
      span(
        class="typo-btn-sm whitespace-nowrap pointer-events-none"
        :class="tab.disabled ? 'text-app-icon-dark' : 'text-app-btn-primary-text'") {{ tab.text }}
    div(
      v-if="tab.icon === currActiveFeature && tab.subTabs"
      class="flex flex-col items-center justify-center gap-2 bg-app-tab-disable rounded-full")
      div(
        v-for="(subTab, index) in tab.subTabs"
        :key="`${subTab.icon}-${index}`"
        class="flex flex-col items-center justify-center gap-2 p-4 box-border")
        cm-svg-icon(
          :style="subTab.styles"
          :iconName="subTab.icon"
          :iconColor="currActiveFeature === subTab.icon ? 'app-tab-active' : 'app-btn-primary-text'"
          iconWidth="20px")
        span(
          class="typo-btn-sm whitespace-nowrap"
          :class="true ? 'text-app-tab-default' : 'text-app-tab-disable'") {{ subTab.text }}
</template>
<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm';
import { useEditorStore } from '@/stores/editor';
import groupUtils from '@nu/vivi-lib/utils/groupUtils';
import { storeToRefs } from 'pinia';
const emits = defineEmits(['downloadMask'])

interface ISidebarTab {
  icon: string
  text?: string
  panelType?: string
  hidden?: boolean
  disabled?: boolean
  forPro?: boolean
  subTabs?: Array<ISidebarTab>
  styles?: {
    [key: string]: string
  }
}

const { t } = useI18n()
const editorStore = useEditorStore()
const { setCurrActiveFeature } = editorStore
const { currActiveFeature } = storeToRefs(editorStore)

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
      disabled: true,
      subTabs: addSubTabs.value,
      styles: {
        transform: currActiveFeature.value === 'add' ? 'rotate(45deg)' : '',
        transition: 'transform 0.2s ease-in-out',
      },
    },
    {
      icon: 'selection',
      text: t('CM0051'),
      panelType: '',
      hidden: false,
      disabled: true,
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
      disabled: true,
    },
  ]
})

const { clearCtx, reverseSelection, autoFill } = useCanvasUtilsCm()

const handleTabAction = (tab: ISidebarTab) => {
  switch (tab.icon) {
    case 'selection':
    case 'brush':
    case 'add': {
      if (currActiveFeature.value === tab.icon) {
        setCurrActiveFeature('none')
      } else {
        setCurrActiveFeature(tab.icon)
      }

      groupUtils.deselect()
      break
    }
    case 'auto-fill': {
      autoFill()
      break
    }
    case 'reverse': {
      reverseSelection()
      break
    }
    case 'ban': {
      clearCtx()
      break
    }
    case 'canvas': {
      console.log('download mask')
      emits('downloadMask')
    }
  }
}
</script>
<style lang="scss" scoped>
.sub-tabs {
  transition:
    grid-template-rows 0.3s ease-in-out,
    height 0.3s ease-in-out;
}

.open {
  grid-template-rows: 1fr;
  height: auto;
}

.close {
  grid-template-rows: 0fr;
  height: 0px;
}
</style>
