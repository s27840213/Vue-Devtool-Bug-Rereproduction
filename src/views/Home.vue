<template lang="pug">
div(class="home")
  nu-header(v-header-border)
  div(class="home-content")
    div(class="home-top")
      div(class="home-top-text")
        span(class="home-top-text__title" v-html="$t('NN0464')")
        span(class="home-top-text__description") {{$t('NN0465')}}
        animation(v-for="cb in colorBlock"
          :key="cb"
          :class="`home-top-text__colorBlock ${cb.replace('.json', '')}`"
          :path="'/lottie/' + cb")
      iframe(title="Vivipic" class="home-top__yt"
        :src="`https://www.youtube.com/embed/${ytId}?playsinline=1&autoplay=1&mute=${isMobile?0:1}&rel=0`"
        frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
      router-link(:to="`/editor?type=new-design-size&width=1080&height=1080`"
          class="home-top__button rounded btn-primary-sm btn-LG")
        span {{$t('NN0391')}}
    div(class="home-list")
      scroll-list(v-if="!isMobile || isLogin"
        type="theme" @openSizePopup="openSizePopup()")
      scroll-list(v-if="isLogin"
        type="mydesign")
      template(v-if="isLogin")
        scroll-list(v-for="theme in themeList"
          type="template" :theme="theme" :key="theme")
    div(class="home-block")
      ta-block(v-for="item in blocklist"
        :content="item")
    nu-footer(:isHome="true")
</template>

<script lang="ts">
import Animation from '@/components/Animation.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'
import TaBlock from '@/components/homepage/TaBlock.vue'
import NuFooter from '@/components/NuFooter.vue'
import NuHeader from '@/components/NuHeader.vue'
import blocklistData, { IHomeBlockData } from '@/utils/homeBlockData'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'Home',
  components: {
    NuHeader,
    Animation,
    ScrollList,
    TaBlock,
    NuFooter
  },
  data() {
    return {
      showSizePopup: false,
      themeList: ['1,2', '3', '8', '6', '5', '7', '9'],
      colorBlock: [
        'vector_lightblue2.json',
        'vector_pink1.json',
        'oval_pink4.json',
        'oval_yellow1.json'
      ]
    }
  },
  // setup() {
  //   useMeta({
  //     title: 'Home'
  //   })
  // },
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
      isMobile: 'isMobile'
    }),
    blocklist(): IHomeBlockData[] {
      const blocklist = blocklistData.data().filter((item) => {
        return !(this.$i18n.locale === 'us' && item.img.name === 'e-commerce.json')
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
      return this.$i18n.locale === 'us' ? 'GRSlz37Njo0'
        : this.$i18n.locale === 'jp' ? 'FzPHWU0O1uI'
          : this.$i18n.locale === 'tw' ? 'BBVAwlBk_zA' : 'GRSlz37Njo0'
    }
  },
  created() {
    if (this.$i18n.locale === 'us') {
      this.themeList = _.without(this.themeList, '7')
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
  height: 100%;
}
.home-content {
  @include hover-scrollbar();
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - #{$header-height});
}
.home-top {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  position: relative;
  &-text {
    display: flex;
    flex-direction: column;
    text-align: center;
    &__title {
      color: setColor(gray-1);
    }
    &__description {
      color: setColor(gray-2);
    }
    &__colorBlock {
      position: absolute;
      z-index: -1;
    }
  }
  &__button {
    @include body-MD;
    margin-top: 25px;
    width: 216px;
    height: 44px;
    box-shadow: 0px 9px 13px 0px #7190cc40;
    text-decoration: none;
    color: setColor(white);
  }
  .vector_lightblue2 {
    width: 85px;
    height: 87px;
  }
  .vector_pink1 {
    width: 139px;
    height: 118px;
  }
  .oval_pink4 {
    width: 70px;
    height: 70px;
  }
  .oval_yellow1 {
    width: 45px;
    height: 46px;
  }
}
.home-list {
  width: 80%;
}
@media screen and (max-width: 768px) {
  .home-content {
    padding: 0 5%;
    // Always show scrollbar in mobile
    overflow-y: overlay;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      visibility: visible;
      border: none;
    }
    @include firefoxOnly {
      scrollbar-color: setColor(gray-3) transparent;
    }
  }
  .home-list, .home-block {
    width: 100%;
  }
  .home-top {
    min-height: 400px;
    width: 327px;
    margin-top: 20px;
    &-text {
      &__title {
        @include text-H3;
      }
      &__description {
        @include body-MD;
      }
    }
    &__yt {
      width: 320px;
      height: 180px;
    }
    .vector_lightblue2 {
      top: 42px;
      left: 14px;
    }
    .vector_pink1 {
      top: -12px;
      left: 299px;
    }
    .oval_pink4,
    .oval_yellow1 {
      display: none;
    }
    &__button {
      position: fixed;
      width: calc(90% - 40px);
      bottom: 30px;
      z-index: 1;
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .home-top {
    min-height: 724px;
    width: 768px;
    margin-top: 80px;
    &-text {
      width: 560px; // todo ? 500 560
      &__title {
        @include text-H2;
      }
      &__description {
        @include body-LG;
      }
    }
    &__yt {
      width: 720px;
      height: 405px;
    }
    .vector_lightblue2 {
      top: 9px;
      left: 67px;
    }
    .vector_pink1 {
      top: -8px;
      left: 581px;
    }
    .oval_pink4,
    .oval_yellow1 {
      display: none;
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .home-top {
    min-height: 724.15px;
    width: 1241px;
    margin-top: 80px;
    &-text {
      &__title {
        @include text-H1;
      }
      &__description {
        @include body-LG;
      }
    }
    &__yt {
      width: 800px;
      height: 449.9px;
    }
    .vector_lightblue2 {
      top: 50px;
      left: 146px;
    }
    .vector_pink1 {
      top: 11px;
      left: 964px;
    }
    .oval_pink4 {
      top: 327px;
      left: 17px;
    }
    .oval_yellow1 {
      top: 259px;
      left: 1158px;
    }
  }
}
</style>
