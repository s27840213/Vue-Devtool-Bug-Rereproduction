<template lang="pug">
div(class="payment" v-touch @swipe="handleSwipe")
  carousel(
    :items="carouselItems"
    :itemWidth="windowSize.width"
    :initIndex="carouselItems.findIndex(item => item.key === target)"
    enableSwipe
    @change="handleImageChange")
    template(v-slot="{ item }")
      div(class="payment__carousel-item")
        img(class="payment__carousel-item__img"
            draggable="false"
            :src="item.img")
        div(class="payment__carousel-item__title text-white") {{ item.title }}
  div(class="payment__content")
    div(class="payment__content__indicator")
      div(v-for="(url, idx) in carouselItems"
        :key="idx"
        class="payment__content__indicator__item"
        :class="{ 'payment__content__indicator__item--active': idx === idxCurrImg }")
    div(class="payment__content__plans")
      div(v-for="btnPlan in btnPlans" class="payment__btn-plan"
        :class="{selected: btnPlan.key === planSelected}"
        @tap="handleBtnPlanClick(btnPlan.key)")
        svg-icon(v-if="btnPlan.key === planSelected" class="payment__btn-plan__radio selected" iconName="vivisticker-check" iconWidth="20px" iconColor="white")
        div(v-else class="payment__btn-plan__radio")
        div(class="payment__btn-plan__content")
          div(class="payment__btn-plan__content__title")
            div(class="payment__btn-plan__content__title__main") {{ btnPlan.title }}
            div(v-if="btnPlan.subTitle" class="payment__btn-plan__content__title__sub") {{ btnPlan.subTitle }}
          div(class="payment__btn-plan__content__price") {{ btnPlan.price }}
            div(v-if="btnPlan.key === planSelected && btnPlan.tag" class="payment__btn-plan__content__price__tag") {{ btnPlan.tag }}
    div(class="payment__btn-subscribe" @touchend="handleBtnSubscribeClick")
      span {{ txtBtnSubscribe }}
    div(class="payment__footer")
      template(v-for="(footerLink, idx) in footerLinks")
        span(v-if="idx > 0" class="payment__footer__splitter")
        span(@tap="footerLink.action") {{ footerLink.title }}
  div(class="payment__panel" :class="{close: !isPanelUp}" ref="panel")
    div(class="payment__panel__chevron" @tap="togglePanel()" @swipeup="togglePanel(true)" @swipedown="togglePanel(false)")
      svg-icon(iconName="chevron-up" iconWidth="14px" iconColor="white")
    div(class="payment__panel__title") {{ $t('STK0042') }}
    div(class="payment__panel__comparison")
      div(class="payment__panel__comparison__title first-column") {{ $t('STK0043') }}
      div(class="payment__panel__comparison__title") {{ $t('STK0044') }}
      div(class="payment__panel__comparison__title") PRO
      template(v-for="comparison in comparisons")
        div(class="payment__panel__comparison__splitter")
        div(class="payment__panel__comparison__item  first-column") {{ comparison.feature }}
        div(class="payment__panel__comparison__item")
          svg-icon(v-if="comparison.free" iconName="vivisticker-check" iconWidth="20px" iconColor="white")
          template(v-else) -
        div(class="payment__panel__comparison__item")
          svg-icon(v-if="comparison.pro" iconName="vivisticker-check" iconWidth="20px" iconColor="white")
          template(v-else) -
</template>

