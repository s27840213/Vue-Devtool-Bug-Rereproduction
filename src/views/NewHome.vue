<template lang="pug">
  div(class="home")
    new-header(:isTop="isTop")
    div(class="home-content" ref="content" @scroll="onScroll")
      div(class="home-top"
        :style="homeTopStyle")
        div(class="home-top__text")
          i18n(:path="'NN0460'" tag="span")
            template(#newline)
              br
          div(class="home-top__underline"
            :style="unterlineStyle")
          img(class="home-top__dot"
            src="@/assets/img/svg/newHomepage/dot-and-cursor.svg"
            :style="dotStyle")
          div(v-if="!isMobile"
            class="home-top__buttom rounded btn-primary-sm")
            router-link(to="/editor"
              class="home-top__buttom__text btn-LG")
              span {{$t('NN0391')}}
          div(class="home-top__buttom rounded btn-primary-sm"
            @click="test()")
            span(class="home-top__buttom__text btn-LG") test：
            span(class="mobile") mobile
            span(class="tablet") tablet
            span(class="desktop") desktop
        animation(class="home-top__video"
          path='@/assets/img/svg/newHomepage/demo.mp4'
          :width="isLargeDesktop ? 656 : 327")
          //- need control? loop?
      scroll-list(v-if="!isMobile || isLogin"
        type="theme"
        @openSizePopup="openSizePopup()")
      scroll-list(v-if="isLogin"
        type="mydesign")
      scroll-list(v-if="isLogin"
        v-for="theme in themeList"
        :theme="theme"
        type="template")
      div(class="home-block")
        ta-block(v-for="item in blocklist"
          :content="item")
      nu-footer(:isHome="true")
      div(v-if="showSizePopup"
        class="home__size-popup")
        popup-size(@close="closeSizePopup()")
      div(v-if="isMobile"
        class="home__float-start home-top__buttom rounded btn-primary-sm")
        router-link(to="/editor"
          class="home-top__buttom__text btn-LG")
          span {{$t('NN0391')}}
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

import blocklist from '@/assets/json/newHomepageBlock.json'

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
      blocklist,
      showSizePopup: false,
      isTop: true,
      themeList: ['1,2', '3', '8', '6', '5', '7', '9']
    }
  },
  // need meta info?
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    ...mapState({
      isMobile: 'isMobile',
      isLargeDesktop: 'isLargeDesktop'
    }),
    homeTopStyle(): Record<string, string> {
      return {
        'flex-direction': this.isMobile ? 'column' : 'row',
        'align-items': this.isMobile ? 'flex-start' : 'center',
        width: this.isMobile ? 'auto' : '80%'
      }
    },
    unterlineStyle(): Record<string, string> {
      return i18n.locale === 'us' ? {
        top: this.isMobile ? '70px' : '102px',
        left: this.isMobile ? '28px' : '39px',
        width: this.isMobile ? '209px' : '286px',
        height: '14px'
      } : i18n.locale === 'tw' ? {
        top: this.isMobile ? '25px' : '38px',
        left: this.isMobile ? '65px' : '85px',
        width: this.isMobile ? '115px' : '160px',
        height: this.isMobile ? '14px' : '16px'
      } : i18n.locale === 'jp' ? {
        top: this.isMobile ? '25px' : '38px',
        left: this.isMobile ? '0px' : '0px',
        width: this.isMobile ? '115px' : '160px',
        height: this.isMobile ? '14px' : '16px'
      } : {}
    },
    dotStyle(): Record<string, string> {
      return i18n.locale === 'us' ? {
        top: this.isMobile ? '108px' : '153.25px',
        left: this.isMobile ? '221px' : '305px'
      } : i18n.locale === 'tw' ? {
        top: this.isMobile ? '114px' : '160px',
        left: this.isMobile ? '138px' : '195px'
      } : i18n.locale === 'jp' ? {
        top: this.isMobile ? '100px' : '142px',
        left: this.isMobile ? '260px' : '365px'
      } : {}
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
    test() { // todo delete
      alert(`window: ${document.body.clientWidth}x${document.body.clientHeight}\nisMobile: ${this.isMobile}\nisLD: ${this.isLargeDesktop}`)
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
  font-family: Poppins;
  // white-space: pre;
  // word-wrap: break-word;
  text-align: left;
}
.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  // overflow-x: scroll;
  overflow-y: scroll;
  height: calc(100% - 50px); // why 50?(gary)
}
.home-top{
  display: flex;
  justify-content: space-around;
  align-items: center;
  // width: 80%;
  // min-height: 566px; // not work
  &__text{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    white-space: pre;
  }
  &__underline{
    position: absolute;
    z-index: -1; // find better way
    background-color: setColor(blue-1)
  }
  &__dot{
    position: absolute;
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
}
.home__size-popup { // 有屬於popup的scss嗎？ 開一個新的？
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000000a1;
  z-index: setZindex('popup');
}
.home__float-start {
  position: fixed;
  width: 70%;
  bottom: 50px;
}
@media screen and (max-width: 768px) {
  .mobile { // to-delete
    display: block;
  }
  .tablet, .desktop {
    display: none;
  }
  .home-top {
    min-height: 437px;
    &__text {
      @include text-H3
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .tablet {
    display: block;
  }
  .mobile, .desktop {
    display: none;
  }
  .home-top {
    min-height: 366px;
    &__text {
      @include text-H1
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .desktop {
    display: block;
  }
  .tablet, .mobile {
    display: none;
  }
  .home-top {
    min-height: 566px;
    &__text {
      @include text-H1
    }
  }
}
// @media screen and (max-width: 1023px) {
//   .isComputer {
//     display: none;
//   }
// }
</style>
