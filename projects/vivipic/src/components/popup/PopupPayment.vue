<template lang="pug">
div(class="popup-window")
  div(class="wrapper" :class="{isTouchDevice: $isTouchDevice()}")
    div(class="payment" v-click-outside="vcoConfig()")
      svg-icon(class="payment__close" iconName="close" iconWidth="32px"
              iconColor="gray-0" @click="closePopup()")
      div(class="payment-left")
        div(v-if="!$isTouchDevice()")
          div(class="payment-left-top")
            div(class="payment-left-top__step")
              svg-icon(v-if="showPreStep" iconName="left-arrow" iconWidth="24px"
                      iconColor="gray1" @click="preStep()")
              span(v-if="totalStep") {{$t('NN0544')}} {{currentStep}} of {{totalStep}}
            div(class="text-H4" v-html="title")
            div(v-if="description" class="mt-15") {{description}}
          //- switch(view)
          div(class="payment-left-content")
            //- case step1 or switch1
            template(v-if="['step1', 'switch1', 'step1-coupon'].includes(view)")
              coupon-input(v-if="view === 'step1-coupon'" class="payment-left-content-coupon")
              div(v-for="p in periodInput"
                  :key="p.label"
                  :isSelected="p.value === userPeriod"
                  class="payment-left-content-period" @click="setPeriod(p.value)")
                svg-icon(iconWidth="20px"
                        :iconName="p.value === userPeriod ? 'radio-checked' : 'radio'"
                        :iconColor="p.value === userPeriod ? 'white' : 'gray-4'")
                div(class="payment-left-content-period-price")
                  span(class="payment-left-content-period-price__label") {{p.label}} {{curPlan(p.value)}}
                  span(class="text-H6") {{`$${plans[planSelected][p.value].now}`}}
                    span(class="body-XS") {{`${$t('NN0516')}${p.value==='yearly' ? $t('NN0548') : ''}`}}
                span(v-if="p.value==='yearly'"
                    class="payment-left-content-period__off") {{$t('NN0549')}}
            //- case step2
            PaymentField(v-if="['step2', 'step2-coupon'].includes(view)" @next="changeView('finish')")
            //- case switch2
            template(v-if="view === 'switch2'")
              card-info(:card="card")
              div(class="payment-left-content-switch2")
                span(v-if="switchPaidDate") {{$t('NN0552', {date: switchPaidDate})}}
                span(v-else) {{$t('NN0553')}}
                span {{`$${switchPrice}`}}
            //- case cancel1 or pro-features
            template(v-if="showFeature")
              div(v-for="can in cancel1" :key="can" class="payment-left-content-cancel")
                svg-icon(iconName="pro" iconWidth="24px")
                span {{can}}
            //- case cancel2
            template(v-if="view === 'cancel2'")
              div(v-for="can, idx in cancel2" :key="can" class="payment-left-content-cancel")
                radio-btn(:isSelected="reasonIndex === String(idx)"
                          :formatKey="String(idx)" circleColor="gray-4"
                          @select="selectCancelReason(String(idx))")
                span {{can}}
              input(class="payment-left-content-cancel__other"
                    v-model="otherReason" :placeholder="$t('NN0584')")
          div(class="payment-left-button")
            nubtn(v-for="button in buttons"
                :key="button.label"
                size="mid-full"
                :theme="button.type ?? 'primary'"
                :disabled="button.disabled ? button.disabled() : false"
                @click="button.func()") {{button.label}}
        div(v-else v-touch @swipe.stop)
          //- mobile version
          //- case step1 or switch1
          template(v-if="['step1', 'switch1', 'step1-coupon'].includes(view)")
            carousel(
              :items="carouselItems"
              :itemWidth="windowWidth"
              :initIndex="carouselItems.findIndex(item => item.key === initView)"
              enableSwipe
              @change="handleImageChange")
              template(v-slot="{ item }")
                div(class="payment__carousel-item")
                  img(class="payment__carousel-item__img"
                      draggable="false"
                      :src="item.img"
                      @load="handleImgLoad(item.key)")
                  div(class="payment__carousel-item__overlay")
                  div(class="payment__carousel-item__title text-black text-H4" v-html="item.title")
            div(class="payment__content")
              div(class="payment__content__indicator")
                div(v-for="(url, idx) in carouselItems"
                  :key="idx"
                  class="payment__content__indicator__item"
                  :class="{ 'payment__content__indicator__item--active': idx === idxCurrImg }")
              div(class="payment__content__plans")
                div(v-for="btnPlan in periodInput" class="payment__btn-plan"
                  :key="btnPlan.value"
                  :class="{selected: btnPlan.value === userPeriod}"
                  @tap="setPeriod(btnPlan.value)")
                  svg-icon(v-if="btnPlan.value === userPeriod" class="payment__btn-plan__radio selected" iconName="check" iconWidth="20px" iconColor="white")
                  div(v-else class="payment__btn-plan__radio")
                  div(class="payment__btn-plan__content")
                    div(class="payment__btn-plan__content__title")
                      div(class="payment__btn-plan__content__title__main caption-LG") {{ btnPlan.label }}
                      div(class="payment__btn-plan__content__title__sub")
                        span {{ "14 Day Free Trial" }}
                    div(class="payment__btn-plan__content__price text-H6") {{ plans[planSelected][btnPlan.value].nextPaid }}
                  div(v-if="btnPlan.value === planSelected && btnPlan.value === 'yearly'" class="payment__btn-plan__content__tag")
                    span(class="caption-SM") {{ plans[planSelected][btnPlan.value].now }}
                div(class="payment__btn-subscribe" @touchend="changeView('step2')")
                  div(class="payment__btn-subscribe__text") {{ $t('STK0046') }}
                div(class="payment__notice text-gray-3" ref="notice")
                  div(class="payment__notice__text body-XXS" ref="txtNotice") {{ $t('STK0057', { day: 14 }) }}
                div(class="payment__footer text-gray-3")
                  template(v-for="(footerLink, idx) in footerLinks" :key="footerLink.key")
                    span(v-if="idx > 0" class="payment__footer__splitter")
                    span(class="body-XXS" @tap="footerLink.action") {{ footerLink.title }}
          //- case step2
          PaymentField(v-if="['step2', 'step2-coupon'].includes(view)" class="payment__field" @next="changeView('finish')")
      div(class="payment-right")
        img(class="payment-right-bg" loading="lazy"
            :src="require(`@/assets/img/jpg/pricing/${locale}/${img}`)")
        img(v-if="view === 'pro-template'"
            class="payment-right-temp"  :src="templateImg")
      div(v-if="view === 'finish'" class="payment-finish")
        div(class="payment-finish-content")
          animation(path="/lottie/pro.json")
          span {{$t('NN0562')}}
          nubtn(size="mid" @click="closePopup()") {{$t('NN0563')}}
