<template lang="pug">
  div(class="home")
    new-header()
    div(class="home-content")
      div(class="home-top")
        div(class="home-top__text text-H1")
          span {{'Become\na Pro Designer\nin few clicks.'}}
          div(class="home-top__underline")
          img(class="home-top__dot"
            src="@/assets/img/svg/newHomepage/dot-and-cursor.svg")
          div(class="home-top__buttom rounded btn-primary-sm")
            span(class="home-top__buttom__text btn-LG") Get Started
        animation(class="home-top__video"
          path='@/assets/img/svg/newHomepage/demo.mp4'
          :width='468')
          //- need control? loop?
      scroll-list(v-if="!isMobile"
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
      nu-footer
      div(v-if="showSizePopup"
        class="home__size-popup")
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
import NuFooter from '@/components/NuFooter.vue'
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
      themeList: ['1,2', '3', '8', '6', '5', '7', '9']
    }
  },
  // need meta info?
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    ...mapState({
      isMobile: 'isMobile'
    })
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
  white-space: pre;
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
  justify-content: space-between;
  align-items: center;
  width: 1020px;
  min-height: 566px; // not work
  &__text{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
  }
  &__underline{
    position: absolute;
    top: 102px;
    left: 39px;
    width: 286px;
    height: 14px;
    z-index: -1; // find better way
    background-color: setColor(blue-1)
  }
  &__dot{
    position: absolute;
    top: 153.25px;
    left: 266.5px;
  }
  &__buttom{
    margin-top: 25px;
    width: 216px; // consider padding 有沒有更好的方式？
    height: 44px;
    box-shadow: 0px 9px 13px 0px #7190CC40;
  }
  &__video{
    border-width: 14px 26px;
    border-style: solid;
    border-radius: 1em;
    border-color: transparent;
    background-color: #DEE7EE;
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
</style>