<script lang="ts">
import Carousel from '@/components/global/Carousel.vue'
import vivistickerUtils, { IViviStickerProFeatures } from '@/utils/vivistickerUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent, PropType } from 'vue'
import { mapState, mapMutations } from 'vuex'

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
  components: {
    Carousel
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
      isPanelUp: false,
      isPanelTransitioning: false,
      carouselItems: [
        {
          key: 'frame',
          title: this.$t('STK0049'),
          img: require('@/assets/img/png/pricing/vivisticker_frame.png')
        },
        {
          key: 'text',
          title: this.$t('STK0050'),
          img: require('@/assets/img/png/pricing/tw/vivisticker_pro-text.png')
        },
        {
          key: 'object',
          title: this.$t('STK0051'),
          img: require('@/assets/img/png/pricing/vivisticker_pro-object.png')
        }
      ] as CarouselItem[],
      btnPlans: [
        {
          key: 'monthly',
          title: this.$t('NN0514'),
          subTitle: '',
          price: '$4.99',
          tag: ''
        },
        {
          key: 'annually',
          title: this.$t('NN0515'),
          subTitle: this.$t('STK0048', { day: 3 }),
          price: '$26.90',
          tag: '$2.24 / Mo'
        }
      ],
      footerLinks: [
        {
          key: 'restorePurchase',
          title: this.$t('STK0045'),
          action: this.handleRestorePurchaseClick
        },
        {
          key: 'termsOfService',
          title: this.$t('NN0160'),
          action: () => {
            window.open(this.$t('STK0053'), '_blank')
          }
        },
        {
          key: 'privacyPolicy',
          title: this.$t('NN0161'),
          action: () => {
            window.open(this.$t('STK0052'), '_blank')
          }
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
  mounted() {
    const elPanel = this.$refs.panel as HTMLElement
    elPanel.ontransitionstart = (e: Event) => {
      const elTarget = e.target as HTMLElement
      if (elTarget === elPanel) this.isPanelTransitioning = true
    }
    elPanel.ontransitionend = (e: Event) => {
      const elTarget = e.target as HTMLElement
      if (elTarget === elPanel) this.isPanelTransitioning = false
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    txtBtnSubscribe() {
      return this.planSelected === 'annually' ? this.$t('STK0046') : this.$t('STK0047')
    },
  },
  methods: {
    ...mapMutations({
      setFullPageConfig: 'vivisticker/SET_fullPageConfig'
    }),
    handleImageChange(index: number) {
      this.idxCurrImg = index
    },
    handleBtnPlanClick(key: string) {
      this.planSelected = key
    },
    handleBtnSubscribeClick() {
      vivistickerUtils.sendToIOS('SUBSCRIBE', { option: this.planSelected })
    },
    handleRestorePurchaseClick() {
      vivistickerUtils.sendToIOS('SUBSCRIBE', { option: 'checkState' })
    },
    handleSwipe(e: AnyTouchEvent) {
      e.stopPropagation()
    },
    togglePanel(up?: boolean) {
      if (this.isPanelTransitioning) return
      if (up !== undefined) {
        this.isPanelUp = up
        return
      }
      this.isPanelUp = !this.isPanelUp
    },
    handleShowWelcome() {
      this.setFullPageConfig({ type: 'welcome' })
    },
  }
})
</script>

<style lang="scss" scoped>
.payment {
  @include size(100%);
  display: flex;
  flex-direction: column;
  font-family: 'Poppins';
  &__carousel-item {
    display: flex;
    justify-content: center;
    width: inherit;
    height: 45vh;
    &__img {
      width: 100%;
      object-fit: cover;
      object-position: bottom;
    }
    &__title {
      position: absolute;
      bottom: -18px;
      width: calc(100% - 48px);
      margin: 0px 24px;
      text-align: left;
      font-weight: 600;
      font-size: 18px;
      line-height: 140%;
    }
  }
  &__content {
    margin: 0px 24px;
    &__indicator {
      margin: 42px auto 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      column-gap: 8px;
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
      margin-top: 40px;
    }
  }
  &__btn-plan {
    box-sizing: border-box;
    height: 60px;
    display: grid;
    grid-template-columns: 20px 1fr;
    align-items: center;
    column-gap: 16px;
    padding: 12px 24px 12px 16px;
    color: setColor(black-5);
    &.selected {
      background: white;
      border-radius: 10px;
      color: setColor(black-3);
    }
    &__radio {
      @include size(20px);
      box-sizing: border-box;
      border: 2px solid setColor(black-5);
      border-radius: 100px;
      &.selected {
        background-color: setColor(black-3);
        border-color: setColor(black-3);
      }
    }
    &__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      &__title {
        display: flex;
        flex-direction: column;
        row-gap: 2px;
        text-align: left;
        text-transform: capitalize;
        &__main {
          height: 18px;
          font-weight: 600;
          font-size: 14px;
          line-height: 19px;
        }
        &__sub {
          font-weight: 500;
          font-size: 11px;
          line-height: 16px;
          color: setColor(black-5);
        }
      }
      &__price {
        position: relative;
        text-align: right;
        font-weight: 600;
        font-size: 16px;
        line-height: 140%;
        &__tag {
          position: absolute;
          left: 50%;
          top: -9px;
          padding: 0px 8px;
          transform: translateX(-50%) translateY(-100%);
          background: setColor(alarm);
          border-radius: 5px;
          font-weight: 500;
          font-size: 10px;
          line-height: 24px;
          white-space: nowrap;
        }
      }
    }
  }
  &__btn-subscribe {
    width: fit-content;
    margin: 20px auto 0 auto;
    padding: 4px 16px;
    background: white;
    border-radius: 10px;
    @include text-H6;
    display: flex;
    align-items: center;
    text-align: center;
    color: setColor(black-3);
    >span {
      width: 100%;
    }
    &:active {
      opacity: 0.8;
    }
  }
  &__footer {
    margin: 20px auto 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 10px;
    line-height: 15px;
    color: setColor(black-5);
    column-gap: 10px;
    &__splitter {
      @include size(0px, 12px);
      border: 1px solid #474747;
      border-radius: 1px;
    }
  }
  &__panel {
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    box-sizing: border-box;
    // min-height: 57%;
    padding: 16px 24px 0px 24px;
    color: white;
    background-color: setColor(black-3);
    border-radius: 10px 10px 0px 0px;
    transition: all 300ms ease-in-out;
    &.close {
      left: 24px;
      right: 24px;
      transform: translateY(calc(100% - 48px));
    }
    &__chevron {
      position: absolute;
      top: 0;
      left: 50%;
      padding: 6px 22px;
      transform: translate(-50%, -50%);
      background-color: setColor(black-3);
      border-radius: 100px;
      >svg {
        transform: v-bind("isPanelUp ? 'rotate(180deg)' : 'none'");
      }
    }
    &__title {
      width: 100%;
      height: v-bind("isPanelUp ? 0 : '20px'");
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
      line-height: 170%;
      letter-spacing: 0.8px;
      text-transform: capitalize;
      overflow: hidden;
      transition: height 200ms ease-in-out;
    }
    &__comparison {
      display: grid;
      grid-template-columns: 1fr 80px 80px;
      grid-template-rows: min-content;
      column-gap: 8px;
      padding-top: 11px;
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
}
</style>