</template>

<script lang="ts">
import Animation from '@/components/Animation.vue'
import Carousel from '@/components/global/Carousel.vue'
import { INubtnThemes } from '@/components/global/Nubtn.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import CardInfo from '@/components/payment/CardInfo.vue'
import CouponInput from '@/components/payment/CouponInput.vue'
import PaymentField from '@/components/payment/PaymentField.vue'
import { IPaymentPayingView, IPaymentView, IPaymentWarningView, _IPaymentWarningView } from '@/interfaces/payment'
import paymentData from '@/utils/constantData'
import paymentUtils from '@/utils/paymentUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'

interface CarouselItem {
  key: IPaymentWarningView
  title: string
  img: string
}

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default defineComponent({
  name: 'PopupPayment',
  components: {
    PaymentField,
    RadioBtn,
    Animation,
    CardInfo,
    CouponInput,
    Carousel
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      // View variable
      view: '',
      currentStep: 0,
      totalStep: 0,
      title: '',
      description: '',
      buttons: [{}] as { type?: INubtnThemes, disabled?: () => boolean, label: string, func: () => void }[],
      img: 'remover.jpg',
      // View constant
      periodInput: paymentData.periodOptions(),
      cancel1: paymentData.cancel1() as string[],
      cancel2: paymentData.cancel2() as string[],
      // User input
      reasonIndex: '-1',
      otherReason: '',
      canShow: false,
      idxCurrImg: 0,
      windowWidth: window.innerWidth,
      carouselItems: [
        {
          key: 'pro-template',
          title: 'Premium Selection of Templates',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-template.jpg`)
        },
        {
          key: 'pro-text',
          title: 'Various Styles of Texts & Fonts',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-text.jpg`)
        },
        {
          key: 'pro-object',
          title: 'Library of Beautiful Stickers',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-object.jpg`)
        },
        {
          key: 'page-resize',
          title: 'Instant Design Resizer',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/page-resize.jpg`)
        },
        {
          key: 'export-pdf-print',
          title: 'Best File Type for High-Quality Printing',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/export-pdf-print.jpg`)
        },
        {
          key: 'pro-bg',
          title: 'Collection of Pro Background Images',
          img: require(`@/assets/img/jpg/pricing-mobile/pro-bg.jpg`)
        },
        {
          key: 'bgrm',
          title: 'BG Remover with Shadow Effects',
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/remover.jpg`)
        }
      ] as CarouselItem[],
      footerLinks: [
        {
          key: 'restorePurchase',
          title: this.$t('STK0045'),
          action: () => this.handleSubscribe('restore', 30000)
        },
        {
          key: 'termsOfService',
          title: this.$t('NN0160'),
          action: () => window.open(this.$t('NN0858'), '_blank')
        },
        {
          key: 'privacyPolicy',
          title: this.$t('NN0161'),
          action: () => window.open(this.$t('NN0857'), '_blank')
        }
      ],
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      isBundle: 'payment/getIsBundle'
    }),
    ...mapFields({ periodUi: 'periodUi' }),
    ...mapState('payment', {
      initView: 'initView',
      templateImg: 'templateImg',
      userCountryUi: 'userCountryUi',
      userCountryInfo: 'userCountryInfo',
      switchPaidDate: 'switchPaidDate',
      switchPrice: 'switchPrice',
      card: 'cardInfo',
      plans: 'plans',
      planSelected: 'planSelected',
      trialStatus: 'trialStatus'
    }),
    locale(): string { return this.$i18n.locale },
    userPeriod(): string {
      return ['switch1', 'switch2'].includes(this.view)
        ? (this.isBundle ? 'monthly' : 'yearly')
        : this.periodUi
    },
    showPreStep(): boolean {
      return ['step2', 'step2-coupon', 'switch2'].includes(this.view)
    },
    showFeature(): boolean {
      return [..._IPaymentWarningView, 'cancel1'].includes(this.view)
    },
    cancelReason(): string {
      return Number(this.reasonIndex) < this.cancel2.length - 1
        ? this.cancel2[Number(this.reasonIndex)]
        : this.otherReason
    },
  },
  mounted() {
    console.log(this.$isTouchDevice());
    window.addEventListener('resize', this.handleResize)
    if (!this.isLogin) {
      this.$router.push({ name: 'Login', query: { redirect: this.$route.fullPath } })
      this.closePopup()
    } else if (this.initView === 'step1-coupon') {
      paymentUtils.checkCoupon() ? this.changeView('step1-coupon') : this.closePopup()
    } else {
      this.changeView(this.initView)
    }
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    ...mapActions('payment', {
      getBillingInfo: 'getBillingInfo',
      init: 'init',
      applyCoupon: 'applyCoupon',
      resetCouponResult: 'resetCouponResult',
      getSwitchPrice: 'getSwitchPrice',
      switch: 'switch',
      cancelApi: 'cancel',
      getPrice: 'getPrice'
    }),
    getAd(name: IPaymentWarningView): string[] {
      switch (name) {
        case 'export-pdf-print':
          return [this.$tc('NN0806'), 'export-pdf-print.jpg']
        case 'page-resize':
          return [this.$tc('NN0768'), 'page-resize.jpg']
        case 'brandkit':
          return [this.$tc('NN0583'), 'brandkit.jpg']
        case 'pro-template':
          return [this.$tc('NN0653'), 'cb.jpg']
        case 'pro-object':
          return [this.$tc('NN0658'), 'pro-object.jpg']
        case 'pro-text':
          return [this.$tc('NN0843'), 'pro-text.jpg']
        case 'pro-bg':
          return [this.$tc('NN0845'), 'pro-bg.jpg']
        case 'bgrm':
        default:
          return [this.$tc('NN0652'), 'remover.jpg']
      }
    },
    async changeView(name: IPaymentView) {
      console.log(name)
      this.view = name
      switch (name) {
        case 'export-pdf-print':
        case 'page-resize':
        case 'brandkit':
        case 'bgrm':
        case 'pro-template':
        case 'pro-object':
        case 'pro-text':
        case 'pro-bg':
          [this.description, this.img] = this.getAd(name)
          this.title = this.$tc('NN0507', 2)
          this.buttons = [{
            label: this.$tc('NN0561'),
            func: () => this.changeView('step1')
          }]
          break
        case 'step1-coupon':
          this.getPrice(this.userCountryUi)
          this.init()
          this.currentStep = 1
          this.totalStep = 2
          this.title = this.$tc('NN0701')
          this.description = this.$tc('NN0702')
          this.buttons = [{
            label: this.$tc('NN0550'),
            func: () => {
              this.applyCoupon()
              this.changeView(name.replace('1', '2') as IPaymentPayingView)
            }
          }]
          this.img = 'remover.jpg'
          break
        case 'step1':
          this.getPrice(this.userCountryUi)
          this.init()
          this.currentStep = 1
          this.totalStep = 2
          this.title = this.$tc('NN0545')
          this.description = this.trialStatus === 'not used'
            ? this.$tc('NN0546')
            : this.$tc('NN0547')
          this.buttons = [{
            label: this.$tc('NN0550'),
            func: () => {
              this.changeView(name.replace('1', '2') as IPaymentPayingView)
            }
          }]
          this.img = 'remover.jpg'
          break
        case 'step2-coupon':
        case 'step2':
          this.currentStep = 2
          this.title = this.$tc('NN0551')
          this.description = ''
          this.buttons = [] // Use button in PaymentField.vue
          this.img = 'pro-template1.jpg'
          break
        case 'finish':
          this.getBillingInfo()
          break
        case 'switch1':
          this.title = this.$t('NN0564', { period: this.isBundle ? this.$tc('NN0514') : this.$tc('NN0515') }) as string
          this.description = this.isBundle
            ? this.$tc('NN0566')
            : this.$tc('NN0565')
          this.buttons = [{
            label: this.$t('NN0567', { period: this.isBundle ? this.$tc('NN0514') : this.$tc('NN0515') }) as string,
            func: () => this.changeView('switch2')
          }]
          await this.getPrice(this.userCountryInfo)
          this.getSwitchPrice()
          // A potential issue here: planId return by getPrice may different from the planId user is subscribing,
          // it will let user cannot switch plan since they should switch in the same plan.
          break
        case 'switch2':
          this.title = this.$tc('NN0551')
          this.description = this.$tc('NN0568')
          this.buttons = [{
            label: this.$t('NN0564', { period: this.isBundle ? this.$tc('NN0514') : this.$tc('NN0515') }) as string,
            func: async () => {
              await this.switch()
              this.closePopup()
            }
          }]
          this.img = 'pro-template1.jpg'
          break
        case 'cancel1':
          this.title = this.$tc('NN0569')
          this.buttons = [{
            label: this.$tc('NN0575'),
            func: () => this.closePopup()
          }, {
            type: 'text',
            label: this.$tc('NN0574'),
            func: () => this.changeView('cancel2')
          }]
          this.img = 'pro-template2.jpg'
          break
        case 'cancel2':
          this.title = this.$tc('NN0576')
          this.buttons[1].disabled = () => !this.cancelReason
          this.buttons[1].func = this.cancel
          this.img = 'brandkit.jpg'
          break
      }
    },
    vcoConfig() {
      return {
        handler: this.closePopup,
        middleware: (event: MouseEvent) => {
          return (event.target as HTMLElement).className === 'popup-window'
        }
      }
    },
    setPeriod(value: string) {
      if (this.view.includes('step1')) { this.periodUi = value }
    },
    preStep() {
      if (this.view.startsWith('step2')) this.changeView(this.view.replace('2', '1') as IPaymentPayingView)
      else if (this.view === 'switch2') this.changeView('switch1')
    },
    curPlan(period: string): string {
      return this.view === 'switch1' && period !== this.userPeriod ? `(${this.$tc('NN0655')})` : ''
    },
    selectCancelReason(index: string) {
      this.reasonIndex = index
    },
    cancel() {
      this.cancelApi(this.cancelReason).then(
        this.closePopup
      ).catch(msg => {
        notify({ group: 'error', text: msg })
      })
    },
    closePopup() {
      this.$emit('close')
      this.resetCouponResult()
    },
    handleImageChange(index: number) {
      this.idxCurrImg = index
    },
    handleImgLoad(key: string) {
      if (!this.canShow && key === this.carouselItems[0].key) {
        this.canShow = true
        this.$emit('canShow')
      }
    },
    handleResize() {
      this.windowWidth = window.innerWidth
    },
  }
})
</script>

