<template lang="pug">
  div(class="home" :style="homeStyle")
    new-header(:isTop="isTop")
    div(class="home-content" ref="content" @scroll="onScroll")
      div(class="home-top")
        div(class="home-top-text")
          span(class="home-top-text__title" v-html="title")
          span(class="home-top-text__description") {{$t('NN0465')}}
          animation(v-for="cb in colorBlock"
            :class="`home-top__colorBlock ${cb.name.replace('.json', '')}`"
            :path="'/lottie/' + cb.name")
        iframe(title="Vivipic" class="home-top__yt"
          :src="`https://www.youtube.com/embed/${ytId}?playsinline=1&autoplay=1&mute=1`"
          frameborder="0" allowfullscreen)
        div(class="home-top__buttom home__float-start rounded btn-primary-sm ")
          router-link(to="/editor"
            class="home-top__buttom__text btn-LG")
            span {{$t('NN0391')}}
      scroll-list(v-if="!isMobile || isLogin"
        type="theme" @openSizePopup="openSizePopup()")
      scroll-list(v-if="isLogin"
        type="mydesign")
      template(v-if="isLogin")
        scroll-list(v-for="theme in themeList"
          type="template" :theme="theme")
      div(class="home-block")
        ta-block(v-for="item in blocklist"
          :content="item")
      nu-footer(:isHome="true")
      div(v-if="showSizePopup"
        class="popup-window")
        popup-size(@close="closeSizePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import i18n from '@/i18n'
import NewHeader from '@/components/new-homepage/NewHeader.vue'
import Animation from '@/components/Animation.vue'
import ScrollList from '@/components/new-homepage/ScrollList.vue'
import TaBlock from '@/components/new-homepage/TaBlock.vue'
import NuFooter from '@/components/new-homepage/NuFooter.vue'
import PopupSize from '@/components/popup/PopupSize.vue'
import _ from 'lodash'
import blocklistData from '@/assets/json/newHomepageBlock.json' // todo rename

export default Vue.extend({
  name: 'Home',
  components: {
    NewHeader,
    Animation,
    ScrollList,
    TaBlock,
    NuFooter,
    PopupSize
  },
  data() {
    return {
      showSizePopup: false,
      isTop: true,
      themeList: ['1,2', '3', '8', '6', '5', '7', '9'],
      colorBlock: [
        { name: 'vector_lightblue2.json' },
        { name: 'vector_pink1.json' },
        { name: 'oval_pink4.json' },
        { name: 'oval_yellow1.json' }
      ]
    }
  },
  metaInfo() {
    return {
      title: `${this.$t('SE0001')}`,
      meta: [{
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'og:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'og:title'
      }, {
        property: 'og:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'og:image'
      }, {
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'twitter:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'twitter:title'
      }, {
        property: 'twitter:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'twitter:image'
      }, {
        property: 'twitter:description',
        content: `${this.$t('OG0002')}`,
        vmid: 'twitter:description'
      }, {
        property: 'og:url',
        content: `${this.$t('OG0005')}`,
        vmid: 'og:url'
      }]
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    ...mapState({
      isMobile: 'isMobile',
      isLargeDesktop: 'isLargeDesktop'
    }),
    title(): string {
      return (i18n.t('NN0464') as string)
        .replace('<blue>', '<span class="text-blue-1">')
        .replace('</blue>', '</span>')
    },
    blocklist(): typeof blocklistData { // legal??
      const blocklist = blocklistData.filter((item) => {
        return !(i18n.locale === 'us' && item.img.name === 'e-commerce.json')
      })
      // Set align as row, row-reverse alternately.
      for (let i = 1; i < blocklist.length; i++) {
        if (blocklist[i].align === 'alternately') {
          blocklist[i].align = blocklist[i - 1].align === 'row' ? 'row-reverse' : 'row'
        }
      }
      return blocklist
    },
    ytId() {
      return i18n.locale === 'us' ? 'GRSlz37Njo0'
        : i18n.locale === 'jp' ? 'FzPHWU0O1uI'
          : i18n.locale === 'tw' ? 'BBVAwlBk_zA' : 'GRSlz37Njo0'
    },
    homeStyle(): Record<string, string> {
      return i18n.locale === 'us' ? { 'font-family': 'Poppins' } : { 'font-family': 'NOTO SANS TC' }
    }
  },
  created() {
    if (i18n.locale === 'us') {
      this.themeList = _.without(this.themeList, '7')
    }
    if (!this.isLogin) {
      this.themeList = this.themeList.filter((val, index) => {
        return index <= 4
      })
    }
  },
  methods: {
    openSizePopup() {
      this.showSizePopup = true
    },
    closeSizePopup() {
      this.showSizePopup = false
    },
    onScroll() {
      this.isTop = (this.$refs.content as HTMLElement).scrollTop === 0
    }
  }
})
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: left;
}
.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  overflow-y: scroll;
  height: calc(100% - 50px); // why 50?(gary)
}
.home-top{
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  // position: -webkit-sticky; // For safari < 13
  position: relative;
  &-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    &__title {
      color: setColor(gray-1);
    }
    &__description {
      color: setColor(gray-2);
    }
  }
  &__colorBlock {
    position: absolute;
    z-index: -1;
  }
  &__buttom{
    margin-top: 25px;
    width: 216px; // consider padding 有沒有更好的方式？
    height: 44px;
    box-shadow: 0px 9px 13px 0px #7190CC40;
    &__text {
      color: setColor(white);
      text-decoration: none;
    }
  }
  .vector_lightblue2 {
    width: 85px; height: 87px;
  }
  .vector_pink1 {
    width: 139px; height: 118px;
  }
  .oval_pink4 {
    width: 70px; height: 70px;
  }
  .oval_yellow1 {
    width: 45px; height: 46px;
  }
}
@media screen and (max-width: 768px) {
  .home-top {
    min-height: 400px;
    width: 327px;
    margin-top: 20px;
    &-text {
      &__title {
        @include text-H3
      }
      &__description {
        @include body-MD
      }
    }
    &__yt {
      width: 320px;
      height: 180px;
    }
    .vector_lightblue2 {
      top: 42px; left: 14px;
    }
    .vector_pink1 {
      top: -12px; left: 319px;
    }
    .oval_pink4, .oval_yellow1 {
      display: none;
    }
  }
  .home__float-start {
    position: fixed;
    width: 70%;
    bottom: 30px;
    z-index: 1; // a better layer? why nu-headre will not work
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .home-top {
    min-height: 724px;
    width: 768px;
    margin-top: 160px;
    &-text {
      width: 560px; // todo ? 500 560
      &__title {
        @include text-H2
      }
      &__description {
        @include body-LG
      }
    }
    &__yt {
      width: 720px;
      height: 405px;
    }
    .vector_lightblue2 {
      top: 9px; left: 67px;
    }
    .vector_pink1 {
      top: -8px; left: 581px;
    }
    .oval_pink4, .oval_yellow1 {
      display: none;
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .home-top {
    min-height: 724.15px;
    width: 1241px;
    margin-top: 160px;
    &-text {
      &__title {
        @include text-H1
      }
      &__description {
        @include body-LG
      }
    }
    &__yt {
      width: 800px;
      height: 449.9px;
    }
    .vector_lightblue2 {
      top: 50px; left: 146px;
    }
    .vector_pink1 {
      top: 11px; left: 964px;
    }
    .oval_pink4 {
      top: 327px; left: 17px;
    }
    .oval_yellow1 {
      top: 259px; left: 1158px;
    }
  }
}
</style>
