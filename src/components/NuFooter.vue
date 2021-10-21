<template lang="pug">
  div(class="nu-footer text-white")
    div(class="nu-footer-wrapper label-lg")
      svg-icon(:iconName="'logo'"
      :iconWidth="'100px'" style="height: 50px;")
      div(class="nu-footer-feature")
        div(class="nu-footer-feature-region")
          div(class="label-lg feature-title") LEARN
            div(class="line")
          div(class="nu-footer-feature-items body-1 pt-30")
            a(:href="blogPage") 使用教學
            a(:href="blogPage") 幫助中心
        div(class="nu-footer-feature-region")
          div(class="label-lg feature-title") DISCOVER
            div(class="line")
          div(class="nu-footer-feature-items body-1 pt-30")
            a(:href="facebookPage") 關於我們
            a(href="/editor") 模板中心
        div(class="nu-footer-feature-region")
          div(class="label-lg feature-title") CREATE
            div(class="line")
          div(class="nu-footer-feature-items body-1 pt-30")
            a(href="/editor") Facebook
            a(href="/editor") IG 貼文
            a(href="/editor") IG 限時動態
            a(href="/editor") Line 推播
            a(href="/editor") 電商商品圖
            a(href="/editor") 電商 Banner
            a(href="/editor") 電商詳情頁
        div(class="nu-footer-feature-region")
          div(class="label-lg feature-title") LEGAL
            div(class="line")
          div(class="nu-footer-feature-items body-1 pt-30")
            a(:href="facebookPage") 隱私權政策
            a(:href="facebookPage") 使用條款
    div(class="nu-footer-bottom pt-80 pb-30")
      div(class="nu-footer-bottom-left")
        select(class="locale-select" v-model="locale")
          option(v-for="locale in localeOptions" :value="locale") {{locale}}
      div(class="nu-footer-bottom-center")
        span(class="body-2") COPYRIGHT Vivipic 2021 - TERMS CONDITIONS  PRIVACY POLICY
      div(class="nu-footer-bottom-right")
        svg-icon(class="pointer" :iconName="'facebook-circle'"
        :iconWidth="'25px'"
        @click.native="goToPage(facebookPage)")
        svg-icon(class="pointer" :iconName="'instagram-circle'"
        :iconWidth="'25px'"
        @click.native="goToPage('/')")
        svg-icon(class="pointer" :iconName="'mail-circle'"
        :iconWidth="'25px'"
        @click.native="goToPage('/')")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      locale: '繁體中文(台灣)',
      localeOptions: ['繁體中文(台灣)', '英文', '日文'],
      facebookPage: 'https://www.facebook.com/vivipictw',
      blogPage: 'https://blog.vivipic.com/'
    }
  },
  methods: {
    goToPage(page: string) {
      window.location.href = page
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-footer {
  width: 100%;
  background: #555;

  &-wrapper {
    display: grid;
    grid-template-columns: 30% 70%;
    justify-content: center;
    padding: 100px 5vw 0 12vw;
  }

  &-feature {
    display: grid;
    text-align: left;
    grid-template-columns: repeat(4, auto);

    &-region {
      display: flex;
      flex-direction: column;

      .feature-title {
        position: relative;

        .line {
          width: 100%;
          height: 75%;
          position: absolute;
          left: -15px;
          top: 3px;
          border-left: 5px solid rgb(78, 171, 230);
        }
      }
    }
    &-items {
      display: grid;
      grid-auto-flow: row;
      grid-template-rows: auto 1fr;
      row-gap: 10px;
      text-align: left;

      > a {
        color: white;
        text-decoration: none;
      }
    }
  }

  &-bottom {
    display: grid;
    grid-template-columns: 30% 45% 25%;

    &-left {
      display: flex;
      justify-content: center;

      > select {
        width: 40%;
        height: 30px;
        font-size: 14px;
        color: #fff;
        border-radius: 7px;
        border: 1px #fff solid;
        background: #555;
        padding-left: 8px;
        padding-right: 5px;
      }
    }

    &-center {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &-right {
      display: grid;
      grid-auto-flow: column;
      justify-content: center;
      column-gap: 30px;
    }
  }
}
</style>
