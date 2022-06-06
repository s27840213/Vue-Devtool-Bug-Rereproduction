<template lang="pug">
  div(class="popup-window")
    div(class="wrapper1" )
      div(class="wrapper2")
        div(class="close pointer")
          svg-icon(iconName="close" iconWidth="36px" iconColor="gray-0"
                  @click.native="closePopup()")
        div(class="payment" v-click-outside="closePopup")
          div(class="payment-left")
            div(class="payment-left-top")
              div(class="payment-left-top__step")
                svg-icon(v-if="showPreStep" iconName="left-arrow" iconWidth="24px"
                        iconColor="gray1" @click.native="preStep()")
                span(v-if="totalStep") {{$t('NN0544')}} {{currentStep}} of {{totalStep}}
              div(class="payment-left-top__title" v-html="title")
              div(v-if="description" class="payment-left-top__description") {{description}}
            //- switch(view)
            div(class="payment-left-content" :view="view")
              //- case step1 or switch1
              template(v-if="['step1', 'switch1'].includes(view)")
                div(v-for="p in periodInput" :isSelected="p.value === userPeriod"
                    class="payment-left-content-period pointer"
                    @click="setPeriod(p.value)")
                  svg-icon(iconWidth="20px"
                          :iconName="p.value === userPeriod ? 'radio-checked' : 'radio'"
                          :iconColor="p.value === userPeriod ? 'white' : 'gray-4'")
                  div(class="payment-left-content-period-price")
                    span(class="payment-left-content-period-price__label") {{p.label}} {{curPlan(p.value)}}
                    span(class="payment-left-content-period-price__amount") {{`$${plans[planSelected][p.value].now}`}}
                      span(class="payment-left-content-period-price__end") {{`${$t('NN0516')}${p.value==='yearly' ? $t('NN0548') : ''}`}}
                  span(v-if="p.value==='yearly'"
                      class="payment-left-content-period__off") {{$t('NN0549')}}
              //- case step2
              template(v-if="view === 'step2'")
                PaymentField(@next="changeView('finish')")
              //- case switch2
              template(v-if="view === 'switch2'")
                card-info(:card="card")
                div(class="payment-left-content-switch2")
                  span(v-if="switchPaidDate") {{$t('NN0552', {date: switchPaidDate})}}
                  span(v-else) {{$t('NN0553')}}
                  span {{`$${switchPrice}`}}
              //- case cancel1 or brandkit or bgrm
              template(v-if="showFeature")
                div(v-for="can in cancel1" class="payment-left-content-cancel")
                  svg-icon(iconName="pro" iconWidth="24px")
                  span {{can}}
              //- case cancel2
              template(v-if="view === 'cancel2'")
                div(v-for="can, idx in cancel2" class="payment-left-content-cancel")
                  radio-btn(:isSelected="reasonIndex === idx"
                            :formatKey="String(idx)" circleColor="gray-4"
                            @select="selectCancelReason(idx)")
                  span {{can}}
                input(class="payment-left-content-cancel__other"
                      v-model="otherReason" :placeholder="$t('NN0584')")
            div(class="payment-left-button")
              btn(v-for="button in buttons" :type="button.type || 'primary-lg'"
                  @click.native="button.func()"
                  :disabled="button.disabled ? button.disabled() : false")
                span {{button.text}}
          img(class="payment-right" :src="require(`@/assets/img/jpg/pricing/${locale}/${img}`)")
          div(v-if="view === 'finish'" class="payment-finish")
            div(class="payment-finish-content")
              animation(path="/lottie/pro.json")
              span {{$t('NN0562')}}
              btn(type="primary-mid" @click.native="closePopup()") {{$t('NN0563')}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { createHelpers } from 'vuex-map-fields'
import i18n from '@/i18n'
import vClickOutside from 'v-click-outside'
import PaymentField from '@/components/payment/PaymentField.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import Animation from '@/components/Animation.vue'
import CardInfo from '@/components/payment/CardInfo.vue'
import paymentData from '@/utils/constantData'

const { mapFields } = createHelpers({
  getterType: 'payment/getField',
  mutationType: 'payment/updateField'
})

export default Vue.extend({
  name: 'PopupPayment',
  components: {
    PaymentField,
    RadioBtn,
    Animation,
    CardInfo
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
      buttons: [{}] as {type?: string, disabled?: ()=>boolean, text: string, func: ()=>void}[],
      img: 'remover.jpg',
      // View constant
      periodInput: paymentData.periodOptions(),
      cancel1: paymentData.cancel1(),
      cancel2: paymentData.cancel2(),
      // User input
      reasonIndex: '-1',
      otherReason: ''
    }
  },
  computed: {
    ...mapGetters({
      isBundle: 'payment/getIsBundle'
    }),
    ...mapFields({
      periodUi: 'periodUi'
    }),
    ...mapState('payment', {
      initView: 'initView',
      userCountryUi: 'userCountryUi',
      userCountryInfo: 'userCountryInfo',
      switchPaidDate: 'switchPaidDate',
      switchPrice: 'switchPrice',
      card: 'cardInfo',
      plans: 'plans',
      planSelected: 'planSelected',
      trialStatus: 'trialStatus'
    }),
    locale():string { return i18n.locale },
    userPeriod():string {
      return ['switch1', 'switch2'].includes(this.view)
        ? (this.isBundle ? 'monthly' : 'yearly')
        : this.periodUi
    },
    showPreStep(): boolean {
      return ['step2', 'switch2'].includes(this.view)
    },
    showFeature(): boolean {
      return ['cancel1', 'brandkit', 'bgrm'].includes(this.view)
    },
    cancelReason(): string {
      return Number(this.reasonIndex) < this.cancel2.length - 1
        ? this.cancel2[Number(this.reasonIndex)] as string
        : this.otherReason
    }
  },
  mounted() {
    this.changeView(this.initView)
  },
  methods: {
    ...mapActions({
      getBillingInfo: 'payment/getBillingInfo',
      init: 'payment/init',
      getSwitchPrice: 'payment/getSwitchPrice',
      switch: 'payment/switch',
      cancelApi: 'payment/cancel',
      getPrice: 'payment/getPrice'
    }),
    ...mapMutations({
      setInitView: 'SET_initView'
    }),
    getAd(name: string): string[] {
      switch (name) {
        case 'brandkit':
          return [i18n.t('NN0583') as string, 'brandkit.jpg']
        case 'bgrm':
          return [i18n.t('NN0652') as string, 'remover.jpg']
        case 'pro template':
        default:
          return [i18n.t('NN0653') as string, 'pro-template.jpg']
      }
    },
    async changeView(name: string) {
      this.view = name
      switch (name) {
        case 'brandkit':
        case 'bgrm':
        case 'pro template':
          this.title = i18n.tc('NN0507', 2) as string
          [this.description, this.img] = this.getAd(name)
          this.buttons = [{
            text: i18n.t('NN0561') as string,
            func: () => this.changeView('step1')
          }]
          break
        case 'step1':
          this.getPrice(this.userCountryUi)
          this.init()
          this.currentStep = 1
          this.totalStep = 2
          this.title = i18n.t('NN0545') as string
          this.description = (this.trialStatus === 'not used' ? i18n.t('NN0546') : i18n.t('NN0547')) as string
          this.buttons = [{
            text: i18n.t('NN0550') as string,
            func: () => this.changeView('step2')
          }]
          this.img = 'remover.jpg'
          break
        case 'step2':
          this.currentStep = 2
          this.title = i18n.t('NN0551') as string
          this.description = ''
          this.buttons = [] // Use button in PaymentField.vue
          this.img = 'pro-template.jpg'
          break
        case 'finish':
          this.getBillingInfo()
          break
        case 'switch1':
          this.title = i18n.t('NN0564', { period: this.isBundle ? i18n.t('NN0514') : i18n.t('NN0515') }) as string
          this.description = (this.isBundle ? i18n.t('NN0566') : i18n.t('NN0565')) as string
          this.buttons = [{
            text: i18n.t('NN0567', { period: this.isBundle ? i18n.t('NN0514') : i18n.t('NN0515') }) as string,
            func: () => this.changeView('switch2')
          }]
          await this.getPrice(this.userCountryInfo)
          this.getSwitchPrice()
          break
        case 'switch2':
          this.title = i18n.t('NN0551') as string
          this.description = i18n.t('NN0568') as string
          this.buttons = [{
            text: i18n.t('NN0564', { period: this.isBundle ? i18n.t('NN0514') : i18n.t('NN0515') }) as string,
            func: async () => {
              await this.switch()
              this.closePopup() // refresh or double check?
            }
          }]
          this.img = 'pro-template.jpg'
          break
        case 'cancel1':
          this.title = i18n.t('NN0569') as string
          this.buttons = [{
            text: i18n.t('NN0575') as string,
            func: () => this.closePopup()
          }, {
            type: 'light-lg',
            text: i18n.t('NN0574') as string,
            func: () => this.changeView('cancel2')
          }]
          this.img = 'pro-template2.jpg'
          break
        case 'cancel2':
          this.title = i18n.t('NN0576') as string
          this.buttons[1].disabled = () => ['', undefined].includes(this.cancelReason)
          this.buttons[1].func = this.cancel
          this.img = 'brandkit.jpg'
          break
      }
    },
    setPeriod(value: string) {
      if (this.view === 'step1') { this.periodUi = value }
    },
    preStep() {
      if (this.view === 'step2') this.changeView('step1')
      else if (this.view === 'switch2') this.changeView('switch1')
    },
    curPlan(period: string):string {
      return this.view === 'switch1' && period !== this.userPeriod ? `(${i18n.t('NN0655')})` : ''
    },
    selectCancelReason(index: string) {
      this.reasonIndex = index
    },
    cancel() {
      // todo test no reason
      this.cancelApi(this.cancelReason).then(
        this.closePopup
      ).catch(msg => Vue.notify({ group: 'error', text: msg }))
    },
    closePopup() { this.$emit('close') }
  }
})
</script>

