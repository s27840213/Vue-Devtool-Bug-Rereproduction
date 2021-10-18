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
          class="rounded" @click.native="goMakeClicked()") 開 始 製 作
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
      div(class="home-content-feature" style="display: none;")
        div(style="height: 140px;" class="x-scrollbar")
          div(v-for="item in featureList" class="home-content-feature-item")
            img(:src="require(`@/assets/img/svg/home-feature/${item.name}.svg`)")
            div(class="pt-10 body-1") {{item.title}}
      div(class="home-content-title label-lg" style="display: none;") 熱門模板
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'

export default Vue.extend({
  name: 'Home',
  components: {
    NuHeader,
    NuFooter
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
        }
      ],
      featureList: [
        {
          name: 'line',
          title: 'LINE 行銷嘛欸通'
        }
      ]
    }
  },
  methods: {
    goMakeClicked () {
      this.$router.push({ name: 'Editor' })
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

  &-title {
    text-align: left;
    padding: 3vw 0 3vw 12vw;
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
    grid-template-columns: repeat(7, auto);
    align-items: center;
    padding: 0 12vw;
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
    justify-content: center;
    position: relative;

    &-item {
      width: 168px;
      height: 128px;
      border: 1px solid #f4f4f5;
      border-radius: 8px;
      padding: 24px;
    }
  }

}
/*
.x-scrollbar {
  overflow-x: scroll;
  overflow-y: hidden;
}
.x-scrollbar::-webkit-scrollbar {
    display: none;
}
*/
</style>
