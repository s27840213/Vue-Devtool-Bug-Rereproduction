<template lang="pug">
div(class="image-selector bg-app-bg text-app-tab-default \
  h-full w-full grid grid-rows-[auto,auto,auto,minmax(0,1fr),auto] grid-cols-1")
  //- 1. Top bar
  div(class="px-24 py-8 flex justify-between items-center")
    back-btn
    span(class="text-app-btn-primary-text") {{ $tc('CM0058', requireNum > 1 ? 2 : 1, { num: requireNum }) }}
    div(class="w-24")
  //- 2. Tabs for photo & stock
  tabs(
    class="bg-app-tab-bg min-h-[52px] rounded-t-[24px]"
    :tabs="[$t('STK0067'), $t('STK0069')]"
    v-model="tabIndex")
  //- 3. (Album bar or search bar) + demo img
  div(class="bg-app-tab-bg px-12 py-8 h-60 \
    grid grid-cols-[minmax(0,1fr),auto,auto] gap-10")
    div(
      v-if="inPhoto"
      class="flex items-center gap-10"
      @click="toggleAlbum")
      span(class="typo-btn-lg") {{ currAlbumName }}
      div(
        class="transition-transform duration-300"
        :style="{ transform: isAlbumOpened ? 'rotate(180deg)' : 'rotate(0deg)' }")
        cm-svg-icon(
          :iconName="'chevron-up'"
          :iconWidth="'12px'")
    search-bar(
      v-if="inStock"
      class="text-app-text-primary"
      @search="searchUnsplash")
    //- Demo img
    div(
      v-for="img, i in demoImgs"
      :key="img.assetId"
      class="relative flex justify-center"
      @click="selectDemo(i)")
      img(class="w-44 h-44 object-cover rounded-[10px]" :src="img.assetId")
      span(class="absolute typo-btn-md bottom-2 text-center") {{ $t('CM0065') }}
  //- 4-1. Photo
  div(
    v-if="inPhoto"
    class="bg-app-tab-bg w-full h-full box-border grid \
      grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
    //- Photo selector
    div(
      v-if="isAlbumOpened"
      class="img-selector__img-grid bg-app-bg overflow-scroll grid \
        grid-cols-3 grid-flow-row gap-2")
      div(class="aspect-square flex flex-col items-center justify-center")
        cm-svg-icon(class="mb-10" iconName="camera")
        span {{ $t('CM0060') }}
      div(
        v-for="img in currAlbumContent"
        :key="img.id"
        class="aspect-square relative"
        @click="selectImage(img, 'ios')")
        lazy-load(
          class="lazy-load w-full h-full"
          target=".img-selector__img-grid"
          :rootMargin="'1000px 0px 1000px 0px'")
          img(class="object-cover w-full h-full" :src="`chmix://cameraroll/${img.id}?ssize=200`")
        svg-icon(
          v-if="selected(img, 'ios')"
          class="absolute right-0 top-0"
          iconName="item-check"
          iconColor="app-tab-active")
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
  //- 4-2. Stock
  div(v-else-if="inStock" class="grid grid-cols-2 gap-16 mx-10 my-16 overflow-scroll")
    //- Stock selector
    div(
      v-for="col, i in unsplashCols"
      :key="i"
      class="grid gap-16 h-fit")
      div(v-for="img in col" :key="img.id" class="relative")
        img(
          class="w-full"
          :src="`https://images.unsplash.com/${img.id}?cs=tinysrgb&q=80&w=320`"
          @click="selectImage(img, 'unsplash')")
        svg-icon(
          v-if="selected(img, 'unsplash')"
          class="absolute right-0 top-0"
          iconName="item-check"
          iconColor="app-tab-active")
    observer-sentinel(
      class="flex justify-center py-12 col-span-2"
      :target="'.img-selector__img-grid'"
      :rootMargin="'1000px 0px 1000px 0px'"
      @callback="unsplashLoadmore")
      cm-svg-icon(
        v-if="unsplashLoading"
        class="mb-10"
        :iconName="'loading'"
        iconColor="app-text-secondary")
  //- 5. Multi-select candidate UI
  div(
    v-if="requireNum > 1 && targetImgs.length"
    class="mx-16 mt-10 mb-20 grid gap-20")
    div(class="flex justify-between items-center h-32")
      span {{ $t('CM0062', { num: requireNum }) }}
      nubtn(@click="sendToEditor") {{ $t('NN0744') }}
    div(class="flex flex-row gap-20")
      div(v-for="img in targetImgs" :key="img.assetId" class="relative")
        img(class="w-60 h-60 object-cover" :src="imageUtils.getSrc(img, 'tiny')")
        cm-svg-icon(
          class="absolute -right-12 -top-12"
          iconName="close-btn"
          @click="pull(targetImgs, img)")
</template>

<script lang="ts" setup>
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import type { IAlbum, IAlbumContent } from '@/utils/cmWVUtils'
import cmWVUtils from '@/utils/cmWVUtils'
import vuex from '@/vuex'
import LazyLoad from '@nu/vivi-lib/components/LazyLoad.vue'
import ObserverSentinel from '@nu/vivi-lib/components/ObserverSentinel.vue'
import SearchBar from '@nu/vivi-lib/components/SearchBar.vue'
import Tabs from '@nu/vivi-lib/components/Tabs.vue'
import type { IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import type { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import { find, pull } from 'lodash'

const router = useRouter()

const props = defineProps({
  requireNum: {
    type: Number,
    required: true
  },
})

// #region var declare
const tabIndex = ref(0)
const inPhoto = computed(() => tabIndex.value === 0)
const inStock = computed(() => tabIndex.value === 1)
let targetImgs = reactive([] as (SrcObj & { ratio: number })[])
const demoImgs = [{
    type: 'local-img',
    assetId: require('@img/jpg/cm demo img1.jpg'),
    userId: '',
    ratio: 320 / 480
  }, {
    type: 'local-img',
    assetId: require('@img/jpg/cm demo img2.jpg'),
    userId: '',
    ratio: 384 / 480
  }]
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
const currAlbumContent = reactive<IAlbumContent[]>([])
const currAlbum = reactive<IAlbum>({
  albumId: '',
  albumSize: 0,
  title: '',
  thumbId: '',
})
const currAlbumName = computed(() => currAlbum.title)
// const currAlbumId = computed(() => currAlbum.albumId)
// #endregion

// #region album methods
// Local var
const nextPage = ref(0)
const noMoreContent = ref(false)
const isAlbumOpened = ref(true)
const isLoadingContent = ref(false)
const initLoaded = ref(false)
// Var from store
const editorStore = useEditorStore()
const { setPageSize, setImgAspectRatio } = editorStore
const { setShowImgSelector } = useImgSelectorStore()

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
// #endregion

// #region stock method
const unsplash = vuex.state.unsplash
// Computed
const unsplashRaw = computed(() => {
  if (unsplash.keyword) return unsplash.searchResult
  return unsplash.content
})
const unsplashLoading = computed(() => {
  if ((unsplash.keyword && unsplash.nextSearch === -1) ||
    (!unsplash.keyword && unsplash.nextPage === -1)) return false
  return unsplash.pending
})
const unsplashCols = computed(() => {
  const arr = [
    {content: [] as IPhotoItem[], height: 0},
    {content: [] as IPhotoItem[], height: 0},
  ]
  unsplashRaw.value.forEach(unsplash => {
    const next = arr[0].height <= arr[1].height ? 0 : 1
    arr[next].content.push(unsplash)
    arr[next].height += unsplash.height / (unsplash.width / 100)
  })
  return arr.map(a => a.content)
})

// Method
const unsplashLoadmore = () => {
  if (unsplashLoading.value) return
  vuex.dispatch('unsplash/getMorePhotos')
}
const searchUnsplash = (keyword: string) => {
  vuex.dispatch('unsplash/resetSearch')
  if (keyword) {
    vuex.dispatch('unsplash/getPhotos', { keyword })
  }
}
vuex.dispatch('unsplash/init')
// #endregion

// #region common method
const selected = (img: IPhotoItem | IAlbumContent, type: 'ios' | 'unsplash') => {
  return find(
    targetImgs,
    ['assetId', (type === 'ios' ? 'cameraroll/' : '') + img.id]
  )
}

const selectDemo = (i: number) => {
  targetImgs = []
  if (props.requireNum === 2) {
    targetImgs = demoImgs
  } else {
    targetImgs.push(demoImgs[i])
  }
  sendToEditor()
}

const selectImage = (img: IPhotoItem | IAlbumContent, type: 'ios' | 'unsplash') => {
  if (props.requireNum === targetImgs.length) {
    // Alert
    return
  }

  targetImgs.push({
    type,
    assetId: (type === 'ios' ? 'cameraroll/' : '') + img.id,
    userId: '',
    ratio: img.width / img.height,
  })
  if (props.requireNum === 1) sendToEditor()
}

const sendToEditor = async () => {
  setImgAspectRatio(targetImgs[0].ratio)
  setShowImgSelector(0)
  await router.push({ name: 'Editor' })
  setPageSize(900, 1600)
  nextTick(() => {
    targetImgs.forEach((img) => {
      assetUtils.addImage(img, img.ratio, {
        fit: 1,
      })
    })
    groupUtils.deselect()
  })
}
// #endregion

// #region get the first album image content
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
// #endregion
</script>

<style lang="scss"></style>