<style lang="scss" scoped>
input {
  @include default-input;
}

.wrapper {
  @include hover-scrollbar(light);
  @include firefoxOnly {
    scrollbar-width: none;
    &:hover {
      scrollbar-width: thin;
      scrollbar-color: setColor(gray-3) white; // Only for firefox
    }
  }
  &::-webkit-scrollbar {
    width: 0;
  }
  &:hover::-webkit-scrollbar {
    background-color: white;
    width: 12px;
  }
  box-sizing: border-box;
  width: min(792px, 90vw);
  height: min(770px, min(80vw, 90vh));
}

.payment {
  display: flex;
  position: relative;
  width: min(792px, 90vw);
  height: min(770px, 80vw);
  background-color: white;
  text-align: left;
  &-left,
  &-right {
    box-sizing: border-box;
    width: 50%;
  }
  &__close {
    display: none;
  }
}

.payment-left {
  @include body-MD;
  display: flex;
  flex-direction: column;
  padding: 95px 30px;
  &-top,
  &-content {
    width: 100%;
  }
  &-top {
    position: relative;
    margin-bottom: 24px;
    color: setColor(gray-1);
    &__step {
      display: flex;
      align-items: center;
      position: absolute;
      top: -40px;
      > svg {
        margin-right: 15px;
      }
    }
  }
  &-content {
    @include no-scrollbar;
    height: 100%;
    overflow-y: auto;
    input {
      &:focus {
        border-color: setColor(blue-1);
      }
    }
  }
  &-button {
    > .nubtn:nth-child(1) {
      margin-top: 30px;
    }
  }
}

