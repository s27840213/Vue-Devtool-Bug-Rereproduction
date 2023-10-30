<template lang="pug">
div(class="image-selector h-full w-full grid grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
  div(class="bg-app-bg px-24 py-8 flex justify-between items-center")
    div
      back-btn
  div(
    class="bg-app-tab-bg w-full h-full rounded-t-[24px] pt-16 box-border grid grid-rows-[auto,auto,minmax(0,1fr)] grid-cols-1")
    div(class="tabs flex justify-around pb-8")
      span(class="text-app-tab-active typo-btn-lg") Photos
      span(class="text-app-tab-disable typo-btn-lg") Stocks
    div(class="flex justify-between items-center px-12 py-8")
      div(class="flex items-center gap-8" @click="toggleAlbum")
        span(class="text-app-tab-default typo-btn-lg") {{ currAlbumName }}
        div(
          class="transition-transform duration-300"
          :style="{ transform: isAlbumOpened ? 'rotate(180deg)' : 'rotate(0deg)' }")
          cm-svg-icon(
            class="text-app-tab-default"
            :iconName="'chevron-up'"
            :iconWidth="'12px'")
    div(v-if="isAlbumOpened" class="img-selector__img-grid bg-app-bg overflow-scroll")
      div(class="grid grid-cols-3 grid-flow-row content-start gap-4")
        div(class="aspect-square flex flex-col items-center justify-center")
          cm-svg-icon(class="text-app-tab-default mb-10" :iconName="'camera'")
          span(class="text-app-tab-default") Camera
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
          class="text-app-tab-default mb-10"
          :iconName="'loading'"
          iconColor="app-text-secondary")
    div(v-else class="flex flex-col gap-8")
      div(
        v-for="album in smartAlbum"
        :key="album.albumId"
        class="display flex gap-12"
        @click="selectAlbum(album)")
        img(
          class="object-cover aspect-square w-80"
          :src="`chmix://cameraroll/${album.thumbId}?type=thumb`")
        div(class="flex flex-col items-start justify-evenly")
          span(class="text-app-tab-default") {{ album.title }}
          span(class="text-app-tab-default") {{ album.albumSize }}
      template(v-if="myAlbum.length > 0")
        div(class="text-left text-app-tab-default") Ｍy Albums
        div(
          v-for="album in myAlbum"
          :key="album.albumId"
          class="display flex gap-12"
          @click="selectAlbum(album)")
          img(
            class="object-cover aspect-square w-80"
            :src="`chmix://cameraroll/${album.thumbId}?type=thumb`")
          div(class="flex flex-col items-start justify-evenly")
            span(class="text-app-tab-default") {{ album.title }}
            span(class="text-app-tab-default") {{ album.albumSize }}
</template>
<script lang="ts" setup>
import { useEditorStore } from '@/stores/editor';
import { useImgSelectorStore } from '@/stores/imgSelector';
import type { IAlbum } from '@/utils/webViewUtils';
import webViewUtils from '@/utils/webViewUtils';
import assetUtils from '@nu/vivi-lib/utils/assetUtils';
import groupUtils from '@nu/vivi-lib/utils/groupUtils';
import imageUtils from '@nu/vivi-lib/utils/imageUtils';

const router = useRouter()

// #region album datas
const smartAlbum = reactive<IAlbum[]>([])
const myAlbum = reactive<IAlbum[]>([])
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
  webViewUtils
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
  switch(editorType.value) {
    case 'powerful-fill': {
      if (type === 'cameraroll') {
        const src = imageUtils.getSrc({
          type: 'ios',
          assetId: `cameraroll/${id}`,
          userId: '',
        })
    
        console.log(src)
        imageUtils.imgLoadHandler(src, (img: HTMLImageElement) => {
          const { naturalWidth, naturalHeight } = img
          const photoAspectRatio = naturalWidth / naturalHeight
          
          setShowImgSelector(false)
          router.push({
            name: 'Editor'
          })
          assetUtils.addImage(src, photoAspectRatio)
          groupUtils.deselect()
        })
      }
    }
  }
}
// #endregion

// get the first image content
webViewUtils
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
