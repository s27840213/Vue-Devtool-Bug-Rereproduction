<template lang="pug">
  div(class="home")
    nu-header
    div(class="home-content")
      template(v-if="isMobile")
        div(class="home-content__top")
          img(class="home-content__top-img"
            style="height: 150px;")
          div(class="home-content__top-title") 海量精美電商模板等您使用！
          div(class="home-content__top-mobile-subtitle")
            div Vivipic 提供無數免費的專業模板，快立刻開始編輯吧！
            div(class="pt-30") *僅供電腦版編輯
      template(v-else)
        div(class="home-content__top")
          img(class="home-content__top-img"
            :style="`height: ${isLogin ? '250px;' : '350px;'}`")
          div(class="home-content__top-title") 海量精美電商模板等您使用！
          div(v-if="!isLogin"
            class="home-content__top-subtitle")
            span Vivipic 幫助您快速創建精美而令人印象深刻的電商圖片。
            br
            span 瀏覽我們提供的無數個免費的專業模板，並立刻開始編輯吧！
          div(v-if="isLogin"
            class="home-content__top-btns")
            div(class="rounded home-btn"
              @click="goToPage('TemplateCenter')") 瀏 覽 模 板
            div(class="rounded home-btn"
              @click="goToPage('MyDesign')") 我 的 設 計
          div(v-else
            class="home-content__top-btn rounded home-btn"
            :type="'primary-lg'"
            @click="newDesign()") 開 始 製 作
      div(class="home-content-title label-lg") 開始設計圖片
      div(class="home-content-theme")
        scroll-list(:list="themeList" type='theme'
          @openPopup="openPopup()")
      div(v-if="!isLogin"
        class="home-content-plaque")
        img(:src="require('@/assets/img/jpg/homepage/home-plaque.jpg')")
        div(class="home-content-plaque-title") 立即享受海量的精美電商模板
        div(class="home-content-plaque-subtitle") Vivipic 幫助您快速創建精美而令人印象深刻的電商圖片。經營電商太忙碌，讓設計成為最不必煩惱的小事。
      div(v-if="!isLogin"
        class="home-content-feature")
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
            img(:src="require(`@/assets/img/jpg/homepage/feature${featureSelected+1}.jpg`)")
          div(class="home-content-feature-text")
            div(class="pb-20") {{featureContent}}
            btn(:type="'primary-mid'" class="rounded"
              @click.native="newDesign()") 開 始 製 作
      div(v-if="isLogin")
        div(class="home-content-title label-lg")
          span 我的設計
          span(class="pointer body-1 more"
          @click="goToPage('MyDesign')") 更多
        div(class="home-content__mydesign")
          scroll-list(:list="allDesigns" type='design'
            :isLoading="isDesignsLoading")
      div(class="home-content-title label-lg")
        div
          span(v-for="tag in tags"
            class="pointer mr-20"
            @click="newDesign(tag)") {{'#' + tag}}
        span(class="pointer body-1 more"
          @click="goToTemplateCenterSearch(tagString.replaceAll(',', ' '))") 更多
      div(class="home-content__template")
        scroll-list(:list="tagTemplateList" type='template')
      div(class="home-content-title label-lg")
        span 熱門模板
        span(class="pointer body-1"
          @click="goToTemplateCenterSortBy('popular')") 更多
      div(class="home-content__template")
        scroll-list(:list="popularTemplateList" type='template')
      div(class="home-content-title label-lg")
        span 最新模板
        span(class="pointer body-1"
          @click="goToTemplateCenterSortBy('recent')") 更多
      div(class="home-content__template")
        scroll-list(:list="latestTemplateList" type='template')
      nu-footer(class="mt-100")
      div(v-if="showSizePopup"
        class="home__size")
        popup-size(@close="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'
import PopupSize from '@/components/popup/PopupSize.vue'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'

export default Vue.extend({
  name: 'Home',
  components: {
    NuHeader,
    NuFooter,
    ScrollList,
    PopupSize
  },
  data() {
    return {
      themeList: [] as Itheme[],
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
      showSizePopup: false,
      featureSelected: 0,
      tagString: 'IG,母嬰,雙十一,特價',
      tags: [] as string[],
      tagTemplateList: [],
      popularTemplateList: [],
      latestTemplateList: [],
      isTimerStop: false,
      AutoPlayTimer: 0 as number,
      CoolDownTimer: 0 as number
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      allDesigns: 'design/getAllDesigns',
      isDesignsLoading: 'design/getIsDesignsLoading'
    }),
    isMobile (): boolean {
      return window.screen.width / window.screen.height < 1
    },
    featureContent(): string {
      return this.featureList[this.featureSelected].content
    }
  },
  async mounted() {
    this.AutoPlayTimer = setInterval(() => {
      if (!this.isTimerStop) {
        if (this.featureSelected === this.featureList.length - 1) {
          this.featureSelected = 0
        } else {
          this.featureSelected++
        }
      }
    }, 4000)

    designUtils.fetchDesigns(this.fetchAllDesigns)
    const response = await this.getThemeList()
    this.themeList = response.data.content

    const squareTheme = [] as number[]
    this.themeList.forEach((theme: Itheme) => {
      if (theme.width / theme.height === 1) {
        squareTheme.push(theme.id)
      }
    })
    const theme = squareTheme.join(',')

    let keyword = this.tagString.replaceAll(',', ' ')
    this.tags = this.tagString.split(',')
    const tagTemplate = await this.getTagContent({ keyword, theme })
    this.tagTemplateList = tagTemplate.data.content[0].list

    keyword = 'locale::tw;;order_by::popular'
    const popularTemplate = await this.getTagContent({ keyword, theme })
    this.popularTemplateList = popularTemplate.data.content[0].list

    keyword = 'locale::tw;;order_by::time'
    const latestTemplate = await this.getTagContent({ keyword, theme })
    this.latestTemplateList = latestTemplate.data.content[0].list
  },
  methods: {
    ...mapActions({
      getThemeList: 'homeTemplate/getThemeList',
      getTagContent: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }
    ),
    goToPage(pageName: string, queryString = '') {
      if (queryString) {
        this.$router.push({ name: pageName, query: { search: queryString } })
      } else {
        this.$router.push({ name: pageName })
      }
    },
    goToTemplateCenterSearch(search = '') {
      this.$router.push({ name: 'TemplateCenter', query: { q: search } })
    },
    goToTemplateCenterSortBy(sortBy = '') {
      this.$router.push({ name: 'TemplateCenter', query: { sort: sortBy } })
    },
    newDesign(search = '') {
      if (search) {
        this.$router.push({ name: 'Editor', query: { search: search } }).then(() => {
          designUtils.newDesign()
        })
      } else {
        this.$router.push({ name: 'Editor' }).then(() => {
          designUtils.newDesign()
        })
      }
    },
    featureItemClicked(idx: number) {
      this.isTimerStop = true
      this.featureSelected = idx
      window.clearInterval(this.CoolDownTimer) // use the latest cool down time
      this.CoolDownTimer = setTimeout(() => {
        this.isTimerStop = false
      }, 10000)
    },
    openPopup() {
      this.showSizePopup = true
    },
    closePopup() {
      this.showSizePopup = false
    }
  }
})
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  &__size {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000a1;
    z-index: 999999;
  }
}
.home-content {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: scroll;
  height: calc(100% - 50px);
  &-title {
    display: flex;
    justify-content: space-between;
    text-align: left;
    padding: 60px 10vw 20px 10vw;
    @include layout-mobile {
      font-size: 16px;
      padding: 40px 5vw 20px 5vw;
    }
    .more {
      white-space: nowrap;
    }
  }
  &__top {
    position: relative;
    display: flex;
    justify-content: center;
    &-img {
      width: 100%;
      background-size: cover;
      background-image: url('~@/assets/img/jpg/homepage/home-top.jpg');
      @include layout-mobile {
        background-image: url('~@/assets/img/jpg/homepage/home-top-mobile.jpg');
      }
    }
    &-title {
      position: absolute;
      top: 60px;
      color: setColor(dark-blue);
      font-size: 40px;
      font-weight: 700;
      line-height: 1.3;
      @media screen and (max-width: 990px) {
        font-size: 32px;
      }
      @include layout-mobile {
        top: 40px;
        font-size: 16px;
      }
    }
    &-subtitle {
      position: absolute;
      top: 125px;
      font-size: 20px;
      line-height: 2;
      @media screen and (max-width: 990px) {
        font-size: 16px;
      }
    }
    &-mobile-subtitle {
      position: absolute;
      font-size: 12px;
      color: setColor(gray-2);
      top: 45%;
      transform: scale(0.9);
    }
    &-btns {
      position: absolute;
      top: 140px;
      display: flex;
      justify-content: space-evenly;
      width: 500px;
    }
    &-btn {
      position: absolute;
      top: 240px;
    }
  }
  &-theme, &__mydesign, &__template {
    padding: 0 10%;
    @include layout-mobile {
      padding: 0 5%;
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
    > img {
      width: 100%;
    }
    &-title {
      position: absolute;
      top: 34%;
      font-size: 1.6vw;
      font-weight: 700;
      line-height: 1.3;
      color: setColor(white);
    }
    &-subtitle {
      position: absolute;
      top: 57%;
      font-size: 1.1vw;
      color: setColor(white);
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
        filter: drop-shadow(0px 3px 15px rgba(0, 0, 0, 0.25));
        border-radius: 8px;
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
      background: #09467e;
      color: white;
    }
  }
}
.home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 200px;
  height: 40px;
  font-size: 20px;
  font-weight: 700;
  color: setColor(white);
  background: setColor(blue-1);
  @media screen and (max-width: 990px) {
    width: 160px;
    height: 35px;
    font-size: 16px;
  }
}
.x-scrollbar {
  display: grid;
  column-gap: 30px;
  grid-template-columns: auto;
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