<style lang="scss" scoped>
.wrapper1 {
  position: relative;
  .close {
    position: absolute;
    top: -18px; right: -18px;
    width: 36px; height: 36px;
    background-color: setColor(white);
    border-radius: 100px;
    z-index: 1;
  }
  .wrapper2 {
    @include hide-scrollbar;
    // position: relative;
    width: min(792px, 90vw);
    height: min(704px, min(80vw, 90vh));
  }
}

.payment {
  display: flex;
  position: relative;
  width: min(792px, 90vw);
  height: min(704px, 80vw);
  flex-shrink: 0;
  background-color: white; // ?
  // overflow: auto; // ?
  text-align: left;
}

.payment-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  // align-items: center;
  width: calc(50% - 40px);
  padding: 12% 30px 15% 30px;
  &-top, &-content, &-button { width: 100%; }
  &-top {
    @include body-MD;
    position: relative;
    margin-bottom: 28px;
    color: setColor(gray-1);
    &__step {
      display: flex;
      align-items: center;
      position: absolute;
      top: -40px;
      >svg { margin-right: 15px; }
    }
    &__title { @include text-H4; }
    &__description { margin-top: 16px; }
  }
  &-content {
    height: 100%;
    input {
      &:focus { border-color: setColor(blue-1); }
      &:invalid { border-color: red; }
    }
  }
  &-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    >button {
      @include btn-LG;
      width: 100%;
      border-radius: 4px;
      margin-top: 2px;
    }
    >button:nth-child(1) { margin-top: 42px; }
    >button:nth-child(2) {
      border: none;
      &.btn-inactive-lg{
        background-color: white;
        color: setColor(gray-3);
      }
    }
  }
}

