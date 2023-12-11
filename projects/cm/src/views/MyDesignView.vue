<template lang="pug">
div(
  class="my-design w-full h-full grid grid-cols-1 grid-rows-[auto,1fr] justify-center items-center py-20 px-16 relative")
  scrollable-container
    div(
      v-for="tag in myDesignTags"
      class="px-8 py-4 box-border rounded-full typo-body-md whitespace-nowrap"
      :class="[currMyDesignType === tag.type ? 'bg-yellow-1 text-dark' : 'bg-lighter/33 text-yellow-0']"
      :key="tag.type"
      @click="selectMyDesignType(tag)")
      span(class="") {{ tag.label }}
  div(
    v-if="currDesigns.length"
    class="grid grid-cols-2 gap-20 overflow-scroll h-full"
    ref="designsContainer")
    div(
      v-for="(col, i) in myDesignCols"
      :key="i"
      class="grid gap-20 h-fit")
      div(
        v-for="design in col"
        :key="design.id"
        class="relative")
        img(
          class="w-full rounded-20"
          :src="imageUtils.appendQuery(getDesignThumbUrl(design), 'lsize', '300')"
          @click="selectDesign(design)")
        svg-icon(
          class="absolute right-10 top-10 bg-white rounded-10 m-1"
          iconName="more_horizontal"
          iconWidth="22px"
          @click="editDesign(design)")
      observer-sentinel(
        class="flex justify-center box-border py-12"
        v-if="!noMoreContent && !isLoadingContent"
        :target="'.img-selector__img-grid'"
        :rootMargin="'1000px 0px 1000px 0px'"
        @callback="handleLoadMore")
        svg-icon(
          class="mb-10"
          :iconName="'loading'"
          iconColor="white")
  div(v-else class="flex flex-col justify-center items-center gap-32")
    img(src="@/assets/img/img-empty.png" class="w-240")
    span(class="text-yellow-0 typo-h5") {{ $t('CM0031') }}
  sub-design-view(
    v-if="currOpenDesign && isDesignOpen"
    :currOpenDesign="currOpenDesign"
    @closeSubDesignList="closeSubDesignList")
</template>

<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'
import { useUserStore } from '@/stores/user'
import type { ICmMyDesign, IMyDesignType } from '@/types/user'
import ObserverSentinel from '@nu/vivi-lib/components/ObserverSentinel.vue'
import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'

// #region hooks
onBeforeRouteLeave((to, from) => {
  setCurrOpenDesign(undefined)
  setCurrOpenSubDesign(undefined)
})
// #endregion

// #region vars
const designsContainer = ref<HTMLElement | null>(null)

const userStore = useUserStore()
const {
  setCurrMyDesignType,
  listDesigns,
  getDesignThumbUrl,
  getDesignsByType,
  setCurrOpenDesign,
  setCurrOpenSubDesign,
} = userStore
const { myDesignTags, currMyDesignType, currDesigns, currOpenDesign, myDesignNextPagesMap } =
  storeToRefs(userStore)

const isDesignOpen = computed(() => {
  return currOpenDesign.value && currOpenDesign.value.id
})
// #endregion

const selectMyDesignType = async (tag: { label: string; type: IMyDesignType }) => {
  if (getDesignsByType(tag.type).length === 0) {
    await listDesigns(tag.type)
  }

  if (designsContainer.value) {
    designsContainer.value.scrollTo({
      top: 0,
    })
  }
  setCurrMyDesignType(tag.type as IMyDesignType)
}

const myDesignCols = computed(() => useWaterfall(currDesigns.value, 2))

const selectDesign = (design: ICmMyDesign) => {
  currOpenDesign.value = design
}

const closeSubDesignList = () => {
  currOpenDesign.value = undefined
}

const { setMyDesignActions, toggleActionSheet } = useActionSheetCm()
const editDesign = (design: ICmMyDesign) => {
  setMyDesignActions(design)
  toggleActionSheet()
}

// #region used for pagination
const isLoadingContent = ref(false)
const noMoreContent = computed(() => {
  return myDesignNextPagesMap.value[currMyDesignType.value] === -1
})

const handleLoadMore = () => {
  if (noMoreContent.value || isLoadingContent.value) return
  listDesigns(currMyDesignType.value, myDesignNextPagesMap.value[currMyDesignType.value])
}
// #endregion
</script>

<style scoped lang="scss"></style>
