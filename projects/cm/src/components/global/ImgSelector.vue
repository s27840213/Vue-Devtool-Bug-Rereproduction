<template lang="pug">
div(class="image-selector bg-app-bg text-app-tab-default h-full w-full grid grid-rows-[auto,auto,minmax(0,1fr)] grid-cols-1")
  //- Top bar
  div(class="px-24 py-8 flex justify-between items-center")
    back-btn
    span(class="text-app-btn-primary-text") {{ $tc('CM0058', 1, { num: 1 }) }}
    div(class="w-24")
  //- Tabs for photo & stock
  tabs(
    class="bg-app-tab-bg min-h-[52px] rounded-t-[24px]"
    :tabs="[$t('STK0067'), $t('STK0069')]"
    v-model="tabIndex")
  //- Photo
  div(
    v-if="inPhoto"
    class="bg-app-tab-bg w-full h-full box-border grid grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
    //- Album bar
    div(class="flex justify-between items-center px-12 py-8 h-60")
      div(class="flex items-center gap-10" @click="toggleAlbum")
        span(class="typo-btn-lg") {{ currAlbumName }}
        div(
          class="transition-transform duration-300"
          :style="{ transform: isAlbumOpened ? 'rotate(180deg)' : 'rotate(0deg)' }")
          cm-svg-icon(
            :iconName="'chevron-up'"
            :iconWidth="'12px'")
    //- Photo selector
    div(v-if="isAlbumOpened" class="img-selector__img-grid bg-app-bg overflow-scroll grid grid-cols-3 grid-flow-row gap-2")
      div(class="aspect-square flex flex-col items-center justify-center")
        cm-svg-icon(class="mb-10" iconName="camera")
        span {{ $t('CM0060') }}
      div(
        v-for="id in currAlbumContent"
        :key="id"
        class="aspect-square"
        @click="selectImage(id, 'cameraroll')")
        lazy-load(
          class="lazy-load w-full h-full"
          target=".img-selector__img-grid"
          :rootMargin="'1000px 0px 1000px 0px'")
          img(class="object-cover w-full h-full" :src="`chmix://cameraroll/${id}?ssize=200`")
      observer-sentinel(
        class="flex justify-center py-12"
        v-if="initLoaded && !noMoreContent && !isLoadingContent"
        :target="'.img-selector__img-grid'"
        :rootMargin="'1000px 0px 1000px 0px'"
        @callback="handleLoadMore")
        cm-svg-icon(
          class="mb-10"
          :iconName="'loading'"
          iconColor="app-text-secondary")
    //- Album selector
    div(v-else class="flex flex-col gap-8 mx-10")
      div(
        v-for="album in albums"
        :key="album.albumId"
        class="display flex gap-8"
        @click="selectAlbum(album)")
        div(v-if="album.albumId === 'myAlbum'" class="text-left") {{ $t('CM0059') }}
        template(v-else)
          img(
            class="object-cover aspect-square w-80"
            :src="`chmix://cameraroll/${album.thumbId}?type=thumb`")
          div(class="flex flex-col items-start justify-center gap-4")
            span {{ album.title }}
            span {{ album.albumSize }}
  //- Stock
  div(v-else-if="inStock") stock??
    //- Search bar
    //- Stock selector
</template>
<script lang="ts" setup>
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import type { IAlbum } from '@/utils/cmWVUtils'
import cmWVUtils from '@/utils/cmWVUtils'
import Tabs from '@nu/vivi-lib/components/Tabs.vue'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'

const router = useRouter()

// #region tabs
const tabIndex = ref(0)
const inPhoto = computed(() => tabIndex.value === 0)
const inStock = computed(() => tabIndex.value === 1)
// #endregion

// #region album datas
const smartAlbum = reactive<IAlbum[]>([])
const myAlbum = reactive<IAlbum[]>([])
const albums = computed(() => [
  ...smartAlbum,
  ...myAlbum.length > 0 ? [{ // 'My album' text
    albumId: 'myAlbum',
    albumSize: 0,
    title: 'myAlbum',
    thumbId: 'myAlbum',
  }] : [],
  ...myAlbum,
])
const currAlbumContent = reactive<string[]>([])
const currAlbum = reactive<IAlbum>({
  albumId: '',
  albumSize: 0,
  title: '',
  thumbId: '',
})
const currAlbumName = computed(() => currAlbum.title)
// const currAlbumId = computed(() => currAlbum.albumId)
// #endregion

// #region album states
const nextPage = ref(0)
const noMoreContent = ref(false)
const isAlbumOpened = ref(true)
const isLoadingContent = ref(false)
const initLoaded = ref(false)
// #endregion

const editorStore = useEditorStore()
const { createNewPage, setImgAspectRatio } = editorStore
const { editorType } = storeToRefs(editorStore)
const { setShowImgSelector } = useImgSelectorStore()

// #region album methods
const toggleAlbum = () => {
  isAlbumOpened.value = !isAlbumOpened.value
}

const getAlbumContent = async (album: IAlbum) => {
  const { albumId } = album
  isLoadingContent.value = true

  Object.assign(currAlbum, album)
  cmWVUtils
    .getAlbumContent(albumId, nextPage.value)
    .then((res) => {
      currAlbumContent.push(...res.content)
      if (res.nextPage) {
        nextPage.value = res.nextPage
      } else {
        console.log('no more content')
        noMoreContent.value = true
      }
      isLoadingContent.value = false
    })
    .catch((err) => {
      console.error(err)
      isLoadingContent.value = false
    })
}
const handleLoadMore = () => {
  console.log('handle load more')
  getAlbumContent(currAlbum)
}

const selectAlbum = (album: IAlbum) => {
  nextPage.value = 0
  currAlbumContent.length = 0
  noMoreContent.value = false
  getAlbumContent(album)
  isAlbumOpened.value = true
}

const selectImage = (id: string, type: 'cameraroll' | 'unsplash') => {
  switch (editorType.value) {
    case 'powerful-fill': {
      if (type === 'cameraroll') {
        const src = imageUtils.getSrc({
          type: 'ios',
          assetId: `cameraroll/${id}`,
          userId: '',
        })

        imageUtils.imgLoadHandler(src, async (img: HTMLImageElement) => {
          const { naturalWidth, naturalHeight } = img
          const photoAspectRatio = naturalWidth / naturalHeight

          setImgAspectRatio(photoAspectRatio)

          setShowImgSelector(false)
          await router.push({
            name: 'Editor',
          })
          createNewPage(900, 1600)
          nextTick(() => {
            assetUtils.addImage(src, photoAspectRatio, {
              fit: 1,
            })
            groupUtils.deselect()
          })
        })
      }
    }
  }
}
// #endregion

// get the first image content
cmWVUtils
  .getAlbumList()
  .then((res) => {
    if (res.flag === 1) {
      console.error(res.msg)
    } else {
      smartAlbum.push(...res.smartAlbum)
      myAlbum.push(...res.myAlbum)

      const recentAlbum = smartAlbum.find((album) =>
        ['recents', '最近項目'].includes(album.title.toLowerCase()),
      )
      Object.assign(currAlbum, recentAlbum)
      isLoadingContent.value = true
      if (recentAlbum?.albumId) {
        getAlbumContent(recentAlbum).then(() => {
          initLoaded.value = true
        })
      } else {
        if (smartAlbum.length > 0) {
          getAlbumContent(smartAlbum[0]).then(() => {
            initLoaded.value = true
          })
        }
      }
    }
  })
  .catch((err) => {
    console.error(err)
    isLoadingContent.value = false
  })
</script>
<style lang="scss"></style>
