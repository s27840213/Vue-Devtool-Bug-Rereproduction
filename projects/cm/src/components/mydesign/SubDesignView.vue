<template lang="pug">
div(class="absolute top-0 left-0 w-full h-full flex flex-col bg-dark-6 box-border z-median")
  headerbar(
    class="editor-header box-border px-24"
    ref="headerbarRef")
    template(#left)
      back-btn(:customCallback="handleBackAction")
    template(#middle)
      span(v-if="!isSubDesignOpen") {{ $t('CM0124') }}
    template(#right)
      router-link(
        v-if="isSubDesignOpen"
        custom
        :to="'/'"
        v-slot="{ navigate }")
        svg-icon(
          iconColor="white"
          iconName="cm_home"
          iconWidth="22px"
          @click="handleHomeBtnAction(navigate)")
  div(class="relative h-full px-16 box-border py-8 overflow-hidden")
    div(class="h-full grid grid-cols-2 gap-20 overflow-scroll")
      div(
        v-for="(col, i) in myDesignCols"
        :key="i"
        class="grid gap-20 h-fit")
        div(
          v-for="design in col"
          :key="design.id"
          class="relative"
          @click="selectDesign(design)")
          img(class="w-full rounded-20" :src="getSubDesignThumbUrl(design.type, design.id, design.subId)")
          svg-icon(
            class="absolute right-10 top-10 bg-white/[0.65] rounded-10 m-1"
            iconName="more_horizontal"
            iconWidth="22px"
            @click.stop="editDesign(design)")
    sub-design-detail
</template>
<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'
import { useUserStore } from '@/stores/user'
import type { ICmMyDesign, ITmpSubDesign } from '@/types/user'
import { notify } from '@kyvg/vue3-notification'
import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'

// #region props & emits
const emits = defineEmits(['closeSubDesignList'])
const { currOpenDesign } = defineProps<{
  currOpenDesign: ICmMyDesign
}>()
// #endregion

// #region MyDesign related
const userStore = useUserStore()
const {
  listDesigns,
  getDesignsByType,
  getSubDesignThumbUrl,
  getSubDesignConfig,
  setCurrOpenDesign,
  setCurrOpenSubDesign,
} = userStore
const { currMyDesignType, currOpenSubDesign } = storeToRefs(userStore)

/**
 * @Note why not get the subDesign config directly?
 * bcz I try it before, and found its too slow to get the config from server for lots of subDesigns
 */
const subDesignsInfos = computed<ITmpSubDesign[]>(() => {
  const { id, subDesignInfo, type, thumbIndex } = currOpenDesign

  return subDesignInfo.map((info) => {
    const { height, id: subId, width } = info

    return {
      id,
      subId,
      width,
      height,
      type,
      thumbIndex,
    }
  })
})
const isSubDesignOpen = computed(() => currOpenSubDesign.value !== undefined)
watch(
  () => currMyDesignType.value,
  (newVal) => {
    if (getDesignsByType(newVal).length === 0) {
      listDesigns(newVal)
    }
  },
)
// const myDesignRaw = computed(() => vuex.state.unsplash.content)
const myDesignCols = computed(() => useWaterfall(subDesignsInfos.value, 2))
// #endregion

const handleBackAction = () => {
  if (currOpenSubDesign.value !== undefined) {
    setCurrOpenSubDesign(undefined)
  } else {
    emits('closeSubDesignList')
  }
}

const handleHomeBtnAction = (navagate: () => void) => {
  setCurrOpenDesign(undefined)
  setCurrOpenSubDesign(undefined)
  // navagate()
}

const selectDesign = (subDesign: ITmpSubDesign) => {
  getSubDesignConfig(currOpenDesign, subDesign.subId).then((data) => {
    try {
      const { content, flag, name, path } = data
      if (flag === '1') {
        notify({
          group: 'error',
          text: 'Get design config error',
        })
        throw new Error('getSubDesignConfig error')
      }
      setCurrOpenSubDesign(content)
    } catch (e) {
      console.log(e)
    }
  })
}

const { setSubDesignActions, toggleActionSheet } = useActionSheetCm()
const editDesign = (design: ITmpSubDesign) => {
  setSubDesignActions(design)
  toggleActionSheet()
}
</script>
<style lang="scss">
.line-clamp-base {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}
</style>
