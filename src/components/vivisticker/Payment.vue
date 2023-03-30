<template lang="pug">
div(class="payment")
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
        :class="{selected: btnPlan.key === btnSelected}"
        @touchend="handleBtnPlanClick(btnPlan.key)")
        svg-icon(v-if="btnPlan.key === btnSelected" class="payment__btn-plan__radio selected" iconName="vivisticker-check" iconWidth="20px" iconColor="white")
        div(v-else class="payment__btn-plan__radio")
        div(class="payment__btn-plan__content")
          div(class="payment__btn-plan__content__title")
            div(class="payment__btn-plan__content__title__main") {{ btnPlan.title }}
            div(class="payment__btn-plan__content__title__sub") {{ btnPlan.subTitle }}
          div(class="payment__btn-plan__content__price") {{ btnPlan.price }}
            div(v-if="btnPlan.key === btnSelected && btnPlan.tag" class="payment__btn-plan__content__price__tag") {{ btnPlan.tag }}
    div(class="payment__btn-subscribe" @touchend="handleBtnSubscribeClick")
      span Try free & Subscribe
    div(class="payment__footer")
      template(v-for="(footerLink, idx) in footerLinks")
        span(v-if="idx > 0" class="payment__footer__splitter")
        span(@touchend="footerLink.action") {{ footerLink.title }}
</template>

<script lang="ts">
import Carousel from '@/components/global/Carousel.vue'
import { IViviStickerProFeatures } from '@/utils/vivistickerUtils'
import { defineComponent, PropType } from 'vue'
import { mapState } from 'vuex'

interface CarouselItem {
  key: IViviStickerProFeatures
  title: string
  img: string
}

export default defineComponent({
  components: {
    Carousel
  },
  props: {
    target: {
      type: String as PropType<IViviStickerProFeatures>,
      default: 'object'
    }
  },
  data() {
    return {
      carouselItems: [
        {
          key: 'object',
          title: 'Premium stickers & background',
          img: require('@/assets/img/png/pricing/vivisticker_pro-object.png')
        },
        {
          key: 'frame',
          title: 'Frame your photos to any shape',
          img: require('@/assets/img/png/pricing/vivisticker_frame.png')
        },
        {
          key: 'text',
          title: 'Stylish texts & advanced text effects',
          img: require('@/assets/img/png/pricing/tw/vivisticker_pro-text.png')
        }
      ] as CarouselItem[],
      idxCurrImg: 0,
      btnSelected: 'yearly',
      btnPlans: [
        {
          key: 'monthly',
          title: this.$t('NN0514'),
          subTitle: '',
          price: '$4.99',
          tag: ''
        },
        {
          key: 'yearly',
          title: this.$t('NN0515'),
          subTitle: this.$t('NN0517', { day: 3 }),
          price: '$26.90',
          tag: '$2.24 / Mo'
        }
      ],
      footerLinks: [
        {
          key: 'restorePurchase',
          title: 'Restore Purchase',
          action: this.handleRestorePurchaseClick
        },
        {
          key: 'termsOfService',
          title: 'Terms of Service',
          action: () => {
            window.open('https://vivisticker.com/tw/使用協議/', '_blank')
          }
        },
        {
          key: 'privacyPolicy',
          title: 'Privacy Policy',
          action: () => {
            window.open('https://vivisticker.com/tw/隱私權聲明/', '_blank')
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
  },
  methods: {
    handleImageChange(index: number) {
      this.idxCurrImg = index
    },
    handleBtnPlanClick(key: string) {
      this.btnSelected = key
    },
    handleBtnSubscribeClick() {
      console.log('handleBtnSubscribeClick')
    },
    handleRestorePurchaseClick() {
      console.log('handleRestorePurchaseClick')
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
    max-height: 45vh;
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
          font-weight: 600;
          font-size: 14px;
          line-height: 21px;
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
    font-weight: 600;
    font-size: 16px;
    line-height: 140%;
    display: flex;
    align-items: center;
    text-align: center;
    color: setColor(black-3);
    >span {
      width: 100%;
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
}
</style>
