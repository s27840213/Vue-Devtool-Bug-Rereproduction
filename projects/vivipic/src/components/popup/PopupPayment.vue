<template lang="pug">
div(class="popup-window")
  div(class="wrapper" :class="{isTouchDevice: $isTouchDevice(), isMobileView: isMobileView, isRoundedBtn: isRoundedBtn}")
    div(class="payment" v-click-outside="vcoConfig()")
      svg-icon(class="payment__close" iconName="close" iconWidth="32px"
              iconColor="gray-0" @click="closePopup()")
      div(class="payment-left")
        div(v-if="!isMobileView" class="payment-left-top")
          div(v-if="showStep" class="payment-left-top__step")
            svg-icon(v-if="showPreStep" iconName="left-arrow" iconWidth="24px"
                    iconColor="gray1" @click="preStep()")
            span(v-if="totalStep") {{$t('NN0544')}} {{currentStep}} of {{totalStep}}
          div(class="text-H4" v-html="title")
          div(v-if="description" class="mt-15") {{description}}
        //- switch(view)
        div(class="payment-left-content")
          //- case step1 or switch1
          template(v-if="['step1', 'switch1', 'step1-coupon'].includes(view)")
            template(v-if="!isMobileView")
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
            //- mobile version
            div(v-else v-touch @swipe.stop)
              carousel(
                :items="carouselItems"
                :itemWidth="windowWidth"
                :initIndex="carouselItems.findIndex(item => item.key === target)"
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
                          span {{ $t('STK0048', { day: 14 }) }}
                      div(class="payment__btn-plan__content__price text-H6") {{ getLocalizedPrice(plans[planSelected][btnPlan.value].nextPaid) }}
                    div(v-if="btnPlan.value === userPeriod && btnPlan.value === 'yearly'" class="payment__btn-plan__content__tag")
                      span(class="caption-SM") {{ getLocalizedTag(plans[planSelected][btnPlan.value].now) }}
                div(class="payment__btn-subscribe" @touchend="changeView('step2')")
                  div(class="payment__btn-subscribe__text") {{ $t('STK0046') }}
                div(class="payment__notice text-gray-3" ref="notice")
                  div(class="payment__notice__text body-XXS" ref="txtNotice") {{ $t('STK0057', { day: 14 }) }}
                div(class="payment__footer text-gray-3")
                  template(v-for="(footerLink, idx) in footerLinks" :key="footerLink.key")
                    span(v-if="idx > 0" class="payment__footer__splitter")
                    span(class="body-XXS" @tap="footerLink.action") {{ footerLink.title }}
              div(class="payment__panel" :class="{close: !isPanelUp}" ref="panel")
                div(class="payment__panel__chevron" ref="chevron" @tap="togglePanel()" @swipeup.stop="togglePanel(true)" @swipedown.stop="togglePanel(false)" @panstart.stop="dragPanelStart" @panmove.stop="dragingPanel" @panend.stop="dragPanelEnd" @pointerdown.stop="panelAniProgress = 0")
                  svg-icon(iconName="chevron-up" iconWidth="14px")
                  div(class="payment__panel__chevron__title") {{ $t('STK0042') }}
                div(class="payment__panel__comparison")
                  div(class="payment__panel__comparison__header")
                    div(class="payment__panel__comparison__title first-column") {{ $t('STK0043') }}
                    div(class="payment__panel__comparison__title") {{ $t('STK0044') }}
                    div(class="payment__panel__comparison__title") PRO
                  div(class="payment__panel__comparison__list")
                    template(v-for="comparison in comparisons" :key="comparison.feature")
                      div(class="payment__panel__comparison__splitter")
                      div(class="payment__panel__comparison__item  first-column") {{ comparison.feature }}
                      div(class="payment__panel__comparison__item")
                        svg-icon(v-if="comparison.free === true" iconName="check" iconWidth="36px" iconColor="blue-1")
                        template(v-else) {{ comparison.free }}
                      div(class="payment__panel__comparison__item")
                        svg-icon(v-if="comparison.pro === true" iconName="check" iconWidth="36px" iconColor="blue-1")
                        template(v-else) {{ comparison.pro }}
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
        div(v-if="!isMobileView" class="payment-left-button")
          nubtn(v-for="button in buttons"
              :key="button.label"
              size="mid-full"
              :theme="button.type ?? 'primary'"
              :disabled="button.disabled ? button.disabled() : false"
              @click="button.func()") {{button.label}}
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
import { IPaymentPayingView, IPaymentView, IPaymentWarningView, _IPaymentWarningView, IMobilePaymentWarningView, _IMobilePaymentWarningView } from '@/interfaces/payment'
import paymentData from '@/utils/constantData'
import paymentUtils from '@/utils/paymentUtils'
import { notify } from '@kyvg/vue3-notification'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'

interface CarouselItem {
  key: IMobilePaymentWarningView
  title: string
  img: string
}

interface IComparison {
  feature: string,
  free: string | boolean,
  pro: string | boolean
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
      initPanelUp: false,
      isPanelUp: false,
      isDraggingPanel: false,
      panelDragHeight: 0,
      panelAniProgress: 1,
      lastPointerY: 0,
      carouselItems: [
        {
          key: 'pro-template',
          title: this.$t('NN0905'),
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-template.jpg`)
        },
        {
          key: 'pro-text',
          title: this.$t('NN0906'),
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-text.jpg`)
        },
        {
          key: 'pro-object',
          title: this.$t('NN0907'),
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/pro-object.jpg`)
        },
        {
          key: 'page-resize',
          title: this.$t('NN0908'),
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/page-resize.jpg`)
        },
        {
          key: 'export-pdf-print',
          title: this.$t('NN0909'),
          img: require(`@/assets/img/jpg/pricing-mobile/${this.$i18n.locale}/export-pdf-print.jpg`)
        },
        {
          key: 'pro-bg',
          title: this.$t('NN0910'),
          img: require(`@/assets/img/jpg/pricing-mobile/pro-bg.jpg`)
        },
        {
          key: 'bgrm',
          title: this.$t('NN0911'),
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
      comparisons: [] as IComparison[]
    }
  },
  created() {
    const compareTable = paymentData.compareTable().slice(3)
    const length = compareTable.length / 3
    for(let i = 0; i < length; i++) {
      this.comparisons.push({
        feature: compareTable.shift() as string,
        free: compareTable.shift() ?? '',
        pro: compareTable.shift() ?? ''
      })
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
    showStep(): boolean {
      return !this.$isTouchDevice() || ['step1-coupon', 'step2-coupon'].includes(this.view)
    },
    showFeature(): boolean {
      return [..._IPaymentWarningView, 'cancel1'].includes(this.view)
    },
    cancelReason(): string {
      return Number(this.reasonIndex) < this.cancel2.length - 1
        ? this.cancel2[Number(this.reasonIndex)]
        : this.otherReason
    },
    showPanelTitle() {
      return !this.isDraggingPanel ? !this.isPanelUp : !this.isPanelUp && this.panelAniProgress === 1
    },
    isMobileView(): boolean {
      return this.$isTouchDevice() && ['step1'].includes(this.view)
    },
    isRoundedBtn(): boolean {
      return this.$isTouchDevice() && ['step1', 'step1-coupon', 'step2', 'step2-coupon', 'finish'].includes(this.view)
    },
    target(): string {
      return _IMobilePaymentWarningView.includes(this.initView) ? this.initView : 'pro-template'
    },
  },
  watch: {
    isMobileView(newVal) {
      if (!newVal) return
      this.$nextTick(() => {
        const elChevron = (this.$refs.chevron as HTMLElement)
        if (!elChevron) return
        const at = new AnyTouch(elChevron)
        at.on('tap', () => this.togglePanel())
        at.get('tap').maxDistance = 2
      })
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    if (!this.isLogin) {
      this.$router.push({ name: 'Login', query: { redirect: this.$route.fullPath } })
      this.closePopup()
    } else if (this.initView === 'step1-coupon') {
      paymentUtils.checkCoupon() ? this.changeView('step1-coupon') : this.closePopup()
    } else if (this.$isTouchDevice() && _IMobilePaymentWarningView.includes(this.initView)) { 
      this.changeView('step1')
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
          this.isPanelUp = false
          this.panelAniProgress = 1
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
          this.isPanelUp = false
          this.panelAniProgress = 1
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
          this.isPanelUp = false
          this.panelAniProgress = 1
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
      if (!this.showStep && this.view.startsWith('step2')) return this.changeView(this.view.replace('2', '1') as IPaymentPayingView)
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
    togglePanel(up?: boolean) {
      if (up === undefined) {
        if (this.panelAniProgress !== 0 && this.panelAniProgress !== 1) return
        this.isPanelUp = !this.isPanelUp
        return
      }
      if (this.isPanelUp !== up) this.panelAniProgress = 1 - this.panelAniProgress
      this.isPanelUp = up
    },
    bezier(t: number, initial: number, p1: number, p2: number, final: number) {
      return (
        (1 - t) * (1 - t) * (1 - t) * initial +
        3 * (1 - t) * (1 - t) * t * p1 +
        3 * (1 - t) * t * t * p2 +
        t * t * t * final
      )
    },
    dragPanelStart(event: AnyTouchEvent) {
      if (this.isDraggingPanel) return // this event will be triggered on dragging direction change
      this.isDraggingPanel = true
      this.lastPointerY = event.y
      this.panelDragHeight = 0
      this.panelAniProgress = 0
      this.initPanelUp = this.isPanelUp
      this.dragingPanel(event)
    },
    dragingPanel(event: AnyTouchEvent) {
      this.panelDragHeight -= event.y - this.lastPointerY
      this.lastPointerY = event.y
      const newProgress = Math.max(Math.min((this.initPanelUp ? -this.panelDragHeight : this.panelDragHeight) / ((this.$refs.panel as HTMLElement).clientHeight - 36), 1), 0)
      if (newProgress > 0) {
        this.isPanelUp = !this.initPanelUp
        this.panelAniProgress = newProgress
      } else {
        this.isPanelUp = this.initPanelUp
        this.panelAniProgress = 1
      }
    },
    dragPanelEnd() {
      this.isDraggingPanel = false
      if (this.initPanelUp !== this.isPanelUp && this.panelAniProgress < 0.5) {
        this.isPanelUp = this.initPanelUp
        this.panelAniProgress = 1 - this.panelAniProgress
      }
      this.panelAniProgress = this.bezier(this.panelAniProgress, 0.0, 0.42, 0.58, 1.0) // css ease-in-out function
    },
    getLocalizedPrice(price: number): string {
      const currencyMap = new Map([
        ['tw', '元'],
        ['jp', 'ドル'],
        ['us', ''],
      ])
      return (this.locale === 'tw' ? '' : '$') + price + currencyMap.get(this.locale)
    },
    getLocalizedTag(price: number): string {
      return (this.locale === 'tw' ? '' : '$') + price + this.$t('NN0516').replace('/', ' / ')
    }
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
    margin-bottom: 16px;
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
  margin-bottom: 15px;
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
  .isRoundedBtn.wrapper {
    &:deep(.nubtn) {
      position: absolute;
      bottom: 74px;
      width: 85.066% !important;
      height: 40px !important;
      border-radius: 100px;
      &.text {
        bottom: 34px;
      }
    } 
  }
  .isTouchDevice.wrapper {
    height: 100%;
    overflow: hidden;
    .payment__close {
      color: setColor(gray-2);
      opacity: 0.5;
      z-index: 1;
      top: 50px;
    }
    
  }
  .isMobileView.wrapper {
    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 34px;
      left: 0px;
      bottom: 0px;
      background-color: white;
      z-index: setZindex("popup");
    }
    .payment-left {
      padding: 0px;
    }
    .payment-left-content{
      overflow: hidden;
    }
    .payment {
      width: 100%;
      height: fit-content;
      min-height: 100%;
      &__carousel-item {
        display: flex;
        justify-content: center;
        width: inherit;
        height: 100vh;
        max-height: calc(100vh - 344px);
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
        margin: 16px auto 0;
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
        margin: 16px auto 0 auto;
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
      &__panel {
        position: absolute;
        box-sizing: border-box;
        color: setColor(gray-2);
        background-color: setColor(gray-6);
        border-radius: 10px 10px 0px 0px;
        z-index: setZindex("popup");
        animation: open-panel 300ms v-bind("isDraggingPanel ? 'linear' : 'ease-in-out'") forwards;
        animation-play-state: v-bind("isDraggingPanel ? 'paused' : 'running'");
        animation-delay: calc(v-bind(panelAniProgress) * -300ms);
        &.close {
          animation: close-panel 300ms v-bind("isDraggingPanel ? 'linear' : 'ease-in-out'") forwards;
          animation-play-state: v-bind("isDraggingPanel ? 'paused' : 'running'");
          animation-delay: calc(v-bind(panelAniProgress) * -300ms);
        }
        &__chevron {
          position: absolute;
          top: 0;
          left: 50%;
          padding: 9px 22px;
          transform: translate(-50%, -50%);
          background-color: setColor(gray-6);
          border-radius: 100px;
          display: flex;
          >svg {
            color: setColor(gray-2);
            transform: v-bind("isPanelUp ? 'rotate(180deg)' : 'none'");
            transition: none;
            width: 14px;
            height: 8px;
          }
          &__title {
            @include caption-SM;
            position: absolute;
            left: 50%;
            top: 26px;
            display: v-bind("showPanelTitle ? 'block' : 'none'");
            letter-spacing: 0.8px;
            text-transform: capitalize;
            white-space: nowrap;
            transform: translateX(-50%) scale(0.917);
            transform-origin: top;
          }
        }
        &__comparison {
          &__header, &__list {
            display: grid;
            grid-template-columns: 1fr 80px 80px;
            grid-template-rows: min-content;
            column-gap: 8px;
          }
          &__header{
            padding-top: 11px;
            border-bottom: 1px solid setColor(gray-4);
          }
          &__list {
            overflow-y: auto;
            max-height: calc(100vh - 230px);
          }
          
          &__splitter{
              border-top: 1px solid setColor(gray-4);
              grid-column: 1 / 4;
          }
          &__splitter:first-child{
              display: none;
          }
          &__title {
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-bottom: 16px;
            @include text-H6;
          }
          &__item {
            padding: 20px 0 16px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            @include body-SM;
          }
        }
        .first-column {
          text-align: left;
          justify-content: left;
        }
      }
    }
  }
}

@keyframes open-panel {
  from {
    padding: 16px 0 0 0;
    left: 24px;
    right: 24px;
    bottom: 14px;
    transform: translateY(calc(100% - 56px));
  }
  to {
    padding: 16px 24px 0px;
    left: 0px;
    right: 0px;
    bottom: 34px;
    transform: none;
  }
}

@keyframes close-panel {
  from {
    padding: 16px 24px 0px;
    left: 0px;
    right: 0px;
    bottom: 34px;
    transform: none;
  }
  to {
    padding: 16px 0 0 0;
    left: 24px;
    right: 24px;
    bottom: 14px;
    transform: translateY(calc(100% - 56px));
  }
}
</style>
