<template lang="pug">
  div(class="home" :style="homeStyle")
    new-header(:isTop="isTop")
    div(class="home-content" ref="content" @scroll="onScroll")
      div(class="home-top" :style="homeTopStyle")
        div(class="home-top__text")
          i18n(:path="'NN0460'" tag="span")
            template(#newline)
              br
          div(class="home-top__underline" :style="unterlineStyle")
          img(class="home-top__dot" :style="dotStyle"
            src="@/assets/img/svg/newHomepage/dot-and-cursor.svg" )
          div(v-if="!isMobile"
            class="home-top__buttom rounded btn-primary-sm")
            router-link(to="/editor"
              class="home-top__buttom__text btn-LG")
              span {{$t('NN0391')}}
        iframe(title="Vivipic"
          :src="`https://www.youtube.com/embed/?autoplay=1&mute=1&loop=1&playlist=${ytId}`"
          frameborder="0" allowfullscreen
          :width="isLargeDesktop ? 656 : 327"
          :height="isLargeDesktop ? 369 : 184")
      scroll-list(v-if="!isMobile || isLogin"
        type="theme" @openSizePopup="openSizePopup()")
      scroll-list(v-if="isLogin"
        type="mydesign")
      scroll-list(v-if="isLogin"
        v-for="theme in themeList"
        :theme="theme" type="template")
      div(class="home-block")
        ta-block(v-for="item in blocklist"
          :content="item")
      nu-footer(:isHome="true")
      div(v-if="showSizePopup"
        class="popup-window")
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
import blocklistData from '@/assets/json/newHomepageBlock.json'

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
      themeList: ['1,2', '3', '8', '6', '5', '7', '9']
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
      return i18n.locale === 'us' ? 'iNvcKkFIdQc'
        : i18n.locale === 'jp' ? 'iNvcKkFIdQc'
          : i18n.locale === 'tw' ? 'Rj-hsax9v1E' : 'iNvcKkFIdQc'
    },
    homeStyle(): Record<string, string> {
      return i18n.locale === 'us' ? { 'font-family': 'Poppins' } : { 'font-family': 'NOTO SANS TC' }
    },
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
  justify-content: space-around;
  align-items: center;
  &__text{
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
  }
  &__underline{
    position: absolute;
    z-index: -1;
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
.home__float-start {
  position: fixed;
  width: 70%;
  bottom: 40px;
}
@media screen and (max-width: 768px) {
  .home-top {
    min-height: 437px;
    &__text {
      @include text-H3
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .home-top {
    min-height: 366px;
    &__text {
      @include text-H2
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .home-top {
    min-height: 566px;
    &__text {
      @include text-H1
    }
  }
}
</style>
