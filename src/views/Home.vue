<template lang="pug">
  div(class="home")
    nu-header
    div(class="home-content")
      div(class="home-content-video")
        div(class="home-content-video-img")
          img(:src="require('@/assets/img/png/home-video.png')")
        div(class="home-content-video-text")
          div(class="heading-3 pb-15") 海量精美電商模板等您使用！
          div(class="subtitle-1 pb-5"
          style="font-weight: 400;") Vivipic 幫助您快速創建精美而令人印象深刻的電商圖片。
          div(class="subtitle-1 pb-20"
          style="font-weight: 400;") 瀏覽我們提供的無數個免費的專業模板，並立刻開始編輯吧！
          btn(:type="'primary-mid'"
            class="rounded" @click.native="goToPage('Editor')") 開 始 製 作
        //- img(:src="require('@/assets/img/png/homepage_video_img.png')")
      div(class="home-content-title label-lg") 開始設計圖片
      div(class="home-content-size")
        div
          img(:src="require('@/assets/img/png/plus-origin.png')")
          div(class="pt-10 body-1") 自訂尺寸
        div(v-for="item in sizeList")
          img(:src="require(`@/assets/img/svg/home-size/${item.name}.svg`)")
          div(class="pt-10 body-1") {{item.title}}
          div(class="pt-2 body-2 text-gray-2") {{item.size}}
      div(class="home-content-plaque")
        img(:src="require('@/assets/img/png/home-plaque.png')")
        div(class="home-content-plaque-title") 立即享受海量的精美電商模板
        div(class="home-content-plaque-subtitle") Vivipic 幫助您快速創建精美而令人印象深刻的電商圖片。經營電商太忙碌，讓設計成為最不必煩惱的小事。
      div(class="home-content-feature")
        div(style="width: 100%;")
          div(style="height: 140px;" class="x-scrollbar")
            btn(v-for="item, idx in featureList" :type="'icon-mid'"
            class="home-content-feature-item"
            :class="{'selected': featureSelected === idx}"
            @click.native="featureItemClicked(idx)")
              svg-icon(:iconName="featureSelected === idx ? `${item.name}-s` : `${item.name}`"
              :iconWidth="'40px'")
              div(class="pt-10 body-2") {{item.title}}
        div(class="home-content-feature-content")
          div(class="home-content-feature-img")
            img(:src="require('@/assets/img/png/home-video.png')")
          div(class="home-content-feature-text")
            div(class="pb-20") {{featureContent}}
            btn(:type="'primary-mid'"
            class="rounded" @click.native="goMakeClicked()") 開 始 製 作
      div(class="home-content-title label-lg")
        div
          template(v-for="tag in tags")
            span(class="pointer mr-20"
            @click="goToPage('Editor', tag)") {{'#' + tag}}
        span(class="pointer body-1 more"
        @click="goToPage('Editor', tagString.replaceAll(',', ' '))") 更多
      div(class="home-content-template")
        scroll-list(:list="tagTemplateList")
      div(class="home-content-title label-lg")
        span 熱門模板
        span(class="pointer body-1"
        @click="goToPage('Editor', 'locale::tw;;order_by::popular')") 更多
      div(class="home-content-template")
        scroll-list(:list="popularTemplateList")
      div(class="home-content-title label-lg")
        span 最新模板
        span(class="pointer body-1"
        @click="goToPage('Editor', 'locale::tw;;order_by::time')") 更多
      div(class="home-content-template")
        scroll-list(:list="latestTemplateList")
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'

