<template lang="pug">
div(class="pricing")
  nu-header(v-header-border)
  div(class="pricing-content")
    div(class="pricing-top")
      span(class="text-H2 mb-20" v-html="$t('NN0505')")
      span(class="body-LG text-gray-2") {{$t('NN0506')}}
      img(v-for="cb in colorBlock" class="pricing-top__cb"
        :key="cb.name"
        :src="require('@/assets/img/svg/color-block/' + cb.name)"
        :style="{'top': `${cb.top}px`, 'left': `${cb.left}px`}")
    div(class="pricing-plan")
      div(class="pricing-plan-left")
        div(class="pricing-plan-left-top")
          span(class="text-H4 mb-15") {{$tc('NN0507', 1)}}
          span(class="body-LG text-gray-3") {{$t('NN0508')}}
        div(class="pricing-plan-left-divider")
          span {{$t('NN0509')}}
          hr
        div(class="pricing-plan-left-bottom")
          div(v-for="item in ['NN0510', 'NN0511', 'NN0512', 'NN0513', 'NN0769']" :key="item")
            svg-icon(iconName="item-check" iconWidth="20px")
            span {{$t(item)}}
      div(class="pricing-plan-right")
        div(class="relative")
          slide-toggle(:options="periods"
                      v-model="periodUi"
                      bgColor="gray-6"
                      textSize="body-XS")
          img(class="pricing-plan-right__off"
              :src="require(`@/assets/img/svg/pricing/${off}.svg`)")
        div(class="pricing-plan-right-price")
          span(class="pricing-plan-right-price__del") {{`$${plans[planSelected][periodUi].original}${$t('NN0516')}`}}
          br
          span(class="pricing-plan-right-price__dollar") {{'$ '}}
          span(class="text-H1") {{plans[planSelected][periodUi].now}}
          span {{' ' + $t('NN0516')}}
        btn(class="pricing-plan-right-buy" type="light-lg" @click="tryAddCard()")
          span(class="btn-LG") {{buyLabel}}
    span(class="pricing-currency") {{$t('NN0519')}}
    div(class="pricing-compare")
      div(v-for="(item,idx) in compareTable" :key="idx")
        svg-icon(v-if="item === true" iconName="feature-true")
        span(v-else) {{item}}
    div(class="pricing-faq")
      span(class="text-H2 mb-20") {{$t('NN0533')}}
      template(v-for="item in faqs" :key="item.Q")
        collapse-title(:selected="faqOpen.includes(item.Q)"
            @click="clickFaq(item.Q)") {{item.Q}}
        collapse(:when="faqOpen.includes(item.Q)")
          i18n-t(v-if="item.isPath" :keypath="item.A" tag="p" class="body-MD text-gray-2 mt-20")
            template(#history)
              router-link(to="/settings/billing") {{$t('NN0614')}}
          p(v-else class="body-MD text-gray-2 mt-20" v-html="item.A")
    nu-footer
</template>

<script lang="ts">
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import NuFooter from '@/components/NuFooter.vue'
import NuHeader from '@/components/NuHeader.vue'
import paymentData from '@/utils/constantData'
import paymentUtils from '@/utils/paymentUtils'
import { pull } from 'lodash'
import { defineComponent } from 'vue'
import { Collapse } from 'vue-collapsed'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'

// Pricing testing doc: https://www.notion.so/vivipic/Pricing

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default defineComponent({
  emits: [],
  name: 'Pricing',
  components: {
    NuHeader,
    NuFooter,
    SlideToggle,
    CollapseTitle,
    Collapse,
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
  data() {
    return {
      colorBlock: paymentData.pricingColorBlock(),
      periods: paymentData.periodOptions(),
      compareTable: paymentData.compareTable(),
      faqs: paymentData.faqs(),
      faqOpen: [] as string[],
    }
  },
  computed: {
    ...mapGetters({
      isUiTW: 'payment/isUiTW'
    }),
    ...mapState('payment', {
      plans: 'plans',
      planSelected: 'planSelected',
      userCountryUi: 'userCountryUi',
      status: 'status',
      trialStatus: 'trialStatus',
      trialDay: 'trialDay'
    }),
    ...mapFields({ periodUi: 'periodUi' }),
    off(): string { return this.isUiTW ? '26off' : '25off' },
    canAddCard():boolean { return ['Initial', 'Deleted'].includes(this.status) },
    buyLabel():string {
      return (this.trialStatus === 'not used'
        ? this.$t('NN0517', { day: this.trialDay })
        : this.canAddCard
          ? this.$t('NN0587')
          : this.$t('NN0518')) as string
    }
  },
  async mounted() {
    await this.getBillingInfo()
    this.getPrice(this.userCountryUi)
    if (new URLSearchParams(window.location.search).get('coupon')) {
      paymentUtils.openPayment('step1-coupon')
    }
  },
  methods: {
    ...mapActions({
      getBillingInfo: 'payment/getBillingInfo',
      getPrice: 'payment/getPrice'
    }),
    tryAddCard() {
      if (this.canAddCard) {
        paymentUtils.openPayment('step1')
      } else {
        this.$router.push('/settings/payment')
      }
    },
    clickFaq(Q: string) {
      if (this.faqOpen.includes(Q)) {
        pull(this.faqOpen, Q)
      } else {
        this.faqOpen.push(Q)
      }
    },
  }
})
</script>

<style lang="scss" scoped>
.pricing {
  height: 100%;
}

.pricing-content {
  @include hover-scrollbar();
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
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - #{$header-height});
  padding: 20px 5.34%;
}

.pricing-top {
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 110px 0;
  &__cb {
    position: absolute;
    z-index: -1;
  }
}

.pricing-plan {
  display: flex;
  width: 1128px;
  height: 367px;
  flex-shrink: 0;
  background-color: setColor(white);
  border: 1px solid setColor(gray-4);
  border-radius: 16px;
  overflow: hidden;
}

.pricing-plan-left {
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  box-sizing: border-box;
  width: 68%;
  padding: 0 24px 0 60px;
  text-align: left;
  &-top {
    display: flex;
    flex-direction: column;
    margin: auto 0 29px 0;
  }
  &-divider {
    @include overline-LG;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    color: setColor(blue-1);
    > hr {
      width: calc(100% - 12px);
      border: 0.5px solid setColor(gray-4);
      margin-left: 12px;
    }
  }
  &-bottom {
    @include body-MD;
    display: grid;
    grid-template-columns: auto auto;
    margin: 21px 0 auto 0;
    color: setColor(gray-2);
    gap: 12px 0;
    > div {
      display: flex;
      svg {
        flex-shrink: 0;
        margin: 4.4px 13.66px 4.4px 1.67px;
      }
    }
  }
}

.pricing-plan-right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  width: 32%;
  padding: 72px 32px;
  background-color: setColor(blue-1);
  &__off {
    position: absolute;
    top: -20px;
    right: -70px;
  }
  &-price {
    @include body-MD;
    position: relative;
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
  &-buy.btn {
    width: 80%;
    max-width: 294px;
    border-radius: 8px;
  }
}

.pricing-currency {
  @include body-XS;
  color: setColor(gray-3);
  margin-left: 950px;
}

.pricing-compare {
  @include body-MD;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  width: 960px;
  margin: 78px 0;
  text-align: left;
  > div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  > div:nth-child(1) {
    @include text-H6;
  }
  > div:nth-child(3) {
    @include text-H5;
  }
  > div:nth-child(-n + 3) {
    padding: 8px 0;
    word-break: keep-all;
  }
  > div:nth-child(2),
  > div:nth-child(3) {
    text-align: center;
  }
  > div:nth-child(3n) {
    background-color: setColor(blue-4);
  }
  > div:nth-child(3n + 1) {
    justify-content: flex-start;
  }
  > div:nth-child(n + 4) {
    padding: 20px 0;
    border-bottom: 1px solid setColor(gray-4);
  }
}

.pricing-faq {
  display: flex;
  flex-direction: column;
  width: 1024px;
  color: setColor(gray-1);
  @include text-H6;
  > .collapse-title {
    padding: 20px 0;
    border-bottom: 1px solid setColor(gray-4);
  }
  > div { // collapse
    transition: all calc(var(--vc-auto-duration) * 1.5) ease-in-out;
  }
  p { // collapse content
    text-align: left;
  }
}

@media screen and (max-width: 1440px) { // For 0~1440px
  .pricing-plan,
  .pricing-compare,
  .pricing-faq {
    width: 100%;
  }
  .pricing-currency {
    margin-left: auto;
  }
}

@media screen and (max-width: 834px) {
  .pricing-top__cb {
    display: none;
  }
  .pricing-plan {
    flex-direction: column;
    height: fit-content;
    &-left {
      display: block;
      width: 100%;
      padding: 18px;
      &-top {
        margin: 0 0 10px 0;
      }
      &-bottom {
        margin: 10px 0 0 0;
        grid-template-columns: auto;
        gap: 0;
        > div + div {
          margin-top: 10px;
        }
      }
    }
    &-right {
      width: 100%;
      height: 282px;
      padding: 30px 20px;
    }
  }
  .pricing-compare {
    grid-template-columns: 1.2fr 1fr 1fr;
  }
}
@media screen and (max-width: 1024px) and (min-width: 834.02px) {
  .pricing-plan-left {
    grid-template-rows: auto auto auto;
    width: 58%;
    padding: 0 12px 0 44px;
    &-top {
      margin: auto 0 5px 0;
    }
    &-bottom {
      margin: 5px 0 auto 0;
      grid-template-columns: auto;
      gap: 10px 0;
    }
  }
  .pricing-plan-right {
    width: 42%;
  }
}
@media screen and (max-width: 1440px) and (min-width: 1024.02px) {
  .pricing-plan-left {
    padding: 0 12px 0 44px;
  }
}
</style>
