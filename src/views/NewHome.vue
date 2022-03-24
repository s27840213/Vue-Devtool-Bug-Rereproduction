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
      scroll-list(:list="themeList" type='theme'
        @openPopup="openPopup()") // todo
      div(class="home-block")
        block(v-for="item in blocklist"
          :content="item")
      nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
// import i18n from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import NewHeader from '@/components/new-homepage/NewHeader.vue'
import Block from '@/components/new-homepage/Block.vue'
import NuFooter from '@/components/NuFooter.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'
import Animation from '@/components/Animation.vue'

import themeUtils from '@/utils/themeUtils'

import _ from 'lodash'

import blocklist from '@/assets/json/newHomepageBlock.json'

export default Vue.extend({
  name: 'Home',
  components: {
    NewHeader,
    Block,
    NuFooter,
    ScrollList,
    Animation
  },
  data() {
    return {
      blocklist
    }
  },
  // need meta info?
  computed: {
    ...mapGetters({
    }),
    themeList() {
      return _.filter(themeUtils.themes, ['mainHidden', 0])
    }
  },
  async mounted() {
    themeUtils.checkThemeState() // move to created?
  },
  methods: {
    ...mapActions({
    })
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
</style>
