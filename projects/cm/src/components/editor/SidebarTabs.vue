<template lang="pug">
div(class="sidebar-tabs flex flex-col items-center gap-4 h-350 overflow-scroll scrollbar-hide")
  template(v-for="(tab, index) in defaultEditorTabs")
    div(
      v-if="!tab.hidden"
      :key="`${tab.icon}-${index}`"
      class="w-44"
      :class="getTabTutorialClasses(tab.text)")
      div(
        class="sidebar__tab flex-center flex-col gap-2 box-border p-4"
        @click.stop="handleTabAction(tab)"
        @pointerdown.stop)
        svg-icon(
          class="pointer-events-none"
          :style="tab.styles"
          :iconName="tab.icon"
          :iconColor="tab.disabled ? 'dark' : currActiveFeature === tab.icon ? 'yellow-cm' : 'white'"
          iconWidth="20px")
        span(
          class="typo-btn-sm whitespace-nowrap pointer-events-none"
          :class="tab.disabled ? 'text-dark' : 'text-white'") {{ tab.text }}
      div(
        v-if="tab.icon === currActiveFeature && tab.subTabs"
        class="flex-center flex-col gap-2 bg-dark-1/50 rounded-full")
        div(
          v-for="(subTab, index) in tab.subTabs"
          :key="`${subTab.icon}-${index}`"
          class="flex-center flex-col gap-2 box-border p-4"
          :class="getTabTutorialClasses(subTab.text)"
          @click.stop="handleTabAction(subTab)"
          @pointerdown.stop)
          svg-icon(
            :style="subTab.styles"
            :iconName="subTab.icon"
            :iconColor="currActiveFeature === subTab.icon ? 'yellow-cm' : 'white'"
            iconWidth="20px")
          span(
            class="typo-btn-sm whitespace-nowrap"
            :class="true ? 'text-yellow-0' : 'text-lighter'") {{ subTab.text }}
</template>
<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import { storeToRefs } from 'pinia'
const emits = defineEmits(['downloadMask'])

interface ISidebarTab {
  icon: string
  text: string
  panelType: string
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
const { currActiveFeature, editorType } = storeToRefs(editorStore)
const { openImgSelecotr } = useImgSelectorStore()

const addSubTabs = computed(() => {
  return [
    {
      icon: 'photo-rect',
      text: t('CM0050'),
      panelType: 'img',
    },
    {
      icon: 'objects',
      text: t('CM0049'),
      panelType: '',
    },
    {
      icon: 'text',
      text: t('NN0494'),
      panelType: '',
    },
  ]
})
const defaultEditorTabs = computed((): Array<ISidebarTab> => {
  return [
    {
      icon: 'add',
      text: t('CM0048'),
      panelType: '',
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
      hidden: editorType.value === 'hidden-message',
    },
    {
      icon: 'cm_brush',
      text: t('CM0017'),
      panelType: '',
    },
    {
      icon: 'auto-fill',
      text: t('CM0052'),
      panelType: '',
      hidden: editorType.value === 'hidden-message',
    },
    {
      icon: 'reverse',
      text: t('CM0019'),
      panelType: '',
      hidden: editorType.value === 'hidden-message',
    },
    {
      icon: 'ban',
      text: t('CM0029'),
      panelType: '',
      hidden: editorType.value === 'hidden-message',
    },
    {
      icon: 'canvas',
      text: t('CM0053'),
      panelType: '',
      // disabled: true,
    },
  ]
})

const { clearCtx, reverseSelection, autoFill } = useCanvasUtilsCm()

const handleTabAction = (tab: ISidebarTab) => {
  switch (tab.icon) {
    case 'selection':
    case 'cm_brush':
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
      break
    }
    case 'photo-rect':
      openImgSelecotr()
      break
    case 'objects': {
      assetPanelUtils.setCurrActiveTab('object')
      break
    }
    case 'text': {
      assetPanelUtils.setCurrActiveTab('text')
      break
    }
  }
}

const getTabTutorialClasses = (text: string) => {
  return {
    'tutorial-powerful-fill-1--highlight': [t('CM0052'), t('CM0017'), t('CM0051')].includes(text),
    'tutorial-powerful-fill-2--highlight tutorial-powerful-fill-2--clickable': text === t('CM0052'),
    'tutorial-hidden-message-1--highlight': text === t('CM0050'),
    'tutorial-hidden-message-2--highlight': text === t('CM0049'),
    'tutorial-hidden-message-3--highlight': text === t('NN0494'),
  }
}
</script>
<style lang="scss" scoped>
.sidebar-tabs {
  // filter: drop-shadow(0px 0px 0px 20px #4444dd);
  filter: drop-shadow(1px 1px 0px rgba(32, 32, 32, 0.2))
    drop-shadow(-1px 1px 0px rgba(32, 32, 32, 0.2)) drop-shadow(1px -1px 0px rgba(32, 32, 32, 0.2))
    drop-shadow(-1px -1px 0px rgba(32, 32, 32, 0.2));
}

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
