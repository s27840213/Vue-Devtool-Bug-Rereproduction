<template lang="pug">
div(
  v-if="!srcPreprocessImg"
  class="image-selector bg-app-bg text-app-tab-default \ h-full w-full grid grid-rows-[auto,auto,auto,minmax(0,1fr),auto] grid-cols-1")
  //- 1. Top bar
  div(class="box-border px-24 py-8 flex justify-between items-center")
    back-btn
    span(class="text-app-btn-primary-text") {{ $tc('CM0058', requireNum > 1 ? 2 : 1, { num: requireNum }) }}
    div(class="w-24")
  //- 2. Tabs for photo & stock
  tabs(
    class="bg-app-tab-bg min-h-[52px] rounded-t-[24px]"
    :tabs="[$t('STK0067'), $t('STK0069')]"
    v-model="tabIndex")
  //- 3. (Album bar or search bar) + demo img
  div(class="bg-app-tab-bg box-border px-12 py-8 h-60 \ grid grid-cols-[minmax(0,1fr),auto,auto] gap-10")
    div(
      v-if="inPhoto"
      class="flex items-center gap-10"
      @click="toggleAlbum")
      span(class="typo-btn-lg") {{ currAlbumName }}
      div(
        class="transition-transform duration-300"
        :style="{ transform: isAlbumOpened ? 'rotate(180deg)' : 'rotate(0deg)' }")
        svg-icon(
          :iconName="'chevron-up'"
          :iconWidth="'12px'")
    search-bar(
      v-if="inStock"
      class="text-app-text-primary"
      @search="searchUnsplash")
    //- Demo img
    div(
      v-for="(img, i) in demoImgs"
      :key="img.assetId"
      class="relative flex justify-center"
      @click="selectDemo(i)")
      img(class="w-44 h-44 object-cover rounded-[10px]" :src="img.assetId")
      span(class="absolute typo-btn-md bottom-2 text-center") {{ $t('CM0065') }}
  //- 4-1. Photo
  div(
    v-if="inPhoto"
    class="bg-app-tab-bg w-full h-full box-border grid \ grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
    //- Photo selector
    div(
      v-if="isAlbumOpened"
      class="img-selector__img-grid bg-app-bg overflow-scroll grid \ grid-cols-3 grid-flow-row gap-2")
      div(class="aspect-square flex flex-col items-center justify-center" @click="useCamera")
        svg-icon(class="mb-10" iconName="camera")
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
        class="flex justify-center box-border py-12"
        v-if="initLoaded && !noMoreContent && !isLoadingContent"
        :target="'.img-selector__img-grid'"
        :rootMargin="'1000px 0px 1000px 0px'"
        @callback="handleLoadMore")
        svg-icon(
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
      v-for="(col, i) in unsplashCols"
      :key="i"
      class="grid gap-16 h-fit")
      div(
        v-for="img in col"
        :key="img.id"
        class="relative")
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
      class="flex justify-center box-border py-12 col-span-2"
      :target="'.img-selector__img-grid'"
      :rootMargin="'1000px 0px 1000px 0px'"
      @callback="unsplashLoadmore")
      svg-icon(
        v-if="unsplashLoading"
        class="mb-10"
        :iconName="'loading'"
        iconColor="app-text-secondary")
  //- 5. Multi-select candidate UI
  div(v-if="requireNum > 1 && targetImgs.length" class="mx-16 mt-10 mb-20 grid gap-20")
    div(class="flex justify-between items-center h-32")
      span {{ $t('CM0062', { num: requireNum }) }}
      nubtn(@click="sendToEditor") {{ $t('NN0744') }}
    div(class="flex flex-row gap-20")
      div(
        v-for="img in targetImgs"
        :key="img.assetId"
        class="relative")
        img(class="w-60 h-60 object-cover" :src="imageUtils.getSrc(img, 'tiny')")
        svg-icon(
          class="absolute -right-12 -top-12"
          iconName="close-btn"
          @click="pull(targetImgs, img)")
//- Preprocess view
div(v-else class="preprocess w-full h-full fle justify-center items-center bg-app-bg text-app-text-secondary")
  img(
    class="w-full max-h-[60%] mt-37 mb-20 object-cover object-center filter"
    :class="{'grayscale': editorType === 'hidden-message', invert: isInvert}"
    :src="srcPreprocessImg")
  div(class="p-24 pb-45 flex flex-col gap-16")
    div(class="flex justify-between items-center typo-h5 py-8")
      div(class="flex gap-8")
        span {{ $t('CM0080') }}
        svg-icon(
          iconName="information-circle"
          iconWidth="24px"
        )
      toggle-btn(class="payment__trial__toggle" v-model="isInvert" :width="36" :height="22" colorInactive="app-tab-slider-bg-raw" colorActive="app-tab-active")
    div(class="flex justify-between items-center typo-h5 py-8")
      div(class="flex gap-8")
        svg-icon(
          class="bg-app-tab-active text-app-bg rounded-full"
          iconName="crown"
          iconWidth="24px"
        )
        span {{ $t('CM0082') }}
        svg-icon(
          iconName="information-circle"
          iconWidth="24px"
        )
      toggle-btn(class="payment__trial__toggle" v-model="isBgRemove" :width="36" :height="22" colorInactive="app-tab-slider-bg-raw" colorActive="app-tab-active")
    div(class="flex justify-between items-center typo-h6")
      nubtn(
        theme="secondary"
        size="sm"
        @click="cancelPreprocess") {{ $t('NN0203') }}
      span {{ $t('CM0083') }}
      nubtn(
        size="sm"
        @click="applyPreprocess") {{ $t('CM0061') }}
