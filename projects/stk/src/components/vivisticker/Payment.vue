<template lang="pug">
div(class="payment" v-touch @swipe.stop)
  carousel(
    :items="carouselItems"
    :itemWidth="containerWidth"
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
        div(class="payment__carousel-item__title text-white text-H4" v-html="item.title")
  div(class="payment__content")
    div(class="payment__content__indicator")
      div(v-for="(url, idx) in carouselItems"
        :key="idx"
        class="payment__content__indicator__item"
        :class="{ 'payment__content__indicator__item--active': idx === idxCurrImg }")
    div(class="payment__content__plans")
      div(v-for="btnPlan in btnPlans" class="payment__btn-plan"
        :key="btnPlan.key"
        :class="{selected: btnPlan.key === planSelected, disabled: pending.purchase}"
        @tap="handleBtnPlanClick(btnPlan.key)")
        svg-icon(v-if="btnPlan.key === planSelected" class="payment__btn-plan__radio selected" iconName="vivisticker-check" iconWidth="20px" iconColor="black-3")
        div(v-else class="payment__btn-plan__radio")
        div(class="payment__btn-plan__content")
          div(class="payment__btn-plan__content__title")
            div(class="payment__btn-plan__content__title__main caption-LG") {{ btnPlan.title }}
            div(v-if="btnPlan.subTitle" class="payment__btn-plan__content__title__sub")
              span {{ btnPlan.subTitle }}
          div(class="payment__btn-plan__content__price text-H6") {{ btnPlan.price }}
        div(v-if="btnPlan.key === planSelected && btnPlan.tag" class="payment__btn-plan__content__tag")
          span(class="caption-SM") {{ btnPlan.tag }}
    div(class="payment__trial")
      span(class="payment__trial__text caption-LG") {{ strTrial }}
      toggle-btn(class="payment__trial__toggle" v-model="isTrialToggled" :width="42" :height="24" :colorActive="isTrialDisabled ? 'black-3' : 'alarm'" :colorInactive="isTrialDisabled ? 'black-3' : 'black-4'")
    div(class="payment__btn-subscribe" :class="{pending: pending.purchase}" @touchend="handleSubscribe(planSelected)")
      svg-icon(v-if="pending.purchase" class="spinner" iconName="spiner" iconWidth="20px")
      div(class="payment__btn-subscribe__text") {{ txtBtnSubscribe }}
    div(class="payment__notice text-black-5" ref="notice")
      div(class="payment__notice__text body-XXS" ref="txtNotice") {{ strNotice }}
    div(class="payment__footer" :class="{disabled: pending.purchase}")
      template(v-for="(footerLink, idx) in footerLinks" :key="footerLink.key")
        span(v-if="idx > 0" class="payment__footer__splitter")
        span(class="body-XXS" @tap="footerLink.action") {{ footerLink.title }}
  div(class="payment__panel" :class="{close: !isPanelUp, disabled: pending.purchase}" ref="panel")
    div(class="payment__panel__chevron" ref="chevron" @swipeup.stop="togglePanel(true)" @swipedown.stop="togglePanel(false)" @panstart.stop="dragPanelStart" @panmove.stop="dragingPanel" @panend.stop="dragPanelEnd" @pointerdown.stop="panelAniProgress = 0")
      svg-icon(iconName="chevron-up" iconWidth="14px")
      div(class="payment__panel__chevron__title") {{ $t('STK0042') }}
    div(class="payment__panel__comparison")
      div(class="payment__panel__comparison__title first-column") {{ $t('STK0043') }}
      div(class="payment__panel__comparison__title") {{ $t('STK0044') }}
      div(class="payment__panel__comparison__title") PRO
      template(v-for="comparison in comparisons" :key="comparison.feature")
        div(class="payment__panel__comparison__splitter")
        div(class="payment__panel__comparison__item  first-column") {{ comparison.feature }}
        div(class="payment__panel__comparison__item")
          svg-icon(v-if="comparison.free" iconName="vivisticker-check" iconWidth="36px" iconColor="white")
          template(v-else) -
        div(class="payment__panel__comparison__item")
          svg-icon(v-if="comparison.pro" iconName="vivisticker-check" iconWidth="36px" iconColor="white")
          template(v-else) -
  Transition(name="fade")
    div(v-if="pending.info || pending.restore" class="payment__spinner")
      svg-icon(class="spinner" iconName="spiner" iconWidth="24px")
</template>

<script lang="ts">
import Carousel from '@/components/global/Carousel.vue'
import ToggleBtn from '@/components/global/ToggleBtn.vue'
import { IPaymentPending, IPrices } from '@/interfaces/vivisticker'
import networkUtils from '@/utils/networkUtils'
import vivistickerUtils, { IViviStickerProFeatures } from '@/utils/vivistickerUtils'
import AnyTouch, { AnyTouchEvent } from 'any-touch'
import { round } from 'lodash'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

interface CarouselItem {
  key: IViviStickerProFeatures
  title: string
  img: string
}

interface IComparison {
  feature: string,
  free: boolean,
  pro: boolean
}

export default defineComponent({
  emits: ['canShow'],
  components: {
    Carousel,
    ToggleBtn
  },
  props: {
    target: {
      type: String as PropType<IViviStickerProFeatures>,
      default: 'frame'
    }
  },
  data() {
    return {
      idxCurrImg: 0,
      planSelected: 'annually',
      isTrialToggled: false,
      isPanelUp: false,
      canShow: false,
      initPanelUp: false,
      isDraggingPanel: false,
      panelDragHeight: 0,
      panelAniProgress: 1,
      lastPointerY: 0,
      carouselItems: [
        {
          key: 'template',
          title: this.$t('STK0071'),
          img: require(`@/assets/img/png/pricing/${this.$i18n.locale}/vivisticker_pro-template.png`)
        },
        {
          key: 'frame',
          title: this.$t('STK0049'),
          img: require('@/assets/img/png/pricing/vivisticker_frame.png')
        },
        {
          key: 'object',
          title: this.$t('STK0051'),
          img: require('@/assets/img/png/pricing/vivisticker_pro-object.png')
        },
        {
          key: 'text',
          title: this.$t('STK0050'),
          img: require(`@/assets/img/png/pricing/${this.$i18n.locale}/vivisticker_pro-text.png`)
        },
        {
          key: 'bg-remove',
          title: this.$t('STK0083'),
          img: require(`@/assets/img/png/pricing/${this.$i18n.locale}/vivisticker_pro-bg-remove.png`)
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
          action: () => window.open(this.$t('STK0053'), '_blank')
        },
        {
          key: 'privacyPolicy',
          title: this.$t('NN0161'),
          action: () => window.open(this.$t('STK0052'), '_blank')
        }
      ],
      comparisons: [
        { feature: this.$t('STK0037'), free: true, pro: true },
        { feature: this.$t('STK0038'), free: false, pro: true },
        { feature: this.$t('STK0039'), free: false, pro: true },
        { feature: this.$t('STK0040'), free: false, pro: true },
        { feature: this.$t('STK0041'), free: false, pro: true }
      ] as IComparison[]
    }
  },
  created() {
    if(this.payment.trialCountry.includes(this.$i18n.locale)) this.isTrialToggled = true
  },
  mounted() {
    const at = new AnyTouch((this.$refs.chevron as HTMLElement))
    at.on('tap', () => this.togglePanel())
    at.get('tap').maxDistance = 2
    // this.updateNoticeStyles()
  },
  // watch: {
  //   'windowSize.width'() {
  //     this.updateNoticeStyles()
  //   },
  //   strNotice() {
  //     this.updateNoticeStyles()
  //   }
  // },
  computed: {
    ...mapState({
      windowSize: 'windowSize',
      isTablet: 'isTablet',
      isLandscape: 'isLandscape'
    }),
    ...mapState('vivisticker', {
      pending: (state: any) => state.payment.pending as IPaymentPending,
    }),
    ...mapGetters({
      payment: 'vivisticker/getPayment',
      isPaymentPending: 'vivisticker/getIsPaymentPending',
    }),
    txtBtnSubscribe() {
      return this.isTrialToggled ? this.$t('STK0046') : this.$t('STK0047')
    },
    localizedTag(): string {
      if (!this.payment.prices) return ''
      const prices = this.payment.prices as IPrices
      const currency = prices.currency
      const price = round(prices.annually.value / 12, currency === 'TWD' || currency === 'JPY' ? 0 : 2)
      if (isNaN(price)) return ''
      switch (currency) {
        case 'TWD':
          return `${price}元 / 月`
        case 'JPY':
          return `¥${price}円 / 月額`
        default:
          return `$${price} / Mo`
      }
    },
    btnPlans() {
      return [
        {
          key: 'monthly',
          title: this.$t('NN0514'),
          subTitle: '',
          price: this.payment.prices.monthly.text,
          tag: ''
        },
        {
          key: 'annually',
          title: this.$t('NN0515'),
          subTitle: '',
          price: this.payment.prices.annually.text,
          tag: this.localizedTag
        }
      ]
    },
    containerWidth() {
      return this.isTablet && this.isLandscape ? round(this.windowSize.width * 0.44) : this.windowSize.width // round to prevent subpixel problem
    },
    containerPadding() {
      return (this.windowSize.width - this.containerWidth) / 2
    },
    padding() {
      return this.isTablet ? `${this.containerWidth * 0.028}px` : '24px'
    },
    panelPadding() {
      return `${this.containerPadding + (this.isTablet ? this.containerWidth * 0.028 : 24)}px`
    },
    strNotice() {
      switch (this.planSelected) {
        case 'monthly':
          return this.$t('STK0056')
        case 'annually':
          return this.$t('STK0057', { day: this.payment.trialDays })
        default:
          return ''
      }
    },
    strTrial() {
      return this.isTrialToggled ? this.$t('STK0094') : this.$t('STK0048', { day: this.payment.trialDays })
    },
    showPanelTitle() {
      return !this.isDraggingPanel ? !this.isPanelUp : !this.isPanelUp && this.panelAniProgress === 1
    },
    isTrialDisabled() {
      return this.planSelected === 'monthly' || this.isPaymentPending
    }
  },
  methods: {
    ...mapMutations({
      setPaymentPending: 'vivisticker/SET_paymentPending'
    }),
    handleImageChange(index: number) {
      this.idxCurrImg = index
    },
    handleBtnPlanClick(key: string) {
      this.planSelected = key
      if (key === 'monthly') this.isTrialToggled = false
      else if (key === 'annually' && this.payment.trialCountry.includes(this.$i18n.locale)) this.isTrialToggled = true
    },
    handleSubscribe(option: string, timeout?: number) {
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
        return
      }
      if (this.isPaymentPending) return
      if(option === 'monthly') option = 'com.nuphototw.vivisticker.monthly'
      else if (option === 'annually') option = !this.isTrialDisabled && this.isTrialToggled ? 'com.nuphototw.vivisticker.annually' : 'com.nuphototw.vivisticker.yearly_free0'
      this.setPaymentPending({ [option === 'restore' ? 'restore' : 'purchase']: true })
      vivistickerUtils.sendToIOS('SUBSCRIBE', { option })
      if (timeout) {
        setTimeout(() => {
          this.setPaymentPending({ [option === 'restore' ? 'restore' : 'purchase']: false })
          vivistickerUtils.appToast('Network timeout error')
        }, timeout)
      }
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
    // updateNoticeStyles() {
    //   const elNotice = this.$refs.notice as HTMLElement
    //   const elTxtNotice = this.$refs.txtNotice as HTMLElement
    //   this.$nextTick(() => {
    //     elTxtNotice.style.paddingRight = ''
    //     elTxtNotice.style.width = ''
    //     elNotice.onscroll = null

    //     elTxtNotice.style.display = 'inline-block'
    //     const txtWidth = elTxtNotice.clientWidth + 10
    //     elTxtNotice.style.display = ''
    //     if (txtWidth > elNotice.clientWidth) {
    //       const updateTxtNoticeStyles = () => {
    //         const scrollLeft = elNotice.scrollLeft
    //         const clientWidth = elNotice.clientWidth
    //         elTxtNotice.style.paddingRight = `${txtWidth - scrollLeft - clientWidth}px`
    //         elTxtNotice.style.width = `${scrollLeft + clientWidth}px`
    //       }
    //       elNotice.onscroll = updateTxtNoticeStyles
    //       updateTxtNoticeStyles()
    //     }
    //   })
    // },
    bezier(t: number, initial: number, p1: number, p2: number, final: number) {
      return (
        (1 - t) * (1 - t) * (1 - t) * initial +
        3 * (1 - t) * (1 - t) * t * p1 +
        3 * (1 - t) * t * t * p2 +
        t * t * t * final
      )
    },
    handleImgLoad(key: string) {
      if (!this.canShow && key === this.carouselItems[0].key) {
        this.canShow = true
        this.$emit('canShow')
      }
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
  }
})
</script>

<style lang="scss" scoped>
.payment {
  @include size(100%);
  @include no-scrollbar;
  display: flex;
  flex-direction: column;
  font-family: 'Poppins';
  overflow-x: hidden;
  width: v-bind("containerWidth + 'px'");
  margin: 0 auto;
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
      background: linear-gradient(0deg, rgba(setColor(black-1),1) 0%, rgba(setColor(black-1),0) 25%);
    }
    &__title {
      position: absolute;
      bottom: 50px;
      width: calc(100% - 48px);
      margin: 0px v-bind(padding);
      text-align: left;
    }
  }
  &__content {
    margin: 0px v-bind(padding) 68px v-bind(padding);
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
        background: white;
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
    height: 52px;
    display: grid;
    grid-template-columns: 20px 1fr;
    align-items: center;
    column-gap: 16px;
    padding: 10px 16px;
    color: setColor(black-5);
    border: 2px solid transparent;
    position: relative;
    &.disabled {
      pointer-events: none;
      color: setColor(black-3);
      .payment__btn-plan__radio {
        border-color: rgba(setColor(black-5), 0.3);
      }
    }
    &.selected {
      background: rgba(white, 0.16);
      border: 2px solid rgba(white, 0.8);
      border-radius: 10px;
      color: rgba(white, 0.8);
      &.disabled {
        background: rgba(white, 0.06);
        border: 2px solid rgba(white, 0.3);
        .payment__btn-plan__content__title,
        .payment__btn-plan__content__title__sub,
        .payment__btn-plan__content__price {
          color: rgba(white, 0.3);
        }
        .payment__btn-plan__radio{
          background-color: rgba(white, 0.3);
          border-color: rgba(setColor(black-5), 0.3);
        }
      }
    }
    &__radio {
      @include size(20px);
      box-sizing: border-box;
      border: 2px solid setColor(black-5);
      border-radius: 100px;
      &.selected {
        background-color: rgba(white, 0.8);
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
          right: 18px;
          position: absolute;
          padding: 0px 8px;
          transform: translateY(calc(-50% - 1px));
          background: setColor(alarm);
          border-radius: 100px;
          white-space: nowrap;
          color: setColor(black-3);
        }
    }
  }
  &__trial {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 12px 16px 0px;
    &__text {
      color: v-bind("isTrialDisabled ? '#474747' : 'white'");
      transition: color 0.3s ease-in-out;
    }
    &__toggle {
      pointer-events: v-bind("isTrialDisabled ? 'none' : 'auto'");
    }
  }
  &__btn-subscribe {
    position: relative;
    width: 100%;
    height: 40px;
    box-sizing: border-box;
    margin: 12px auto 0 auto;
    padding: 4px 8px;
    background: white;
    border-radius: 100px;
    @include text-H6;
    display: flex;
    align-items: center;
    text-align: center;
    color: setColor(black-3);
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
    overflow-x: auto;
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
    color: setColor(black-5);
    column-gap: 10px;
    white-space: nowrap;
    &.disabled {
      color: setColor(black-3);
      pointer-events: none;
    }
    &__splitter {
      @include size(0px, 12px);
      border: 1px solid #474747;
      border-radius: 1px;
    }
  }
  &__panel {
    position: absolute;
    box-sizing: border-box;
    color: white;
    background-color: setColor(black-3);
    border-radius: 10px 10px 0px 0px;
    z-index: setZindex("popup");
    animation: open-panel 300ms v-bind("isDraggingPanel ? 'linear' : 'ease-in-out'") forwards;
    animation-play-state: v-bind("isDraggingPanel ? 'paused' : 'running'");
    animation-delay: calc(v-bind(panelAniProgress) * -300ms);
    &.disabled {
      color: setColor(black-4);
      pointer-events: none;
      .payment__panel__chevron > svg {
        color: setColor(black-4);
      }
    }
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
      background-color: setColor(black-3);
      border-radius: 100px;
      display: flex;
      >svg {
        color: white;
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
      display: grid;
      grid-template-columns: 1fr 80px 80px;
      grid-template-rows: min-content;
      column-gap: 8px;
      padding-top: 11px;
      max-height: calc(100vh - 50px);
      overflow-y: auto;
      &__splitter{
          border-top: 1px solid #474747;
          grid-column: 1 / 5;
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
  &__spinner {
    @include size(120px);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(46, 46, 46, 0.5);
    border-radius: 10px;
    &::before {
      content: "";
      @include size(100vw, 100vh);
      position: absolute;
      background-color: setColor(gray-1);
      opacity: 0.3;
    }
    .spinner {
      color: #D9D9D9;
      animation: rotate 0.5s infinite linear;
    }
  }
}

.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.2s;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes translate-rotate {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes open-panel {
  from {
    padding: 16px 0 0 0;
    left: v-bind(panelPadding);
    right: v-bind(panelPadding);
    bottom: -20px;
    transform: translateY(calc(100% - 56px));
  }
  to {
    padding: 16px v-bind(padding) 0px v-bind(padding);
    left: v-bind("containerPadding + 'px'");
    right: v-bind("containerPadding + 'px'");
    bottom: 0px;
    transform: none;
  }
}

@keyframes close-panel {
  from {
    padding: 16px v-bind(padding) 0px v-bind(padding);
    left: v-bind("containerPadding + 'px'");
    right: v-bind("containerPadding + 'px'");
    bottom: 0px;
    transform: none;
  }
  to {
    padding: 16px 0 0 0;
    left: v-bind(panelPadding);
    right: v-bind(panelPadding);
    bottom: -20px;
    transform: translateY(calc(100% - 56px));
  }
}
</style>