export default Vue.extend({
  name: 'Home',
  components: {
    NuHeader,
    NuFooter,
    ScrollList
  },
  data() {
    return {
      sizeList: [
        {
          name: 'fb',
          title: 'Facebook',
          size: '1080 x 1080'
        },
        {
          name: 'ig-post',
          title: 'IG 貼文',
          size: '1080 x 1080'
        },
        {
          name: 'ig-story',
          title: 'IG 限時動態',
          size: '9:16'
        },
        {
          name: 'line-broadcast',
          title: 'Line 推播',
          size: '1040 x 1040'
        },
        {
          name: 'eco-product',
          title: '電商商品圖',
          size: '1080 x 1080'
        },
        {
          name: 'eco-banner',
          title: '電商 Banner',
          size: '2000 x 1000 (2:1)'
        },
        {
          name: 'eco-detail',
          title: '電商詳情頁',
          size: '1000 x 不限'
        }
      ],
      featureList: [
        {
          name: '1',
          title: '限時免費試用！',
          content: ''
        },
        {
          name: '2',
          title: '上千個專業的精美模板',
          content: 'Vivipic 提供上千個由專業設計師製作的電商模板，風格多樣且適合各種行業'
        },
        {
          name: '3',
          title: '專為瞬息萬變的電商而生',
          content: '使用符合臺灣人口味的模板，快速製作出你心目中的電商圖片'
        },
        {
          name: '4',
          title: 'LINE 行銷嘛欸通',
          content: '不只是 Facebook 和 Instagram，包含電商商品、官網用圖，甚至是 LINE 推播圖片也一應俱全'
        },
        {
          name: '5',
          title: '提供精美素材媒體庫',
          content: 'Vivipic 擁有你在設計路上需要的必要素材。超過 200 萬張的可商用圖庫、定期新增的插圖素材、背景、圖示等等。'
        }
      ],
      featureSelected: 0,
      tagString: '萬聖節,母嬰,雙十一,特價',
      tags: [] as string[],
      tagTemplateList: [],
      popularTemplateList: [],
      latestTemplateList: []
    }
  },
  computed: {
    ...mapGetters('homeTemplate', [
      'getApiResponse'
    ]),
    featureContent(): string {
      return this.featureList[this.featureSelected].content
    }
  },
  async mounted() {
    window.setInterval(() => {
      if (this.featureSelected === this.featureList.length - 1) {
        this.featureSelected = 0
      } else {
        this.featureSelected++
      }
    }, 4000)

    const a = await this.getApiResponse
    console.log('getApiResponse', a)

    let keyword = this.tagString.replaceAll(',', ' ')
    this.tags = this.tagString.split(',')
    const tagTemplate = await this.getTagContent({ keyword })
    this.tagTemplateList = tagTemplate.data.content[0].list

    keyword = 'locale::tw;;order_by::popular'
    const popularTemplate = await this.getTagContent({ keyword })
    this.popularTemplateList = popularTemplate.data.content[0].list

    keyword = 'locale::tw;;order_by::time'
    const latestTemplate = await this.getTagContent({ keyword })
    this.latestTemplateList = latestTemplate.data.content[0].list
  },
  methods: {
    ...mapActions('homeTemplate',
      [
        'getTagContent'
      ]
    ),
    goToPage(pageName: string, queryString = '') {
      if (queryString) {
        this.$router.push({ name: pageName, query: { search: queryString } })
      } else {
        this.$router.push({ name: pageName })
      }
    },
    featureItemClicked (idx: number) {
      this.featureSelected = idx
      console.log(idx)
    }
  }
})
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
}
.home-content {
  display: flex;
  flex-direction: column;
  padding-top: 50px;
  padding-bottom: 100px;

  &-title {
    display: flex;
    justify-content: space-between;
    text-align: left;
    padding: 4vw 10vw 1.5vw 10vw;

    .more {
      white-space: nowrap;
    }
  }
  &-video {
    display: flex;
    justify-content: center;
    padding: 5vw 0;

    &-img {
      width: 40vw;
      > img {
        width: 100%;
        height: 100%;
      }
    }

    &-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: left;
      font-family: Mulish;
      padding-left: 5vw;

      > button {
        width: 40%;
        height: 45px;
        padding: 5px 30px;
      }
    }
  }
  &-size {
    display: grid;
    align-items: center;
    column-gap: 50px;
    grid-template-columns: auto;
    justify-content: start;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow: scroll;
    text-align: left;
    padding: 0 12vw;

    &::-webkit-scrollbar {
      display: none;
    }

    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
  &-plaque {
    display: flex;
    justify-content: center;
    position: relative;
    padding: 36px 0;

    @media screen and (min-width: 990px) {
      padding: 56px 0;
    }

      &-title {
        position: absolute;
        top: 34%;
        font-size: 1.6vw;
        font-weight: 700;
        line-height: 1.3;
      }
      &-subtitle {
        position: absolute;
        top: 57%;
        font-size: 1.1vw;
      }
  }

  &-feature {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 0 10%;

    &-item {
      cursor: pointer;
      width: 200px;
      height: 128px;
      border: 1px solid #f4f4f5;
      border-radius: 8px;
      padding: 24px 16px;

      &:hover {
        background: setColor("gray-5");
      }
    }

    &-content {
      display: flex;
      justify-content: center;
      width: 100%;
      padding-top: 2vw;
    }
    &-img {
      width: 35%;
      > img {
        width: 100%;
      }
    }
    &-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 30%;
      font-size: 18px;
      line-height: 40px;
      font-weight: 400;
      text-align: left;
      padding-left: 5vw;

      > button {
        width: 40%;
        height: 45px;
        padding: 5px 30px;
      }
    }

    .selected {
      background: #09467E;
      color: white;
    }
  }

  &-template {
    padding: 0 10%;
  }
}

.x-scrollbar {
  display: grid;
  column-gap: 30px;
  grid-template-columns: auto;
  justify-content: center;
  grid-auto-flow: column;
  scroll-behavior: smooth;
  overflow-x: scroll;
  overflow-y: hidden;
  text-align: left;
  &::-webkit-scrollbar {
    display: none;
  }
}
.x-scrollbar::-webkit-scrollbar {
    display: none;
}
</style>