</template>

<script lang="ts" setup>
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import vuex from '@/vuex'
import LazyLoad from '@nu/vivi-lib/components/LazyLoad.vue'
import ObserverSentinel from '@nu/vivi-lib/components/ObserverSentinel.vue'
import SearchBar from '@nu/vivi-lib/components/SearchBar.vue'
import Tabs from '@nu/vivi-lib/components/Tabs.vue'
import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import type { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import type { IAlbum, IAlbumContent } from '@nu/vivi-lib/utils/cmWVUtils'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import { find, pull } from 'lodash'
import { notify } from '@kyvg/vue3-notification'
import ToggleBtn from '@nu/shared-lib/components/ToggleBtn.vue'

const router = useRouter()

const props = defineProps({
  requireNum: {
    type: Number,
    required: true,
  },
})

// #region var declare
const { tabIndex } = storeToRefs(useImgSelectorStore())
const inPhoto = computed(() => tabIndex.value === 0)
const inStock = computed(() => tabIndex.value === 1)
const { tc } = useI18n()
let targetImgs = reactive([] as (SrcObj & { ratio: number })[])
const demoImgs = [
  {
    type: 'local-img',
    assetId: require('@img/jpg/cm demo img1.jpg'),
    userId: '',
    ratio: 320 / 480,
  },
  {
    type: 'local-img',
    assetId: require('@img/jpg/cm demo img2.jpg'),
    userId: '',
    ratio: 384 / 480,
  },
]

const { atEditor } = useStateInfo()
// #endregion

// #region album datas
const smartAlbum = reactive<IAlbum[]>([])
const myAlbum = reactive<IAlbum[]>([])
const albums = computed(() => [
  ...smartAlbum,
  ...(myAlbum.length > 0
    ? [
        {
          // 'My album' text
          albumId: 'myAlbum',
          albumSize: 0,
          title: 'myAlbum',
          thumbId: 'myAlbum',
        },
      ]
    : []),
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
const { setPageSize, setImgAspectRatio, editorType } = editorStore
const { setRequireImgNum, replaceImgFlag } = useImgSelectorStore()

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
const useCamera = () => {
  cmWVUtils.callIOSAsHTTPAPI('USE_CAMERA', undefined, { timeout: -1 }).then((img) => {
    if (!img || img.flag) {
      notify({ group: 'error', text: 'Camera img select error' })
    }
    selectImage(img as IAlbumContent, 'ios')
  })
}
// #endregion

// #region stock method
const unsplash = vuex.state.unsplash
// Computed
const unsplashRaw = computed(() => {
  if (unsplash.keyword) return unsplash.searchResult
  return unsplash.content
})
const unsplashCols = computed(() => useWaterfall(unsplashRaw.value, 2))
const unsplashLoading = computed(() => {
  if (
    (unsplash.keyword && unsplash.nextSearch === -1) ||
    (!unsplash.keyword && unsplash.nextPage === -1)
  )
    return false
  return unsplash.pending
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
  return find(targetImgs, ['assetId', (type === 'ios' ? 'cameraroll/' : '') + img.id])
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
    modalUtils.setModalInfo(
      tc('CM0069', { num: props.requireNum }),
      tc('CM0070', { num: props.requireNum }),
      { msg: tc('STK0023') },
    )
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
  if (replaceImgFlag) {
    imageUtils.replaceImg(
      targetImgs[0],
      imageUtils.getSrc(targetImgs[0], 'prev'),
      targetImgs[0].ratio,
    )
  } else {
    const initAtEditor = atEditor.value
    if (initAtEditor && editorType === 'hidden-message' && !srcPreprocessImg.value) {
      srcPreprocessImg.value = imageUtils.getSrc(targetImgs[0])
      return
    }
    setImgAspectRatio(targetImgs[0].ratio)
    if (!atEditor.value) await router.push({ name: 'Editor' })
    setPageSize(900, 1600)
    nextTick(() => {
      targetImgs.forEach((img) => {
        // if we aren't at editor at beginning, we need to fit the image, and don't need to record
        assetUtils.addImage(
          img,
          img.ratio,
          {
            fit: initAtEditor ? 0.8 : 1,
            record: initAtEditor,
            styles: {
              adjust: {
                ...(editorType === 'hidden-message' && { saturate: -100 }),
                invert: +isInvert.value
              }
            }
          })
      })
      if (!initAtEditor || editorType === 'hidden-message') {
        groupUtils.deselect()
      }
    })
  }
  setRequireImgNum(0)
  srcPreprocessImg.value = null
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

// #region preprocess
const srcPreprocessImg = ref(null) as Ref<string | null>
const isInvert = ref(false)
const isBgRemove = ref(false)
const cancelPreprocess = () => {
  srcPreprocessImg.value = null
}
const applyPreprocess = () => {
  sendToEditor()
  if (isBgRemove.value) {
    // TODO: remove bg
  }
}
// #endregion
</script>

<style lang="scss"></style>
