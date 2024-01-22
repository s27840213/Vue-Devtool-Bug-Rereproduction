<template lang="pug">
div(
  v-if="!srcPreprocessImg"
  class="image-selector bg-dark-6 text-yellow-0 \ h-full w-full grid grid-rows-[auto,auto,auto,minmax(0,1fr),auto] grid-cols-1")
  //- 1. Top bar
  div(class="box-border px-24 py-8 flex-between-center")
    back-btn
    span(class="text-white") {{ $tc('CM0058', requireNum > 1 ? 2 : 1, { num: requireNum }) }}
    div(class="w-24")
  //- 2. Tabs for photo & stock
  tabs(
    class="bg-dark-3 min-h-52 rounded-t-24"
    :tabs="[$t('STK0067'), $t('STK0069')]"
    v-model="tabIndex")
  //- 3. (Album bar or search bar) + demo img
  div(class="bg-dark-3 box-border px-12 py-8 h-60 \ grid grid-cols-[minmax(0,1fr),auto,auto] gap-10")
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
      class="text-dark"
      :defaultKeyword="unsplash.keyword"
      clear
      @search="searchUnsplash")
    //- Demo img
    div(
      v-for="(img, i) in demoImgs"
      :key="img.assetId"
      class="relative flex justify-center"
      @click="selectDemo(i)")
      img(class="w-44 h-44 object-cover rounded-10" :src="imageUtils.getSrc(img, 'prev')")
      span(class="absolute typo-btn-md bottom-2 text-center") {{ $t('CM0065') }}
  //- 4-1. Photo
  div(
    v-if="inPhoto"
    class="bg-dark-3 w-full h-full box-border grid \ grid-rows-[auto,minmax(0,1fr)] grid-cols-1")
    //- Photo selector
    div(
      v-if="isAlbumOpened"
      class="img-selector__img-grid bg-dark-6 overflow-scroll grid \ grid-cols-3 grid-flow-row gap-2")
      div(class="aspect-square flex-center flex-col" @click="useCamera")
        svg-icon(class="mb-10" iconName="camera")
        span {{ $t('CM0060') }}
      div(
        v-for="img in currAlbumContent"
        :key="img.id"
        class="aspect-square relative"
        @click="selectImage(img, 'ios')")
        lazy-load(class="lazy-load w-full h-full" :rootMargin="'1000px 0px 1000px 0px'")
          img(class="object-cover w-full h-full" :src="`chmix://cameraroll/${img.id}?ssize=200`")
        svg-icon(
          v-if="selected(img, 'ios')"
          class="absolute right-0 top-0"
          iconName="item-check"
          iconColor="yellow-cm")
      observer-sentinel(
        class="flex justify-center box-border py-12"
        v-if="initLoaded && !noMoreContent && !isLoadingContent"
        :target="'.img-selector__img-grid'"
        :rootMargin="'1000px 0px 1000px 0px'"
        @callback="handleLoadMore")
        svg-icon(
          class="mb-10"
          :iconName="'loading'"
          iconColor="white")
      transition(name="fade-in")
        loading-brick(
          v-if="isLoadingContent"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-median")
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
          div(class="flex-center-start flex-col gap-4")
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
          :src="`https://images.unsplash.com/${img.id}?cs=tinysrgb&q=80&w=150`"
          @click="selectImage(img, 'unsplash')")
        svg-icon(
          v-if="selected(img, 'unsplash')"
          class="absolute right-0 top-0"
          iconName="item-check"
          iconColor="yellow-cm")
    observer-sentinel(
      class="flex justify-center box-border py-12 col-span-2"
      :target="'.img-selector__img-grid'"
      :rootMargin="'1000px 0px 1000px 0px'"
      @callback="unsplashLoadmore")
      svg-icon(
        v-if="unsplashLoading"
        class="mb-10"
        :iconName="'loading'"
        iconColor="white")
  //- 5. Multi-select candidate UI
  div(v-if="requireNum > 1 && targetImgs.length" class="mx-16 mt-10 mb-20 grid gap-20")
    div(class="flex-between-center h-32")
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
div(v-else class="preprocess w-full h-full bg-dark-6 text-white")
  div(class="w-full h-[74%] pt-37 pb-20 flex-center box-border")
    img(
      class="w-full h-full object-cover object-center"
      :class="{ grayscale: editorType === 'hidden-message', invert: isInvert }"
      :src="srcPreprocessImg")
  div(class="p-24 pb-37 flex flex-col gap-16")
    div(class="flex-between-center typo-h5 py-8")
      div(class="flex gap-8")
        span {{ $t('CM0080') }}
        svg-icon(
          iconName="information-circle"
          iconWidth="24px"
          @click="() => editorStore.setDescriptionPanel('hidden-message/invert')")
      toggle-btn(
        class="payment__trial__toggle"
        v-model="isInvert"
        :width="36"
        :height="22"
        colorInactive="lighter"
        colorActive="yellow-cm")
    div(class="flex-between-center typo-h5 py-8")
      div(class="flex gap-8")
        svg-icon(
          class="bg-yellow-cm text-dark-6 rounded-full"
          iconName="crown"
          iconWidth="24px")
        span {{ $t('CM0082') }}
        svg-icon(
          iconName="information-circle"
          iconWidth="24px"
          @click="() => editorStore.setDescriptionPanel('hidden-message/bgrm')")
      toggle-btn(
        class="payment__trial__toggle"
        v-model="isBgRemove"
        :width="36"
        :height="22"
        colorInactive="lighter"
        colorActive="yellow-cm")
    footer-bar(
      :title="$t('CM0083')"
      @cancel="cancelPreprocess"
      @apply="applyPreprocess")
</template>

