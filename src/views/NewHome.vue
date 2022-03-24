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
        div(class="home-top__video-wrapper")
          video(class="home-top__video"
            src='@/video-demo/demo.mp4'
            type="video/mp4"
            autoplay muted loop)
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

import themeUtils from '@/utils/themeUtils'

import _ from 'lodash'

export default Vue.extend({
  name: 'Home',
  components: {
    NewHeader,
    Block,
    NuFooter,
    ScrollList
  },
  data() {
    return {
      blocklist: [ // or blockList?
        { // 獨立成另一個檔案？
          title: 'Tailor-made templates\njust for your business',
          description: 'Find your ideal design fast with the filters of events\nand industries at Template Center.',
          link: 'See Template Center',
          img: {
            name: 'bussiness.json',
            width: 500
          },
          colorBlock: [
            {
              name: 'oval_blue1.svg',
              top: 13,
              left: 0
            }, {
              name: 'oval_orange1.svg',
              top: 118.21,
              left: 105.21
            }, {
              name: 'oval_pink2.svg',
              top: 351,
              left: 961
            }
          ],
          textRight: true
        }, {
          title: 'Template Bundle\naligned across all\nplatforms',
          description: 'Effortlessly obtain all sizes of templates from\nsocial media posts, stories, website banners\nand more.',
          img: {
            name: 'bundle.json',
            width: 520
          },
          colorBlock: [{
            name: 'vector_blue1.svg',
            top: 126,
            left: 586
          }],
          textRight: false
        }, {
          title: 'Extensible Canvas\nmakes design\nprocess smoother',
          description: 'Users are allowed to create multiple sizes of\ndesigns in the same page, reducing repetition\nof switching files.',
          img: {
            name: 'multiple-sizes.json',
            width: 500
          },
          colorBlock: [{
            name: 'vector_purple1.svg',
            top: 0,
            left: 0
          }],
          textRight: true
        }, {
          title: 'Storytelling Templates\nprovide hints to your\nmarketing strategy',
          description: 'Co-developed with well-known marketing\nlecturers, nine image slides tell the benefits of your\nproduct in a logical way.',
          img: {
            name: 'storytelling.json',
            width: 488,
            height: 520
          },
          colorBlock: [
            {
              name: 'oval_orange2.svg',
              top: 13,
              left: 0
            }, {
              name: 'oval_lightblue2.svg',
              top: 118.21,
              left: 105.21
            }, {
              name: 'oval_brown1.svg',
              top: 351,
              left: 961
            }
          ],
          textRight: false
        }, {
          comingSoon: true,
          title: 'Smart Background\nRemover makes it\neasier to edit image',
          description: 'Get your image background cleared and\nchanged automatically with the remover.',
          img: {
            name: 'remover.json',
            width: 500,
            height: 374.48
          },
          colorBlock: [{
            name: 'oval_blue2.svg',
            top: 13,
            left: 0
          }],
          textRight: true
        }, {
          comingSoon: true,
          title: 'Manage your brand\nidentify with Brandkit',
          description: 'This tool set allows users to add their own logos,\nfonts and colors, taking brand and style to the next\nlevel.',
          img: {
            name: 'brandkit.json',
            width: 500
          },
          colorBlock: [{
            name: 'vector_orange1.svg',
            top: 13,
            left: 0
          }],
          textRight: false
        }
      ]
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
    width: 468px;
    // border-width: 14.62px 26px; // 需要雙重圓角?
    // border-style: solid;
    // border-color: #DEE7EE;
    border-radius: 1em;
    &-wrapper{
      border-width: 14px 26px;
      border-style: solid;
      border-radius: 1em;
      border-color: transparent;
      background-color: #DEE7EE;
    }
  }
}
</style>