.payment-left-content-period {
  display: flex;
  align-items: center;
  height: 52px; // ?
  padding: 10px;
  border: 1px solid setColor(gray-3);
  border-radius: 4px;
  +div { margin-top: 25px }
  &-price {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 10px;
    &__label {
      @include btn-LG;
      text-transform: capitalize;
    }
    &__amount { @include text-H6; }
    &__end { @include body-XS; }
  }
  &__off {
    @include overline-SM;
    white-space: nowrap;
  }
  &:not([isSelected]) &__off { color: setColor(red-1); }
  &[isSelected] {
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
  @include body-MD;
  display: flex;
  margin-bottom: 10px;
  >svg, >div {
    flex-shrink: 0;
    margin-right: 15px;
  }
  &__other {
    @include body-SM; // ask kitty
    width: calc(100% - 22px);
    height: 20px; // ask kitty
    margin: 5px 0; // ask kitty
    padding: 10px;
    border: 1px solid setColor(gray-3);
    border-radius: 4px;
  }
}

.payment-finish {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%; height: 100%;
  background-color: white;
  &-content {
    @include body-SM;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    width: 560px;
    height: 310px;
    >button { @include btn-LG; }
  }
}

@media screen and (max-width: 768px) {
  .wrapper1 {
    position: absolute;
    bottom: 0;
    width: 100%; height: calc(100% - #{$header-height});
    .wrapper2  { width: 100%; height: 100%; }
    .payment  {
      width: 100%;
      height: fit-content;
      min-height: 100%;
    }
    .close {
      background-color: transparent;
      right: 0px; top: 0px;
      width: 40px; height: 40px;
      >svg { transform: scale(0.667); }
    }
  }
  .payment-left {
    width: 100%;
    padding: 105px 7.467% 175px 7.467%;
  }
  .payment-right { display: none; }
  .payment-finish span { width: 80%;}
}
</style>
