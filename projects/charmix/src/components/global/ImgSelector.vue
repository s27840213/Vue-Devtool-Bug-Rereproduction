<template lang="pug">
div(class="image-selector h-full w-full grid grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
  div(class="bg-app-bg px-24 py-8 flex justify-between items-center")
    div
      back-btn
  div(
    class="bg-app-tab-bg w-full h-full rounded-t-[24px] py-16 box-border grid grid-rows-[auto,auto,minmax(0,1fr)] grid-cols-1")
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
    div(
      v-if="isAlbumOpened"
      class="img-grid h-full bg-app-bg grid grid-cols-3 grid-flow-row overflow-scroll gap-4"
      @scroll.stop
      @touchstart.stop)
      div(class="aspect-square flex flex-col items-center justify-center")
        cm-svg-icon(class="text-app-tab-default mb-10" :iconName="'camera'")
        span(class="text-app-tab-default") Camera
      div(
        v-for="item in currAlbumContent"
        :key="item"
        class="aspect-square")
        lazy-load(
          class="lazy-load w-full h-full"
          target=".img-grid"
          :anamationEnabled="true"
          :rootMargin="'1000px 0px 1000px 0px'")
          img(class="object-cover w-full h-full" :src="`chmix://cameraroll/${item}?type=thumb`")
      observer-sentinel(
        v-if="initLoaded && !noMoreContent && !isLoadingContent"
        @callback="handleLoadMore")
    div(v-else class="flex flex-col gap-8")
      div(
        v-for="album in smartAlbum"
        :key="album.albumId"
        class="display flex gap-12"
        @click="selectAlbum(album.albumId)")
        img(
          class="object-cover aspect-square w-80"
          :src="`chmix://cameraroll/${album.thumbId}?type=thumb`")
        div(class="flex flex-col items-start justify-evenly")
          span(class="text-app-tab-default") {{ album.title }}
          span(class="text-app-tab-default") {{ album.albumSize }}
      div(class="text-left text-app-tab-default") Ｍy Albums
      div(
        v-for="album in myAlbum"
        :key="album.albumId"
        class="display flex gap-12"
        @click="selectAlbum(album.albumId)")
        img(
          class="object-cover aspect-square w-80"
          :src="`chmix://cameraroll/${album.thumbId}?type=thumb`")
        div(class="flex flex-col items-start justify-evenly")
          span(class="text-app-tab-default") {{ album.title }}
          span(class="text-app-tab-default") {{ album.albumSize }}
</template>
<script lang="ts" setup>
import type { IAlbum } from '@/utils/webViewUtils'
import webViewUtils from '@/utils/webViewUtils'

const smartAlbum = reactive<IAlbum[]>([])
const myAlbum = reactive<IAlbum[]>([])

const nextPage = ref(0)
const noMoreContent = ref(false)
const isLoadingContent = ref(false)

const currAlbumContent = reactive<string[]>([])
const currAlbum = reactive<IAlbum>({
  albumId: '',
  albumSize: 0,
  title: '',
  thumbId: '',
})
const currAlbumName = computed(() => currAlbum.title)
const currAlbumId = ref('')
const isAlbumOpened = ref(true)
const initLoaded = ref(false)

// get the first image content
webViewUtils.getAlbumList().then((res) => {
  if (res.flag === 1) {
    console.error(res.msg)
  } else {
    smartAlbum.push(...res.smartAlbum)
    console.log(res)
    myAlbum.push(...res.myAlbum)

    const recentAlbum = smartAlbum.find((album) => album.title.toLowerCase() === 'recents')
    Object.assign(currAlbum, recentAlbum)
    if (recentAlbum?.albumId) {
      isLoadingContent.value = true
      getAlbumContent(recentAlbum.albumId).then(() => {
        initLoaded.value = true
      })
    }
  }
})

const toggleAlbum = () => {
  isAlbumOpened.value = !isAlbumOpened.value
}

const getAlbumContent = async (albumId: string) => {
  isLoadingContent.value = true
  webViewUtils.getAlbumContent(albumId, nextPage.value).then((res) => {
    console.log(res)
    currAlbumContent.push(...res.content)
    if (res.nextPage) {
      nextPage.value = res.nextPage
    } else {
      noMoreContent.value = true
    }
    currAlbumId.value = albumId
    isLoadingContent.value = false
  })
}
const handleLoadMore = () => {
  console.log(nextPage.value)
  getAlbumContent(currAlbumId.value)
}

const selectAlbum = (id: string) => {
  nextPage.value = 0
  currAlbumContent.length = 0
  noMoreContent.value = false
  getAlbumContent(id)
  isAlbumOpened.value = true
}
</script>
<style lang="scss"></style>
