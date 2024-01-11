<template lang="pug">
div(
  class="my-design w-full h-full grid grid-cols-1 grid-rows-[auto,1fr] justify-center items-center pt-8 px-16 relative")
  scrollable-container(:py="8")
    div(
      v-for="(tag, index) in myDesignTags"
      class="px-8 py-4 box-border rounded-full typo-body-md whitespace-nowrap transition-colors duration-400"
      :class="[currMyDesignType === tag.type ? 'bg-yellow-1 text-dark' : 'bg-lighter/33 text-yellow-0']"
      :key="tag.type"
      @click="selectMyDesignType(tag, index)")
      span(class="") {{ tag.label }}
  div(
    v-if="currDesigns.length"
    class="grid grid-cols-2 gap-20 overflow-scroll h-full"
    ref="designsContainer")
    div(
      v-for="(col, i) in myDesignCols"
      :key="`${currMyDesignType}-${i}`"
      class="grid gap-20 h-fit"
      :class="prevTagIndex >= currTagIndex ? 'fade-left-in' : 'fade-right-in'")
      div(
        v-for="design in col"
        :key="`${currMyDesignType}-${design.id}`"
        class="relative")
        img(
          class="w-full rounded-20"
          :src="getDesignThumbUrl(design, 400)"
          @click="selectDesign(design)")
        //- span(class="text-white text-xs") {{ design.id }}
        svg-icon(
          class="absolute right-10 top-10 bg-white/[0.65] rounded-10 m-1"
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
  div(v-else class="flex-center flex-col gap-32")
    img(src="@/assets/img/img-empty.png" class="w-240")
    span(class="text-yellow-0 typo-h5") {{ $t('CM0031') }}
  //- transition(name="fade-bottom-in-out")
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

// #region hooks
onBeforeRouteLeave(() => {
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

const prevTagIndex = ref(0)
const currTagIndex = ref(0)
// #endregion

const selectMyDesignType = async (tag: { label: string; type: IMyDesignType }, index: number) => {
  if (tag.type === currMyDesignType.value) return
  prevTagIndex.value = currTagIndex.value
  currTagIndex.value = index
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

const handleLoadMore = async () => {
  if (noMoreContent.value || isLoadingContent.value) return
  listDesigns(currMyDesignType.value, myDesignNextPagesMap.value[currMyDesignType.value])
}
// #endregion
</script>

<style scoped lang="scss">
.fade-left-in {
  animation: fade-left-in 0.3s ease-in-out;
}

.fade-right-in {
  animation: fade-right-in 0.3s ease-in-out;
}
</style>
