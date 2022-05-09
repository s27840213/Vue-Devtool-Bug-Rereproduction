<template lang="pug">
  div(class="pricing")
    nu-header(v-header-border)
    div(class="pricing-content")
      div(class="pricing-top")
        span(class="pricing-top__title" v-html="$t('TMP0001')")
        span(class="pricing-top__description") {{$t('TMP0002')}}
      div(class="pricing-plan")
        div(class="pricing-plan-left")
          div(class="pricing-plan-left__top")
            span(class="pricing-plan-left__top__title") {{$t('TMP0003')}}
            span(class="pricing-plan-left__top__description") {{$t('TMP0004')}}
          div(class="pricing-plan-left__divider")
            span {{$t('TMP0005')}}
            hr
          div(class="pricing-plan-left__bottom")
            div(v-for="item in ['TMP0006', 'TMP0007', 'TMP0008', 'TMP0009']")
              svg-icon(iconName="item-check" iconWidth="20px")
              span {{$t(item)}}
        div(class="pricing-plan-right")
          slide-toggle(:options="periods" v-model="periodUi" bgColor="#F4F5F7")
          div(class="pricing-plan-right-price")
            span(class="pricing-plan-right-price__del") {{`$${plans[planSelected][periodUi].original}${$t('TMP0012')}`}}
            br
            span(class="pricing-plan-right-price__dollar") {{'$ '}}
            span(class="text-H1") {{plans[planSelected][periodUi].now}}
            span {{' ' + $t('TMP0012')}}
          btn(class="pricing-plan-right-buy" type="light-lg" @click.native="openPopup()")
            span {{$t('TMP0015')}}
      div(class="pricing-compare")
        div(v-for="item in compareTable")
          svg-icon(v-if="item === true" iconName="feature-true")
          span(v-else) {{item}}
      div(class="pricing-faq")
        span(class="pricing-faq__title") {{$t('TMP0029')}}
        details(v-for="item in faqs")
          summary {{item.Q}}
            svg-icon(iconName="chevron-down" iconColor="gray-2" iconWidth="24px")
          p(v-html="item.A")
      nu-footer
      div(v-if="showPopup" class="popup-window")
        popup-payment(initView="step1" @close="closePopup()" class="pricing-payment")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'
import PopupPayment from '@/components/popup/PopupPayment.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import paymentData from '@/utils/paymentData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'Pricing',
  components: {
    NuHeader,
    NuFooter,
    PopupPayment,
    SlideToggle
  },
  data() {
    return {
      periods: paymentData.periodOptions(),
      compareTable: paymentData.compareTable(),
      faqs: paymentData.faqs(),
      showPopup: false
    }
  },
  computed: {
    ...mapState('payment', {
      plans: 'plans',
      planSelected: 'planSelected'
    }),
    ...mapFields({
      periodUi: 'periodUi'
    })
  },
  async mounted() {
    this.getPrice()
  },
  methods: {
    ...mapActions({
      getPrice: 'payment/getPrice'
    }),
    openPopup() { this.showPopup = true },
    closePopup() { this.showPopup = false }
  }
})
</script>

<style lang="scss" scoped>
.pricing {
  height: 100%;
  font-family: 'Poppins'; // may need i18n
}

.pricing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  height: calc(100% - #{$header-height});
}

.pricing-top {
  display: flex;
  flex-direction: column;
  margin: 110px 0;
  &__title {
    @include text-H2;
    color: setColor(gray-1);
    margin-bottom: 20px;
  }
  &__description {
    @include body-LG;
    color: setColor(gray-2);
  }
}

.pricing-plan {
  display: flex;
  width: 1128px;
  height: 367px;
  flex-shrink: 0;
  border: 1px solid setColor(gray-4);
  border-radius: 16px;
  &-left {
    display: grid;
    grid-template-rows: 1fr 24px 1fr;
    width: calc(68% - 96px);
    padding: 64px 24px 64px 72px;
    text-align: left;
    &__top {
      display: flex;
      flex-direction: column;
      &__title {
        @include text-H4;
        color: #121127;
        margin-bottom: 16px;
      }
      &__description {
        @include body-LG;
        color: rgba(18, 17, 39, 0.56);
      }
    }
    &__divider {
      @include overline-LG;
      display: flex;
      color: setColor(blue-1);
      >hr {
        width: 521px;
        border: 0.5px solid rgba(18, 17, 39, 0.12);
        margin: auto
      }
    }
    &__bottom {
      @include body-MD;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 20px;
      color: setColor(gray-2);
      >div {
        display: flex;
        align-items: center;
      }
      span { margin-left: 12px; }
    }
  }
  &-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 32%;
    background-color: setColor(blue-1);
    border-radius: 0 16px 16px 0;
    &-period {
      @include body-XS;
      background-color: setColor(gray-5);
      border-radius: 16px;
    }
    &-price {
      @include body-MD;
      position: relative;
      margin: 30px 0;
      color: white;
      &__del {
        position: absolute;
        left: 0;
        text-decoration-line: line-through;
      }
      &__dollar {
        position: relative;
        bottom: 20px;
        margin-bottom: 20px;
      }
    }
    &-buy {
      width: 80%;
      border-radius: 8px;
      span {
        @include btn-LG;
      }
    }
  }
}

.pricing-compare {
  @include body-MD;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  width: 960px;
  margin: 78px 0;
  text-align: left;
  >div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
  }
  >div:nth-child(1)    { @include text-H6; }
  >div:nth-child(3)    { @include text-H5; }
  >div:nth-child(3n)   { background-color: setColor(blue-4); }
  >div:nth-child(3n+1) { justify-content: flex-start; }
  >div:nth-child(n+4)  { border-bottom: 1px solid setColor(gray-4); }
}

.pricing-faq {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 1024px;
  &__title {
    @include text-H2;
    color: setColor(nav);
    margin-bottom: 20px;
  }
  >details {
    width: 100%;
    text-align: left;
    margin-top: 20px;
    >summary {
      @include text-H6;
      display: flex;
      justify-content: space-between;
      color: setColor(gray-1);
      list-style: none;
      border-bottom: 1px solid setColor(gray-4);
      padding-bottom: 20px;
    }
    >p {
      @include body-MD; // set default?
      color: setColor(gray-2);
      margin-top: 20px;
    }
  }
  >details[open] >summary >svg { transform: scaleY(-1); }
}
</style>
