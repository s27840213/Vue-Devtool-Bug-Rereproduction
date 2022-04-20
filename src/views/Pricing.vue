<template lang="pug">
  div(class="pricing")
    nu-header(v-header-border="true")
    div(class="pricing-content")
      div(class="pricing-header")
        img(:src="require('@/assets/img/png/pricing/header.png')")
        div(class="pricing-header-title") 簡單方案任您選擇
        div(class="pricing-header-subtitle") 馬上成為 Vivipic 的一員，海量電商模板免費取用！
      div(class="pricing-cases pt-50")
        div(class="pricing-case")
          div(class="pricing-case-title heading-4") 基礎版
          div(class="pricing-case-block block-basic")
            div(class="pricing-case-price")
              span(class="heading-5") $0
              span(class="label-mid") {{' /月'}}
            div(class="pricing-case-features")
              div(v-for="item in basicFeature"
                class="pricing-case-feature")
                svg-icon(class="pointer"
                  iconWidth="25px"
                  iconName="check"
                  iconColor="blue-1")
                span {{item}}
            div(style="padding-top: 150px;")
              div(class="pricing-case-btn"
                style="width: 60%;"
                @click="goToPage('Editor')") 註 冊 即 享 用
        div(class="pricing-case")
          div(class="pricing-case-title heading-4")
            span 專業版
            div(style="position: relative;")
              div(class="ml-25 label-mid label")
            span(class="body-1 label-text") 限 時 優 惠
          div(class="pricing-case-block block-pri")
            div(class="pricing-case-price")
              span(class="heading-5"
                style="text-decoration: line-through;") $349
              span(class="label-mid") {{' /月'}}
              span(class="pl-40 heading-2 text-yellow") $0
              span(class="label-lg text-yellow") {{' /月'}}
            div(class="pricing-case-features")
              div(v-for="item in priBasicFeature"
                class="pricing-case-feature")
                svg-icon(class="pointer"
                  iconWidth="25px"
                  iconName="check"
                  iconColor="blue-3")
                span {{item}}
            div(class="mt-20 dividing")
            div(class="pricing-case-features")
              div(v-for="item in priFeature"
                class="pricing-case-feature text-yellow")
                svg-icon(class="pointer"
                  iconWidth="25px"
                  iconName="check"
                  iconColor="yellow")
                span {{item}}
            div(class="pt-50")
              div(class="pricing-case-btn"
                style="width: 50%;"
                @click="goToPage('Editor')") 立 即 註 冊 免 費 享 用
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'

export default Vue.extend({
  name: 'Pricing',
  components: {
    NuHeader,
    NuFooter
  },
  data() {
    return {
      basicFeature: [
        '永久免費',
        '精美素材媒體庫',
        '無限次數下載',
        '上千個精美模板',
        '超過 200 萬張的可商用圖庫'
      ],
      priBasicFeature: [
        '限時優惠',
        '精美素材媒體庫',
        '無限次數下載',
        '上千個精美模板',
        '超過 200 萬張的可商用圖庫'
      ],
      priFeature: [
        '付費模板無限暢用',
        '付費素材無限暢用'
      ]
    }
  },
  computed: {
  },
  methods: {
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    }
  }
})
</script>

<style lang="scss" scoped>
.pricing {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 100px;
  }

  &-header {
    display: flex;
    justify-content: center;
    position: relative;
    width: 100%;

    > img {
      width: 100%;
    }

    &-title {
      position: absolute;
      top: 35%;
      font-size: 2.4vw;
      font-weight: 700;
      line-height: 1.3;
    }

    &-subtitle {
      position: absolute;
      top: 55%;
      font-size: 1.3vw;
      color: white;
    }
  }

  &-cases {
    display: grid;
    grid-auto-flow: column;
    column-gap: 2vw;
  }

  &-case {
    display: flex;
    flex-direction: column;

    &-title {
      display: flex;
      position: relative;
      text-align: left;
      color: setColor(blue-1);
      padding-bottom: 30px;

      .label {
        width: 110px;
        height: 30px;
        color: white;
        background: setColor(red);
        transform: skewX(-20deg);
        position: absolute;
        left: 0;
        top: 5px;
      }
      .label-text {
        color: white;
        padding: 7px 0 0 40px;
        z-index: 2;
      }

    }

    &-block {
      border-radius: 10px;
      text-align: left;
      font-family: 'Mulish';
      padding: 2vw 2.5vw;
    }
    .block-basic {
      width: 28vw;
      background: setColor(gray-5);
    }
    .block-pri {
      width: 35vw;
      background: setColor(blue-1);
      color: white;
    }

    &-features {
      display: grid;
      grid-template-columns: repeat(auto-fill, 14vw);
      row-gap: 20px;
      padding-top: 3vh;
    }

    &-feature {
      display: flex;
      align-items: center;
    }

    &-btn {
      cursor: pointer;
      background: white;
      color: setColor(blue-1);
      text-align: center;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      padding: 15px;

      &:hover{
        transition: all .2s ease-in-out;
        background: setColor(gray-4);
        box-shadow: 3px 3px 10px 0 rgba(48, 55, 66, 0.15);
        transform: translate(0, -3px);
      }
    }
  }
}

.dividing {
  width: 100%;
  border: 1px #fff solid;
}
</style>