<script lang="ts" setup>
import FooterBar from '@/components/panel-content/FooterBar.vue'
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { useGlobalStore } from '@/stores/global'
import { useImgSelectorStore } from '@/stores/imgSelector'
import vuex from '@/vuex'
import { notify } from '@kyvg/vue3-notification'
import ToggleBtn from '@nu/shared-lib/components/ToggleBtn.vue'
import LazyLoad from '@nu/vivi-lib/components/LazyLoad.vue'
import ObserverSentinel from '@nu/vivi-lib/components/ObserverSentinel.vue'
import SearchBar from '@nu/vivi-lib/components/SearchBar.vue'
import Tabs from '@nu/vivi-lib/components/Tabs.vue'
import LoadingBrick from '@nu/vivi-lib/components/global/LoadingBrick.vue'
import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { IPhotoItem } from '@nu/vivi-lib/interfaces/api'
import type { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import type { IImage } from '@nu/vivi-lib/interfaces/layer'
import store from '@nu/vivi-lib/store'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import type { IAlbum, IAlbumContent } from '@nu/vivi-lib/utils/cmWVUtils'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import paymentUtils from '@nu/vivi-lib/utils/paymentUtils'
import uploadUtils from '@nu/vivi-lib/utils/uploadUtils'
import { find, pull } from 'lodash'

const globalStore = useGlobalStore()
const { debugMode } = storeToRefs(globalStore)

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
    type: 'public',
    assetId: '2401121516235673dNRg71v',
    userId: 'zKocTWh1Ry9ITYr0kaPf',
    ratio: 3652 / 5477,
  },
  {
    type: 'public',
    assetId: '240112151638444L4OwJ97s',
    userId: 'zKocTWh1Ry9ITYr0kaPf',
    ratio: 3376 / 4220,
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
const { setCurrActiveFeature } = editorStore
const { editorType } = storeToRefs(editorStore)
const { setImgAspectRatio, setPageSize } = editorStore
const { replaceImgFlag } = useImgSelectorStore()

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
    if (img && img.flag && img.msg === 'User canceled.') {
      // The user didn't take a photo, do nothing.
      return
    }
    if (!img || img.flag) {
      notify({ group: 'error', text: `Camera img select error: ${img?.msg}` })
      return
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
const imgSelectorStore = useImgSelectorStore()
const { targetEditorType } = storeToRefs(imgSelectorStore)
const { closeImageSelector } = imgSelectorStore
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
  beforeSendToEditor()
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
  if (props.requireNum === 1) beforeSendToEditor()
}

const beforeSendToEditor = () => {
  if (atEditor.value && editorType.value === 'hidden-message' && !srcPreprocessImg.value) {
    srcPreprocessImg.value = imageUtils.getSrc(targetImgs[0])
    return
  }
  sendToEditor()

  // prevent we adding the image to the editor too early, cause the image position in wrong place
  if (!atEditor.value) {
    setPageSize(900, 1600)
  }
}

const sendToEditor = async (isBgRemove = false) => {
  if (replaceImgFlag) {
    imageUtils.replaceImg(
      targetImgs[0],
      imageUtils.getSrc(targetImgs[0], 'prev'),
      targetImgs[0].ratio,
    )
  } else {
    const initAtEditor = atEditor.value

    if (!initAtEditor) {
      setImgAspectRatio(targetImgs[0].ratio)
      targetEditorType.value && editorStore.startEditing(targetEditorType.value)
    }

    nextTick(() => {
      targetImgs.forEach((img) => {
        // if we aren't at editor at beginning, we need to fit the image, and don't need to record
        assetUtils.addImage(img, img.ratio, {
          record: initAtEditor,
          styles: {
            adjust: {
              ...(editorType.value === 'hidden-message' && {
                saturate: -100,
                brightness: 10,
                contrast: 20,
              }),
              invert: +isInvert.value,
            },
          },
          ...(!initAtEditor && { fit: 1 }),
        })
      })
      if (isBgRemove) {
        editorUtils.setCurrActivePanel('cm_remove-bg')
        store.commit('bgRemove/SET_isProcessing', true)

        const src = imageUtils.getSrc(layerUtils.getCurrLayer as IImage, 'larg')
        generalUtils.toDataURL(src, (dataUrl: string) => {
          setCurrActiveFeature('cm_brush')
          uploadUtils.uploadAsset('cm-bg-remove', [dataUrl])
        })
      }
      if (!initAtEditor || (editorType.value === 'hidden-message' && !isBgRemove)) {
        groupUtils.deselect()
      }
    })
  }
  closeImageSelector()
  srcPreprocessImg.value = null
}
// #endregion

// #region get the first album image content
isLoadingContent.value = true
cmWVUtils
  .getAlbumList()
  .then(async (res) => {
    isLoadingContent.value = false
    if (!res) return // For browser version
    if (res.flag === 1) {
      modalUtils.setModalInfo('Error', res.msg)
      return
    }

    smartAlbum.push(...res.smartAlbum)
    myAlbum.push(...res.myAlbum)

    const recentAlbum = smartAlbum.find((album) =>
      ['recents', '最近項目'].includes(album.title.toLowerCase()),
    )
    Object.assign(currAlbum, recentAlbum)
    if (recentAlbum?.albumId) {
      getAlbumContent(recentAlbum).then(() => {
        initLoaded.value = true
      })
    } else if (smartAlbum.length > 0) {
      getAlbumContent(smartAlbum[0]).then(() => {
        initLoaded.value = true
      })
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
  targetImgs = []
}
const applyPreprocess = () => {
  sendToEditor(isBgRemove.value)
}
watch(isBgRemove, (newVal) => {
  if (debugMode.value) return
  if (newVal && !paymentUtils.checkProApp({ plan: 1 })) {
    isBgRemove.value = false
  }
})
// #endregion
</script>

<style lang="scss"></style>