.payment-left-content-coupon {
  margin: -8px 0 25px 0;
}
.payment-left-content-period {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  cursor: pointer;
  + div {
    margin-top: 25px;
  }
  &-price {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 10px;
    &__label {
      @include btn-LG;
      text-transform: capitalize;
    }
  }
  &__off {
    @include overline-SM;
    white-space: nowrap;
  }
  &:not([isSelected]) &__off {
    color: setColor(red-1);
  }
  &[isSelected="true"] {
    background-color: setColor(blue-1);
    border: 1px solid setColor(blue-1);
    color: white;
  }
}

.payment-left-content-switch2 {
  @include overline-LG;
  display: flex;
  justify-content: space-between;
  margin-top: 23px;
}

.payment-left-content-cancel {
  display: flex;
  margin-bottom: 10px;
  > svg,
  > div {
    flex-shrink: 0;
    margin-right: 15px;
  }
  &__other {
    margin-top: 10px;
  }
}

.payment-right {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  &-temp {
    position: absolute;
    max-width: calc(100% - 80px);
    max-height: calc(100% - 50px);
  }
}

.payment-finish {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: white;
  &-content {
    @include body-SM;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    color: setColor(gray-2);
    width: 560px;
    height: 310px;
  }
}

@media screen and (max-width: 768px) {
  .wrapper {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: calc(100% - #{$header-height});
  }
  .payment {
    width: 100%;
    height: fit-content;
    min-height: 100%;
    &__close {
      display: block;
      position: absolute;
      top: 16px;
      right: 16px;
    }
  }
  .payment-left {
    width: 100%;
    padding: 105px 7.467%;
  }
  .payment-right {
    display: none;
  }
  .payment-finish span {
    padding: 0 7.467%;
  }

  // mobile styles
  .isTouchDevice.wrapper {
    height: 100%;
    overflow: hidden;
    .payment {
      width: 100%;
      height: fit-content;
      min-height: 100%;
      &__close {
        color: setColor(gray-2);
        opacity: 0.5;
        z-index: 1;
      }
      &__carousel-item {
        display: flex;
        justify-content: center;
        width: inherit;
        max-height: calc(100vh - 320px);
        &__img {
          width: 100%;
          object-fit: cover;
          object-position: center;
        }
        &__overlay {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: calc(100% + 1px); // prevent subpixel problem
          background: linear-gradient(0deg, rgba(white,1) 0%, rgba(white,0.74) 19.83%, rgba(white,0) 36%);
        }
        &__title {
          position: absolute;
          bottom: 50px;
          width: calc(100% - 48px);
          margin: 0px 24px;
          text-align: left;
        }
      }
      &__content {
        margin: 0px 24px 68px;
        position: relative;
        &__indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          column-gap: 8px;
          position: absolute;
          width: 100%;
          top: -26px;
          &__item {
            @include size(6px);
            border-radius: 50%;
            background: setColor(gray-3);
            opacity: 0.3;
            &--active {
              opacity: 1;
            }
          }
        }
        &__plans {
          display: flex;
          flex-direction: column;
          row-gap: 12px;
        }
      }
      &__btn-plan {
        box-sizing: border-box;
        height: 60px;
        display: grid;
        grid-template-columns: 20px 1fr;
        align-items: center;
        column-gap: 16px;
        padding: 0px 16px;
        border: 2px solid transparent;
        position: relative;
        color: setColor(gray-3);
        &.selected {
          background: rgba(78, 171, 230, 0.10);
          border: 2px solid setColor(blue-1);
          border-radius: 10px;
          opacity: 0.8;
          color: setColor(gray-1);
        }
        &__radio {
          @include size(20px);
          box-sizing: border-box;
          border: 2px solid setColor(gray-3);
          border-radius: 100px;
          &.selected {
            background-color: setColor(blue-1);
            border: none
          }
        }
        &__content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          &__title {
            display: flex;
            flex-direction: column;
            row-gap: 2px;
            text-align: left;
            text-transform: capitalize;
            &__main {
              height: 18px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            &__sub {
              height: 16px;
              display: flex;
              align-items: center;
              & > span {
                font-weight: 500;
                font-size: 12px;
                line-height: normal;
                transform: scale(0.917);
                transform-origin: left;
              }
            }
          }
          &__price {
            position: relative;
            text-align: right;
          }
          &__tag {
              align-self: start;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 20px;
              right: 16px;
              position: absolute;
              padding: 0px 8px;
              transform: translateY(calc(-50% - 1px));
              background: setColor(blue-1);
              border-radius: 100px;
              white-space: nowrap;
              color: white;
            }
        }
      }
      &__btn-subscribe {
        position: relative;
        width: 100%;
        height: 40px;
        box-sizing: border-box;
        margin: 12px auto 0 auto;
        padding: 4px 8px;
        background: setColor(blue-1);
        border-radius: 100px;
        @include text-H6;
        display: flex;
        align-items: center;
        text-align: center;
        color: white;
        &__text {
          width: 100%;
        }
        &.pending {
          pointer-events: none;
          .payment__btn-subscribe__text {
            visibility: hidden;
          }
        }
        &:active {
          opacity: 0.8;
        }
        .spinner {
          color: #D9D9D9;
          animation: translate-rotate 0.5s infinite linear;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      }
      &__notice {
        width: 100%;
        // overflow-x: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
        @include no-scrollbar;
        &__text {
          height: 14px;
          display: flex;
          align-items: center;
          white-space: nowrap;
        }
      }
      &__footer {
        height: 18px;
        margin: 12px auto 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: 10px;
        white-space: nowrap;
        &__splitter {
          @include size(0px, 12px);
          border: 1px solid setColor(gray-4);
          border-radius: 1px;
        }
      }
      &__field {
        padding: 54px 44px 0px 26px;
      }
    }
    .payment-left {
      padding: 0px;
    }
  }
}
</style>
